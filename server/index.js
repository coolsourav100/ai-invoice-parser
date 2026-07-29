require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const invoiceRoutes = require("./routes/invoices");

const app = express();
const PORT = process.env.NODE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/invoices", invoiceRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ai-invoice-parser-api",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 10MB." });
  }
  if (err.message?.includes("Unsupported file type")) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🧾 AI Invoice Parser API running on http://localhost:${PORT}`);
  console.log(`   Inference server: ${process.env.INFERENCE_URL || "http://localhost:8000"}`);
  console.log(`   Uploads dir: ${path.join(__dirname, "uploads")}\n`);
});
