#!/usr/bin/env python3
"""
Synthetic Invoice Training Data Generator
==========================================
Generates realistic invoice text + structured JSON pairs for fine-tuning
Qwen2.5-0.5B-Instruct on invoice extraction.

Usage:
    python generate_dataset.py --num-train 400 --num-eval 50

Output:
    training/data/invoice_train.jsonl
    training/data/invoice_eval.jsonl
"""

import json
import random
import os
import argparse
from datetime import datetime, timedelta


# ─── Realistic Data Pools ───────────────────────────────────────────────────

VENDORS = [
    "Acme Corporation", "TechFlow Solutions", "Global Supply Co.",
    "Atlas Manufacturing", "Zenith Partners LLC", "Pinnacle Services Inc.",
    "Vertex Digital Agency", "Nova Healthcare Ltd.", "Summit Logistics",
    "Cascade Technologies", "Meridian Consulting Group", "Apex Industrial",
    "Horizon Enterprises", "Sterling & Associates", "BlueStar Wholesale",
    "Pacific Rim Trading", "Redwood Analytics", "Cobalt Engineering",
    "Sapphire Systems", "Ironclad Security", "Evergreen Supplies",
    "Quantum Networks", "Obsidian Design Studio", "Titan Construction",
    "Vanguard Solutions", "Crescent Medical Supply", "Northwind Traders",
    "Silverline Software", "Amber Logistics Inc.", "Coral Bay Imports",
]

ITEMS = [
    ("Web Development Services", 50, 250),
    ("Cloud Hosting (Monthly)", 10, 150),
    ("UI/UX Design Package", 500, 5000),
    ("Data Analytics Report", 200, 2000),
    ("Security Audit", 1000, 8000),
    ("API Integration Setup", 300, 3000),
    ("Server Maintenance", 100, 500),
    ("SSL Certificate (Annual)", 50, 300),
    ("Custom Widget A", 5, 100),
    ("Custom Widget B", 10, 200),
    ("Premium Support Plan", 100, 1000),
    ("Software License (Annual)", 200, 5000),
    ("Training Session (Per Hour)", 50, 300),
    ("Consulting Services", 100, 500),
    ("Office Supplies Bundle", 20, 200),
    ("Network Cable (100ft)", 15, 50),
    ("Wireless Router Pro", 80, 250),
    ("Backup Storage (1TB)", 5, 50),
    ("Print Services (500 pages)", 10, 100),
    ("Domain Registration", 10, 30),
    ("Email Hosting (Monthly)", 5, 25),
    ("Graphic Design (Per Project)", 200, 3000),
    ("Video Production", 500, 10000),
    ("SEO Optimization Package", 300, 2000),
    ("Mobile App Prototype", 2000, 15000),
    ("Database Migration", 500, 5000),
    ("Load Testing Suite", 200, 1500),
    ("Quality Assurance Testing", 100, 800),
    ("Technical Documentation", 50, 500),
    ("Hardware Component X-100", 25, 300),
]

CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"]
CURRENCY_SYMBOLS = {"USD": "$", "EUR": "€", "GBP": "£", "CAD": "C$", "AUD": "A$"}

TAX_RATES = [0.0, 0.05, 0.06, 0.07, 0.075, 0.08, 0.085, 0.09, 0.10, 0.12, 0.13, 0.15, 0.18, 0.20]

INVOICE_FORMATS = ["standard", "compact", "detailed", "minimal", "tabular"]

ADDRESSES = [
    "123 Main Street, Suite 200, New York, NY 10001",
    "456 Oak Avenue, San Francisco, CA 94102",
    "789 Elm Drive, Chicago, IL 60601",
    "321 Pine Road, Austin, TX 78701",
    "654 Maple Lane, Seattle, WA 98101",
    "987 Cedar Blvd, Boston, MA 02101",
    "147 Birch Court, Denver, CO 80201",
    "258 Walnut Way, Portland, OR 97201",
    "369 Spruce Place, Miami, FL 33101",
    "741 Ash Circle, Atlanta, GA 30301",
]

