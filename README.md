# 🧾 AI Invoice Parser

> **Extract structured data from invoices using a fine-tuned Qwen2.5-0.5B-Instruct model.**

A full-stack application that demonstrates end-to-end ML engineering: from LoRA fine-tuning an open-source LLM to deploying it in a production-grade microservices architecture.

[![Model](https://img.shields.io/badge/🤗_Model-Qwen2.5--0.5B--Instruct-blue)](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Fine-tuned Adapter](https://img.shields.io/badge/🤗_Adapter-invoice--qwen--lora-orange)](https://huggingface.co/coolsourav100/invoice-qwen-lora)

---

## ✨ Features

- **AI-Powered Extraction** — Fine-tuned Qwen2.5-0.5B-Instruct extracts vendor, dates, line items, tax, and totals from invoice text
- **LoRA Fine-Tuning** — Trained on 400 synthetic invoices in 5 format variations, under 1 hour on a free Colab T4 GPU
- **Microservices Architecture** — React frontend → Node.js API gateway → Python inference server → PostgreSQL
- **OCR Pipeline** — Tesseract OCR converts uploaded images/PDFs to text before AI extraction
- **Full CRUD** — Upload, view, edit, search, sort, and delete invoices with a premium dark UI

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│   React + Vite   │────▶│  Node.js/Express │────▶│  Python FastAPI Server   │
│   Port 5173      │     │  Port 3001       │     │  Port 8000               │
│                  │     │                  │     │                          │
│  • Upload UI     │     │  • REST API      │     │  • Qwen2.5-0.5B-Instruct│
│  • Dashboard     │     │  • File storage  │     │  • LoRA Adapter          │
│  • History       │     │  • PostgreSQL    │     │  • Tesseract OCR         │
└──────────────────┘     └──────────────────┘     └──────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │  PostgreSQL 16  │
                         │  (Docker)       │
                         └────────────────┘
```

**Per-invoice pipeline:**
1. Upload image/PDF → Node.js saves file
2. Node.js forwards file to Python inference server
3. **Tesseract OCR** extracts raw text from the image
4. Raw text → **fine-tuned Qwen2.5-0.5B-Instruct** → structured JSON
5. JSON validated, stored in PostgreSQL, returned to React UI

## 🧠 Model Details

| Attribute | Value |
|-----------|-------|
| **Base Model** | [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) |
| **License** | Apache 2.0 (ungated) |
| **Fine-tuning Method** | LoRA (r=16, alpha=32) |
| **Target Modules** | q_proj, v_proj, k_proj, o_proj |
| **Training Data** | 400 synthetic invoices, 5 format styles |
| **Eval Data** | 50 held-out examples |
| **Training Time** | ~30–45 min on Google Colab T4 |
| **Trainable Params** | < 1% of total model parameters |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Vanilla CSS |
| API Gateway | Node.js, Express |
| Inference | Python, FastAPI, Transformers, PEFT |
| OCR | Tesseract (pytesseract) |
| Database | PostgreSQL 16 (Docker) |
| Training | Google Colab, LoRA/PEFT, SFTTrainer |

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18+
- **Python**: Version 3.10+
- **Docker & Docker Compose**: For running the PostgreSQL database container.
- **OCR & PDF Extraction Dependencies**: The application uses Tesseract for image-based OCR and Poppler for PDF image rendering. Follow the platform-specific instructions below:

#### 🍎 macOS (Homebrew)
Install Tesseract and Poppler via Homebrew:
```bash
brew install tesseract poppler
```

#### 🐧 Linux (Debian/Ubuntu)
Install via `apt-get`:
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr poppler-utils
```

#### 🪟 Windows
1. **Tesseract OCR**:
   - Download and run the installer from the [UB Mannheim Tesseract repository](https://github.com/UB-Mannheim/tesseract/wiki).
   - Add the Tesseract installation folder (typically `C:\Program Files\Tesseract-OCR`) to your system's Environment Variables `PATH`.
2. **Poppler**:
   - Download the latest binary package for Windows (e.g., from [Alivate Poppler for Windows](http://blog.alivate.com.au/poppler-windows/) or [conda-forge poppler](https://anaconda.org/conda-forge/poppler)).
   - Extract the archive to a folder (e.g., `C:\Program Files\poppler`).
   - Add the `bin` directory of the extracted files (e.g., `C:\Program Files\poppler\Library\bin` or similar) to your system's Environment Variables `PATH`.
3. **Restart your terminal** or editor to load the updated Environment Variables.

### 1. Clone & Install

```bash
git clone https://github.com/coolsourav100/ai-invoice-parser.git
cd ai-invoice-parser

# Copy environment config
cp .env.example .env

# Install Node.js dependencies
npm run install:all
```

### 2. Start Database (PostgreSQL)

```bash
docker compose up -d
```

### 3. Start AI Inference Server (Python FastAPI)

```bash
cd inference
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

### 4. Start Full-Stack App (React Frontend + Node.js API)

```bash
# From project root
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:3001
```

## 🎓 Training the Model

The fine-tuning notebook is designed to run end-to-end on a **free Google Colab T4 GPU**:

1. Open [`training/invoice_finetune.ipynb`](training/invoice_finetune.ipynb) in Google Colab
2. Select **Runtime → Change runtime type → T4 GPU**
3. Run all cells (~30-45 minutes)
4. The adapter is pushed to your Hugging Face Hub account

```bash
cd training
python generate_dataset.py --num-train 400 --num-eval 50
```

## 💻 Using the Model in Python

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

# 1. Setup IDs
base_model_id = "Qwen/Qwen2.5-0.5B-Instruct"
adapter_id = "coolsourav100/invoice-qwen-lora" # Or your local path: "./invoice-lora-adapter"

# 2. Load Tokenizer and Base Model
tokenizer = AutoTokenizer.from_pretrained(base_model_id, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    torch_dtype=torch.float16,
    device_map="auto",
    trust_remote_code=True
)

# 3. Load the LoRA Adapter
model = PeftModel.from_pretrained(base_model, adapter_id)
model.eval()

print("✅ Model and Adapter loaded successfully!")
```

## 📁 Project Structure

```
ai-invoice-parser/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Navbar, StatsCard, DropZone, etc.
│   │   ├── pages/           # Dashboard, Upload, InvoiceDetail, History
│   │   ├── services/        # API client
│   │   └── index.css        # Design system
│   └── index.html
├── server/                  # Node.js API gateway
│   ├── db/                  # PostgreSQL schema & pool
│   ├── routes/              # Invoice REST endpoints
│   ├── middleware/           # Multer file upload
│   └── index.js
├── inference/               # Python inference server
│   ├── main.py              # FastAPI app
│   ├── model.py             # Qwen2.5 + LoRA loading
│   ├── ocr.py               # Tesseract OCR wrapper
│   └── Dockerfile
├── training/                # Model training pipeline
│   ├── invoice_finetune.ipynb  # Colab notebook
│   ├── generate_dataset.py    # Synthetic data generator
│   └── requirements.txt
├── docker-compose.yml       # PostgreSQL container
└── .env.example             # Environment template
```

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgements

- [Qwen Team](https://huggingface.co/Qwen) for the Qwen2.5 model family
- [Hugging Face](https://huggingface.co) for transformers, PEFT, and the Hub
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) for open-source OCR
