"""
OCR & PDF Module — Extracts text from images and PDFs using pypdf and Tesseract.
"""

import io
import logging
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


def extract_text_from_image(image_path: str) -> str:
    """Extract text from an image file using Tesseract OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang="eng")
        logger.info(f"OCR extracted {len(text)} chars from image: {image_path}")
        return text.strip()
    except Exception as e:
        logger.error(f"OCR failed for image {image_path}: {e}")
        raise


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text from a PDF.
    1. Attempts direct text extraction via `pypdf` (fast, pure Python, zero binary deps).
    2. Fallbacks to `pdf2image` + `pytesseract` for scanned image PDFs.
    """
    # Method 1: Try pypdf first for native digital PDFs
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        text_pages = []
        for i, page in enumerate(reader.pages):
            extracted = page.extract_text() or ""
            if extracted.strip():
                text_pages.append(extracted.strip())

        combined_text = "\n\n".join(text_pages).strip()
        if len(combined_text) > 20:
            logger.info(f"pypdf extracted {len(combined_text)} chars from {len(reader.pages)} pages: {pdf_path}")
            return combined_text
    except Exception as e:
        logger.warning(f"pypdf extraction failed or empty, attempting OCR rendering: {e}")

    # Method 2: Fallback to pdf2image + pytesseract for scanned/image PDFs
    try:
        from pdf2image import convert_from_path
        pages = convert_from_path(pdf_path, dpi=300)
        all_text = []
        for i, page in enumerate(pages):
            text = pytesseract.image_to_string(page, lang="eng")
            all_text.append(text.strip())
            logger.info(f"OCR PDF page {i+1}/{len(pages)}: {len(text)} chars")
        combined = "\n\n".join(all_text).strip()
        logger.info(f"OCR total: {len(combined)} chars from {len(pages)} pages")
        return combined
    except ImportError:
        raise RuntimeError("pdf2image library is not installed.")
    except Exception as e:
        err_msg = str(e)
        if "pdfinfo" in err_msg.lower() or "poppler" in err_msg.lower():
            logger.error("Poppler utility not found on host machine.")
            raise RuntimeError(
                "Unable to process scanned PDF image: Poppler utility ('pdfinfo') is not installed in system PATH. "
                "On macOS, run: 'brew install poppler'. On Linux, run: 'apt-get install poppler-utils'."
            )
        logger.error(f"OCR rendering failed for PDF {pdf_path}: {e}")
        raise


def extract_text(file_path: str, content_type: str) -> str:
    """Route to the appropriate extraction function based on content type."""
    if content_type in ("application/pdf",):
        return extract_text_from_pdf(file_path)
    elif content_type in ("image/jpeg", "image/png", "image/jpg", "image/tiff", "image/bmp"):
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported content type: {content_type}")