PAYMENT_TERMS = [
    "Net 15", "Net 30", "Net 45", "Net 60",
    "Due on Receipt", "2/10 Net 30", "Payment upon delivery",
]

SYSTEM_PROMPT = (
    "You are an invoice data extraction assistant. "
    "Extract structured data from the provided invoice text and return ONLY valid JSON. "
    "Use this exact schema: "
    '{{"vendor_name":"string","invoice_number":"string","invoice_date":"YYYY-MM-DD",'
    '"due_date":"YYYY-MM-DD or empty string","currency":"USD|EUR|GBP|CAD|AUD",'
    '"line_items":[{{"description":"string","quantity":number,"unit_price":number,"amount":number}}],'
    '"subtotal":number,"tax":number,"total":number}}'
    " If a field is not found, use an empty string for strings and 0 for numbers."
)


# ─── Invoice Text Generators ────────────────────────────────────────────────

def generate_invoice_data():
    """Generate random invoice data."""
    vendor = random.choice(VENDORS)
    invoice_num = f"{random.choice(['INV', 'IN', '#', 'Invoice #', ''])}{random.randint(1000, 99999)}"
    
    base_date = datetime(2023, 1, 1) + timedelta(days=random.randint(0, 730))
    invoice_date = base_date.strftime("%Y-%m-%d")
    
    has_due_date = random.random() > 0.15
    if has_due_date:
        due_days = random.choice([15, 30, 45, 60])
        due_date = (base_date + timedelta(days=due_days)).strftime("%Y-%m-%d")
    else:
        due_date = ""
    
    currency = random.choice(CURRENCIES)
    symbol = CURRENCY_SYMBOLS[currency]
    
    num_items = random.randint(1, 6)
    selected_items = random.sample(ITEMS, min(num_items, len(ITEMS)))
    
    line_items = []
    for desc, min_price, max_price in selected_items:
        qty = round(random.uniform(1, 20), 0) if random.random() > 0.3 else round(random.uniform(0.5, 100), 2)
        qty = int(qty) if qty == int(qty) else qty
        unit_price = round(random.uniform(min_price, max_price), 2)
        amount = round(qty * unit_price, 2)
        line_items.append({
            "description": desc,
            "quantity": qty,
            "unit_price": unit_price,
            "amount": amount,
        })
    
    subtotal = round(sum(item["amount"] for item in line_items), 2)
    tax_rate = random.choice(TAX_RATES)
    tax = round(subtotal * tax_rate, 2)
    total = round(subtotal + tax, 2)
    
    return {
        "vendor": vendor,
        "invoice_number": invoice_num,
        "invoice_date": invoice_date,
        "due_date": due_date,
        "currency": currency,
        "symbol": symbol,
        "line_items": line_items,
        "subtotal": subtotal,
        "tax": tax,
        "tax_rate": tax_rate,
        "total": total,
        "address": random.choice(ADDRESSES),
        "payment_terms": random.choice(PAYMENT_TERMS),
    }


def format_standard(data):
    """Standard invoice format with clear headers."""
    s = data["symbol"]
    lines = [
        f"INVOICE",
        f"",
        f"From: {data['vendor']}",
        f"Address: {data['address']}",
        f"",
        f"Invoice Number: {data['invoice_number']}",
        f"Date: {data['invoice_date']}",
    ]
    if data["due_date"]:
        lines.append(f"Due Date: {data['due_date']}")
    lines.append(f"Payment Terms: {data['payment_terms']}")
    lines.append("")
    lines.append(f"{'Description':<35} {'Qty':>6} {'Price':>12} {'Amount':>12}")
    lines.append("-" * 68)
    
    for item in data["line_items"]:
        lines.append(
            f"{item['description']:<35} {item['quantity']:>6} "
            f"{s}{item['unit_price']:>10.2f} {s}{item['amount']:>10.2f}"
        )
    
    lines.append("-" * 68)
    lines.append(f"{'Subtotal:':>55} {s}{data['subtotal']:>10.2f}")
    if data["tax"] > 0:
        lines.append(f"{'Tax (' + str(round(data['tax_rate'] * 100, 1)) + '%):':>55} {s}{data['tax']:>10.2f}")
    lines.append(f"{'TOTAL:':>55} {s}{data['total']:>10.2f}")
    
    return "\n".join(lines)


