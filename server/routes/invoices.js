const express = require("express");
const router = express.Router();
const pool = require("../db");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

const INFERENCE_URL = process.env.INFERENCE_URL || "http://localhost:8000";

// ─── POST /api/invoices/upload ──────────────────────────────────────────────
// Upload an invoice file → send to inference server → save results to DB
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    // Send file to Python inference server
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const inferenceResponse = await fetch(`${INFERENCE_URL}/extract`, {
      method: "POST",
      body: formData,
    });

    if (!inferenceResponse.ok) {
      const errBody = await inferenceResponse.json().catch(() => ({}));
      throw new Error(errBody.detail || `Inference server returned ${inferenceResponse.status}`);
    }

    const result = await inferenceResponse.json();
    const data = result.data;

    // Insert invoice into DB
    const invoiceResult = await pool.query(
      `INSERT INTO invoices 
       (file_name, file_path, vendor_name, invoice_number, invoice_date, due_date,
        subtotal, tax, total, currency, raw_text, status, ocr_time_ms, model_time_ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        req.file.originalname,
        req.file.filename,
        data.vendor_name || "",
        data.invoice_number || "",
        data.invoice_date || null,
        data.due_date || null,
        data.subtotal || 0,
        data.tax || 0,
        data.total || 0,
        data.currency || "USD",
        result.raw_text || "",
        data.parse_error ? "needs_review" : "processed",
        result.timings?.ocr_ms || 0,
        result.timings?.model_ms || 0,
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Insert line items
    if (data.line_items && data.line_items.length > 0) {
      const lineItemValues = data.line_items.map((item) => [
        invoice.id,
        item.description || "",
        item.quantity || 0,
        item.unit_price || 0,
        item.amount || 0,
      ]);

      for (const values of lineItemValues) {
        await pool.query(
          `INSERT INTO line_items (invoice_id, description, quantity, unit_price, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          values
        );
      }
    }

    // Fetch the complete invoice with line items
    const lineItems = await pool.query(
      "SELECT * FROM line_items WHERE invoice_id = $1",
      [invoice.id]
    );

    res.status(201).json({
      success: true,
      invoice: { ...invoice, line_items: lineItems.rows },
      timings: result.timings,
    });
  } catch (err) {
    console.error("Upload/parse error:", err.message);
    // Clean up uploaded file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/invoices/stats ────────────────────────────────────────────────
// Dashboard analytics
router.get("/stats", async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*)::int AS total_invoices,
        COALESCE(SUM(total), 0)::float AS total_amount,
        COALESCE(AVG(total), 0)::float AS avg_amount,
        COUNT(CASE WHEN status = 'needs_review' THEN 1 END)::int AS needs_review
      FROM invoices
    `);

    const topVendors = await pool.query(`
      SELECT vendor_name, COUNT(*)::int AS count, SUM(total)::float AS total_amount
      FROM invoices
      WHERE vendor_name != ''
      GROUP BY vendor_name
      ORDER BY count DESC
      LIMIT 5
    `);

    const recentInvoices = await pool.query(`
      SELECT id, file_name, vendor_name, invoice_number, total, currency, status, created_at
      FROM invoices
      ORDER BY created_at DESC
      LIMIT 5
    `);

    res.json({
      ...stats.rows[0],
      top_vendors: topVendors.rows,
      recent_invoices: recentInvoices.rows,
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/invoices ──────────────────────────────────────────────────────
// List all invoices with pagination and search
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";

    // Whitelist sortable columns
    const allowedSorts = [
      "created_at", "vendor_name", "invoice_number",
      "invoice_date", "total", "status",
    ];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : "created_at";

    let whereClause = "";
    let params = [limit, offset];

    if (search) {
      whereClause = `WHERE vendor_name ILIKE $3 OR invoice_number ILIKE $3 OR file_name ILIKE $3`;
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM invoices ${whereClause}`,
      search ? [`%${search}%`] : []
    );

    const invoices = await pool.query(
      `SELECT id, file_name, vendor_name, invoice_number, invoice_date,
              total, currency, status, created_at
       FROM invoices ${whereClause}
       ORDER BY ${safeSort} ${sortOrder}
       LIMIT $1 OFFSET $2`,
      params
    );

    res.json({
      invoices: invoices.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (err) {
    console.error("List error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/invoices/:id ──────────────────────────────────────────────────
// Get single invoice with line items
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await pool.query("SELECT * FROM invoices WHERE id = $1", [id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const lineItems = await pool.query(
      "SELECT * FROM line_items WHERE invoice_id = $1",
      [id]
    );

    res.json({
      ...invoice.rows[0],
      line_items: lineItems.rows,
    });
  } catch (err) {
    console.error("Get invoice error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/invoices/:id ──────────────────────────────────────────────────
// Update invoice fields (manual correction)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vendor_name, invoice_number, invoice_date, due_date,
      subtotal, tax, total, currency, line_items,
    } = req.body;

    const result = await pool.query(
      `UPDATE invoices SET
        vendor_name = COALESCE($2, vendor_name),
        invoice_number = COALESCE($3, invoice_number),
        invoice_date = COALESCE($4, invoice_date),
        due_date = COALESCE($5, due_date),
        subtotal = COALESCE($6, subtotal),
        tax = COALESCE($7, tax),
        total = COALESCE($8, total),
        currency = COALESCE($9, currency),
        status = 'reviewed',
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, vendor_name, invoice_number, invoice_date, due_date, subtotal, tax, total, currency]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update line items if provided
    if (line_items && Array.isArray(line_items)) {
      await pool.query("DELETE FROM line_items WHERE invoice_id = $1", [id]);
      for (const item of line_items) {
        await pool.query(
          `INSERT INTO line_items (invoice_id, description, quantity, unit_price, amount)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.description, item.quantity, item.unit_price, item.amount]
        );
      }
    }

    const updatedLineItems = await pool.query(
      "SELECT * FROM line_items WHERE invoice_id = $1",
      [id]
    );

    res.json({
      ...result.rows[0],
      line_items: updatedLineItems.rows,
    });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/invoices/:id ───────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get file path before deleting
    const invoice = await pool.query(
      "SELECT file_path FROM invoices WHERE id = $1",
      [id]
    );

    if (invoice.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Delete from DB (cascade deletes line_items)
    await pool.query("DELETE FROM invoices WHERE id = $1", [id]);

    // Delete uploaded file
    if (invoice.rows[0].file_path) {
      const filePath = path.join(__dirname, "..", "uploads", invoice.rows[0].file_path);
      fs.unlink(filePath, () => {});
    }

    res.json({ success: true, message: "Invoice deleted" });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
