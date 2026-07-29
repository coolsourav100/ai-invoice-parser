"""
Model Module — Loads Qwen2.5-0.5B-Instruct + LoRA adapter and runs inference.
"""

import json
import logging
import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

logger = logging.getLogger(__name__)

# ─── System prompt (must match training) ─────────────────────────────────────

SYSTEM_PROMPT = (
    "You are an invoice data extraction assistant. "
    "Extract structured data from the provided invoice text and return ONLY valid JSON. "
    "Use this exact schema: "
    '{"vendor_name":"string","invoice_number":"string","invoice_date":"YYYY-MM-DD",'
    '"due_date":"YYYY-MM-DD or empty string","currency":"USD|EUR|GBP|CAD|AUD",'
    '"line_items":[{"description":"string","quantity":number,"unit_price":number,"amount":number}],'
    '"subtotal":number,"tax":number,"total":number}'
    " If a field is not found, use an empty string for strings and 0 for numbers."
)

# ─── Global model references & status ────────────────────────────────────────

_model = None
_tokenizer = None
_model_status = {
    "loaded": False,
    "healthy": False,
    "base_model_id": "",
    "adapter_id": "",
    "device": "cpu",
    "parameters": 0,
    "cache_dir": "",
    "cached_locally": False,
    "error": None,
}


def get_cache_dir() -> str:
    """Get the local model cache directory path."""
    default_cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "cache")
    cache_dir = os.getenv("MODEL_CACHE_DIR", default_cache)
    os.makedirs(cache_dir, exist_ok=True)
    return cache_dir


def load_model():
    """
    Load base model + LoRA adapter with local disk caching.
    Checks local cache first; if cached, loads directly from disk.
    """
    global _model, _tokenizer, _model_status

    base_model_id = os.getenv("HF_MODEL_ID", "Qwen/Qwen2.5-0.5B-Instruct")
    adapter_id = os.getenv("HF_ADAPTER_ID", "")
    cache_dir = get_cache_dir()

    _model_status["base_model_id"] = base_model_id
    _model_status["adapter_id"] = adapter_id
    _model_status["cache_dir"] = cache_dir

    logger.info(f"Model cache directory: {cache_dir}")
    logger.info(f"Loading base model: {base_model_id}")

    # Determine device and dtype
    if torch.cuda.is_available():
        device_map = "auto"
        dtype = torch.float16
        device_name = "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        device_map = "mps"
        dtype = torch.float32
        device_name = "mps"
    else:
        device_map = "cpu"
        dtype = torch.float32
        device_name = "cpu"

    _model_status["device"] = device_name
    logger.info(f"Using compute device: {device_name.upper()}")

    # 1. Load Tokenizer (check local cache first)
    try:
        _tokenizer = AutoTokenizer.from_pretrained(
            base_model_id,
            cache_dir=cache_dir,
            local_files_only=False,
            trust_remote_code=True,
        )
    except Exception as e:
        logger.warning(f"Failed to fetch tokenizer online, attempting offline cache: {e}")
        _tokenizer = AutoTokenizer.from_pretrained(
            base_model_id,
            cache_dir=cache_dir,
            local_files_only=True,
            trust_remote_code=True,
        )

    _tokenizer.pad_token = _tokenizer.eos_token

    # 2. Load Base Model (Hugging Face caches downloaded snapshots in cache_dir)
    try:
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            torch_dtype=dtype,
            device_map=device_map,
            cache_dir=cache_dir,
            local_files_only=False,
            trust_remote_code=True,
        )
        logger.info("Base model loaded into memory")
    except Exception as e:
        logger.warning(f"Network check failed, loading base model from offline cache: {e}")
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_id,
            torch_dtype=dtype,
            device_map=device_map,
            cache_dir=cache_dir,
            local_files_only=True,
            trust_remote_code=True,
        )

    # 3. Load LoRA Adapter if specified
    if adapter_id:
        logger.info(f"Loading LoRA adapter: {adapter_id}")
        try:
            _model = PeftModel.from_pretrained(
                base_model,
                adapter_id,
                cache_dir=cache_dir,
                local_files_only=False,
            )
        except Exception as e:
            logger.warning(f"Loading adapter from offline cache: {e}")
            _model = PeftModel.from_pretrained(
                base_model,
                adapter_id,
                cache_dir=cache_dir,
                local_files_only=True,
            )
        _model = _model.merge_and_unload()
        logger.info("LoRA adapter loaded and merged successfully")
    else:
        logger.warning("No HF_ADAPTER_ID set — using base model without fine-tuning")
        _model = base_model

    _model.eval()
    param_count = _model.num_parameters()
    _model_status["loaded"] = True
    _model_status["parameters"] = param_count
    _model_status["cached_locally"] = True

    # 4. Perform instant health check test on model
    health_ok = check_model_health()
    _model_status["healthy"] = health_ok
    logger.info(f"Model ready. Parameters: {param_count:,} | Health: {'OK' if health_ok else 'FAILED'}")


def check_model_health() -> bool:
    """Run a lightweight self-check prompt to verify tensor execution health."""
    global _model, _tokenizer
    if _model is None or _tokenizer is None:
        return False
    try:
        dummy_input = _tokenizer("Health check", return_tensors="pt").to(_model.device)
        with torch.no_grad():
            _ = _model.generate(**dummy_input, max_new_tokens=2, pad_token_id=_tokenizer.eos_token_id)
        return True
    except Exception as e:
        logger.error(f"Model health check failed: {e}")
        return False


def get_model_status() -> dict:
    """Return the current model status and health info."""
    return _model_status


def extract_invoice_data(raw_text: str) -> dict:
    """
    Run inference: feed invoice text to the fine-tuned model, get structured JSON.

    Args:
        raw_text: OCR-extracted text from an invoice image/PDF

    Returns:
        Parsed invoice data as a dictionary
    """
    global _model, _tokenizer

    if _model is None or _tokenizer is None:
        raise RuntimeError("Model not loaded. Call load_model() first.")

    # Build chat messages (must match training format)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Extract invoice data from the following text:\n\n{raw_text}"},
    ]

    # Apply chat template
    input_text = _tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = _tokenizer(input_text, return_tensors="pt").to(_model.device)

    # Generate
    with torch.no_grad():
        outputs = _model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.1,
            do_sample=True,
            pad_token_id=_tokenizer.eos_token_id,
        )

    # Decode only the generated tokens (skip the prompt)
    response = _tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1]:],
        skip_special_tokens=True,
    ).strip()

    logger.info(f"Model response ({len(response)} chars): {response[:200]}...")

    # Parse JSON response
    return _parse_response(response)


def _parse_response(response: str) -> dict:
    """Parse the model's JSON response with fallback repair."""
    # Try direct parse first
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON from response (model might include extra text)
    import re
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            pass

    # Try json-repair as last resort
    try:
        from json_repair import repair_json
        repaired = repair_json(response, return_objects=True)
        if isinstance(repaired, dict):
            return repaired
    except Exception:
        pass

    logger.error(f"Failed to parse model response: {response[:500]}")
    return {
        "vendor_name": "",
        "invoice_number": "",
        "invoice_date": "",
        "due_date": "",
        "currency": "USD",
        "line_items": [],
        "subtotal": 0,
        "tax": 0,
        "total": 0,
        "parse_error": True,
        "raw_response": response,
    }