def format_compact(data):
    """Compact format, fewer separators."""
    s = data["symbol"]
    lines = [
        f"{data['vendor']}",
        f"Invoice {data['invoice_number']} | {data['invoice_date']}",
    ]
    if data["due_date"]:
        lines.append(f"Due: {data['due_date']}")
    lines.append("")
    
    for item in data["line_items"]:
        lines.append(f"  {item['description']} x{item['quantity']} @ {s}{item['unit_price']:.2f} = {s}{item['amount']:.2f}")
    
    lines.append("")
    lines.append(f"Subtotal: {s}{data['subtotal']:.2f}")
    if data["tax"] > 0:
        lines.append(f"Tax: {s}{data['tax']:.2f}")
    lines.append(f"Total: {s}{data['total']:.2f}")
    
    return "\n".join(lines)


def format_detailed(data):
    """Verbose format with more context."""
    s = data["symbol"]
    lines = [
        f"═══════════════════════════════════════════",
        f"              INVOICE / BILL               ",
        f"═══════════════════════════════════════════",
        f"",
        f"Vendor:           {data['vendor']}",
        f"Vendor Address:   {data['address']}",
        f"",
        f"Invoice No:       {data['invoice_number']}",
        f"Invoice Date:     {data['invoice_date']}",
    ]
    if data["due_date"]:
        lines.append(f"Due Date:         {data['due_date']}")
    lines.append(f"Terms:            {data['payment_terms']}")
    lines.append(f"Currency:         {data['currency']}")
    lines.append("")
    lines.append("ITEMIZED CHARGES:")
    lines.append("─" * 50)
    
    for i, item in enumerate(data["line_items"], 1):
        lines.append(f"  {i}. {item['description']}")
        lines.append(f"     Quantity: {item['quantity']}  |  Unit Price: {s}{item['unit_price']:.2f}  |  Line Total: {s}{item['amount']:.2f}")
    
    lines.append("─" * 50)
    lines.append(f"  Subtotal:          {s}{data['subtotal']:.2f}")
    if data["tax"] > 0:
        pct = round(data["tax_rate"] * 100, 1)
        lines.append(f"  Sales Tax ({pct}%):  {s}{data['tax']:.2f}")
    lines.append(f"  ──────────────────────────")
    lines.append(f"  TOTAL DUE:         {s}{data['total']:.2f}")
    lines.append(f"═══════════════════════════════════════════")
    
    return "\n".join(lines)


def format_minimal(data):
    """Minimal / OCR-degraded style — simulates real-world noise."""
    s = data["symbol"]
    lines = [data["vendor"]]
    lines.append(f"Inv# {data['invoice_number']}")
    lines.append(f"Date {data['invoice_date']}")
    if data["due_date"]:
        lines.append(f"Due {data['due_date']}")
    lines.append("")
    
    for item in data["line_items"]:
        lines.append(f"{item['description']}  {item['quantity']}  {s}{item['unit_price']:.2f}  {s}{item['amount']:.2f}")
    
    lines.append("")
    if data["tax"] > 0:
        lines.append(f"Tax {s}{data['tax']:.2f}")
    lines.append(f"Total {s}{data['total']:.2f}")
    
    return "\n".join(lines)


