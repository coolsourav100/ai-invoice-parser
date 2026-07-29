"""
AI Invoice Parser — Inference Server
=====================================
FastAPI server that accepts invoice images/PDFs,
runs OCR + fine-tuned Qwen2.5-0.5B-Instruct inference,
and returns structured JSON.

Usage:
    uvicorn main:app --host 0.0.0.0 --port 8000
"""

import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from model import load_model, extract_invoice_data, get_model_status, check_model_health
from ocr import extract_text

# ─── Config ──────────────────────────────────────────────────────────────────

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "image/jpeg", "image/jpg", "image/png",
    "image/tiff", "image/bmp", "application/pdf",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# ─── App Lifecycle ───────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown."""
    logger.info("Loading model with local disk caching...")
    start = time.time()
    load_model()
    logger.info(f"Model loaded in {time.time() - start:.1f}s")
    yield
    logger.info("Shutting down inference server")


app = FastAPI(
    title="AI Invoice Parser — Inference API",
    description="OCR + fine-tuned Qwen2.5-0.5B-Instruct for invoice data extraction",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Detailed health check endpoint verifying model state, cache, and inference health."""
    status_info = get_model_status()
    is_healthy = check_model_health()
    status_info["healthy"] = is_healthy

    status_code = 200 if (status_info["loaded"] and is_healthy) else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if is_healthy else "unhealthy",
            "model_health": status_info,
        },
    )


@app.post("/extract")
async def extract_invoice(file: UploadFile = File(...)):
    """
    Extract structured data from an uploaded invoice image or PDF.

    Returns:
        JSON with extracted invoice fields, OCR text, and processing metadata.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read file
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Save to temp file (Tesseract needs file path)
    suffix = os.path.splitext(file.filename)[1] if file.filename else ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        timings = {}

        # Step 1: OCR
        logger.info(f"Processing: {file.filename} ({file.content_type})")
        t0 = time.time()
        raw_text = extract_text(tmp_path, file.content_type)
        timings["ocr_ms"] = round((time.time() - t0) * 1000)
        logger.info(f"OCR done: {len(raw_text)} chars in {timings['ocr_ms']}ms")

        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="OCR extracted no text from the file.")

        # Step 2: Model inference
        t1 = time.time()
        extracted = extract_invoice_data(raw_text)
        timings["model_ms"] = round((time.time() - t1) * 1000)
        logger.info(f"Inference done in {timings['model_ms']}ms")

        timings["total_ms"] = timings["ocr_ms"] + timings["model_ms"]

        return JSONResponse(content={
            "success": True,
            "data": extracted,
            "raw_text": raw_text,
            "timings": timings,
            "file_name": file.filename,
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Cleanup temp file
        os.unlink(tmp_path)


@app.post("/extract-text")
async def extract_from_text(body: dict):
    """
    Extract structured data from raw text (skip OCR).
    Useful for testing or when OCR is done client-side.

    Body: {"text": "invoice text here..."}
    """
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    t0 = time.time()
    extracted = extract_invoice_data(text)
    elapsed = round((time.time() - t0) * 1000)

    return JSONResponse(content={
        "success": True,
        "data": extracted,
        "timings": {"model_ms": elapsed, "total_ms": elapsed},
    })


# ─── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("INFERENCE_PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