def format_tabular(data):
    """Table-style format with pipe separators."""
    s = data["symbol"]
    lines = [
        f"INVOICE: {data['invoice_number']}",
        f"FROM: {data['vendor']}",
        f"DATE: {data['invoice_date']}",
    ]
    if data["due_date"]:
        lines.append(f"DUE: {data['due_date']}")
    lines.append("")
    lines.append("| Item | Qty | Unit Price | Total |")
    lines.append("|------|-----|-----------|-------|")
    
    for item in data["line_items"]:
        lines.append(
            f"| {item['description']} | {item['quantity']} | {s}{item['unit_price']:.2f} | {s}{item['amount']:.2f} |"
        )
    
    lines.append("")
    lines.append(f"Subtotal: {s}{data['subtotal']:.2f}")
    if data["tax"] > 0:
        lines.append(f"Tax: {s}{data['tax']:.2f}")
    lines.append(f"**Total: {s}{data['total']:.2f}**")
    
    return "\n".join(lines)


FORMATTERS = {
    "standard": format_standard,
    "compact": format_compact,
    "detailed": format_detailed,
    "minimal": format_minimal,
    "tabular": format_tabular,
}


def build_expected_json(data):
    """Build the ground-truth JSON output."""
    return {
        "vendor_name": data["vendor"],
        "invoice_number": data["invoice_number"],
        "invoice_date": data["invoice_date"],
        "due_date": data["due_date"],
        "currency": data["currency"],
        "line_items": [
            {
                "description": item["description"],
                "quantity": item["quantity"],
                "unit_price": item["unit_price"],
                "amount": item["amount"],
            }
            for item in data["line_items"]
        ],
        "subtotal": data["subtotal"],
        "tax": data["tax"],
        "total": data["total"],
    }


def create_training_example(data):
    """Create a single training example in Qwen2.5 chat format."""
    fmt = random.choice(list(FORMATTERS.keys()))
    invoice_text = FORMATTERS[fmt](data)
    expected_json = build_expected_json(data)
    
    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Extract invoice data from the following text:\n\n{invoice_text}"},
            {"role": "assistant", "content": json.dumps(expected_json, separators=(",", ":"))},
        ]
    }


def generate_dataset(num_examples):
    """Generate a dataset of training examples."""
    examples = []
    for _ in range(num_examples):
        data = generate_invoice_data()
        example = create_training_example(data)
        examples.append(example)
    return examples


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic invoice training data")
    parser.add_argument("--num-train", type=int, default=400, help="Number of training examples")
    parser.add_argument("--num-eval", type=int, default=50, help="Number of evaluation examples")
    parser.add_argument("--output-dir", type=str, default="training/data", help="Output directory")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()
    
    random.seed(args.seed)
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Generate training data
    print(f"Generating {args.num_train} training examples...")
    train_data = generate_dataset(args.num_train)
    train_path = os.path.join(args.output_dir, "invoice_train.jsonl")
    with open(train_path, "w") as f:
        for example in train_data:
            f.write(json.dumps(example) + "\n")
    print(f"  → Saved to {train_path}")
    
    # Generate evaluation data
    print(f"Generating {args.num_eval} evaluation examples...")
    eval_data = generate_dataset(args.num_eval)
    eval_path = os.path.join(args.output_dir, "invoice_eval.jsonl")
    with open(eval_path, "w") as f:
        for example in eval_data:
            f.write(json.dumps(example) + "\n")
    print(f"  → Saved to {eval_path}")
    
    # Stats
    total = args.num_train + args.num_eval
    print(f"\nDone! Generated {total} examples ({args.num_train} train, {args.num_eval} eval)")
    
    # Show a sample
    sample = train_data[0]
    print("\n─── Sample Training Example ───")
    print(f"User prompt (first 200 chars):\n{sample['messages'][1]['content'][:200]}...")
    print(f"\nExpected output:\n{sample['messages'][2]['content'][:200]}...")


if __name__ == "__main__":
    main()
