#!/usr/bin/env python3
"""
Texas Title Insurance Basic Manual - Content Scraper

Scrapes all content from TDI and statutes.capitol.texas.gov:
1. TDI HTML pages (rate rules, procedural rules, admin rules, etc.)
2. Texas Insurance Code statutes (Angular SPA - needs Playwright)
3. PDF forms (T-1 through T-64, exhibits)

Outputs structured JSON files with metadata for each content chunk.
"""

import json
import os
import re
import time
import hashlib
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_TDI = "https://www.tdi.texas.gov/title/"
BASE_STATUTES = "https://statutes.capitol.texas.gov/Docs/IN/htm/"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) TIBM-Research-Bot/1.0"
}

# TDI section sub-pages that contain actual rule/procedure content
TDI_CONTENT_PAGES = {
    "section_ii": {
        "name": "Section II - Insuring Forms",
        "pages": ["titlemm2.html", "titlem2g.html"],
    },
    "section_iii": {
        "name": "Section III - Rate Rules",
        "pages": ["titlem3a.html", "titlem3b.html", "titlem3c.html"],
    },
    "section_iv": {
        "name": "Section IV - Procedural Rules",
        "pages": [
            "titlem4a.html", "titlem4b.html", "titlem4c.html",
            "titlem4d.html", "titlem4e.html", "titlem4f.html",
            "titlem4g.html", "titlem4i.html", "titlem4j.html",
            "titlem4l.html", "titlem4m.html",
        ],
    },
    "section_v": {
        "name": "Section V - Exhibits and Forms",
        "pages": ["titlem5a.html"],
    },
    "section_vi": {
        "name": "Section VI - Administrative Rules",
        "pages": ["titlem6.html", "titlem6a.html", "titlem6s.html", "titlem6s1.html"],
    },
    "section_vii": {
        "name": "Section VII - Claims",
        "pages": ["titlemm7.html"],
    },
    "section_viii": {
        "name": "Section VIII - Personal Property Title Insurance",
        "pages": ["titlemm9.html"],
    },
    "appendix": {
        "name": "Appendix - Commissioner Bulletins",
        "pages": ["titlemm8.html"],
    },
}

# Statute chapter pages (one HTML page per chapter, contains all sections)
STATUTE_CHAPTERS = [
    {"chapter": "223", "file": "IN.223.htm", "title": "Title 3 - Department Matters"},
    {"chapter": "271", "file": "IN.271.htm", "title": "Title 5 - Protection of Consumer Interests"},
    {"chapter": "501", "file": "IN.501.htm", "title": "Title 5 - Protection of Consumer Interests (Ch 501)"},
    {"chapter": "2501", "file": "IN.2501.htm", "title": "Chapter 2501 - General Provisions"},
    {"chapter": "2502", "file": "IN.2502.htm", "title": "Chapter 2502 - Prohibited Conduct"},
    {"chapter": "2551", "file": "IN.2551.htm", "title": "Chapter 2551 - Title Insurance Companies"},
    {"chapter": "2553", "file": "IN.2553.htm", "title": "Chapter 2553 - Foreign/Alien Title Insurance Companies"},
    {"chapter": "2601", "file": "IN.2601.htm", "title": "Chapter 2601 - Supervision and Liquidation"},
    {"chapter": "2602", "file": "IN.2602.htm", "title": "Chapter 2602 - Title Insurance Guaranty Association"},
    {"chapter": "2651", "file": "IN.2651.htm", "title": "Chapter 2651 - Title Insurance Agents and Direct Operations"},
    {"chapter": "2652", "file": "IN.2652.htm", "title": "Chapter 2652 - Escrow Officers"},
    {"chapter": "2701", "file": "IN.2701.htm", "title": "Chapter 2701 - General Provisions (Closing)"},
    {"chapter": "2702", "file": "IN.2702.htm", "title": "Chapter 2702 - Closing and Settlement"},
    {"chapter": "2703", "file": "IN.2703.htm", "title": "Chapter 2703 - Policy Forms and Premium Rates"},
    {"chapter": "2704", "file": "IN.2704.htm", "title": "Chapter 2704 - Issuance of Policy"},
    {"chapter": "2751", "file": "IN.2751.htm", "title": "Chapter 2751 - Personal Property Title Insurance"},
]

# PDF forms to download from TDI
PDF_FORMS = [
    # Section II - Insuring Forms
    ("T-1", "documents/form_t-01.pdf", "Owner's Policy of Title Insurance"),
    ("T-1R", "documents/form_t-01r.pdf", "Residential Owner's Policy (1-4 Family)"),
    ("T-2", "documents/form_t-02.pdf", "Loan Policy of Title Insurance"),
    ("T-2R", "documents/form_t-02r.pdf", "Texas Short Form Residential Loan Policy"),
    ("T-3", "documents/form_t-03.pdf", "General Endorsement"),
    ("T-4", "documents/form_t-04.pdf", "Leasehold Owner's Policy"),
    ("T-4R", "documents/form_t-04r.pdf", "Residential Owner's Leasehold"),
    ("T-5", "documents/form_t-05.pdf", "Leasehold Loan Policy"),
    ("T-6", "documents/form_t-06.pdf", "Certificate of Title USA"),
    ("T-7", "documents/form_t-07.pdf", "Commitment for Title Insurance"),
    ("T-9", "documents/form_t-09.pdf", "Certificate for Easements USA"),
    ("T-11", "documents/form_t-11.pdf", "Policy of Title Insurance USA"),
    ("T-12", "documents/form_t-12.pdf", "Endorsement USA"),
    ("T-13", "documents/form_t-13.pdf", "Loan Title Policy Binder Interim Construction"),
    ("T-14", "documents/form_t-14.pdf", "First Loss"),
    ("T-16", "documents/form_t-16.pdf", "Loan Policy Aggregation"),
    ("T-17", "documents/form_t-17.pdf", "Planned Unit Development"),
    ("T-18", "documents/form_t-18.pdf", "Reinsurance Commitment"),
    ("T-18.1", "documents/form_t-18-1.pdf", "Facultative Reinsurance Agreement"),
    ("T-19", "documents/form_t-19.pdf", "Restrictions, Encroachments, Minerals"),
    ("T-19.1", "documents/form_t-19-1.pdf", "Restrictions, Encroachments, Minerals - Owner's"),
    ("T-19.2", "documents/form_t-19-2.pdf", "Minerals and Surface Damage"),
    ("T-19.3", "documents/form_t-19-3.pdf", "Minerals and Surface Damage"),
    ("T-20", "documents/form_t-20.pdf", "Owner Title Policy Commitment TxDOT"),
    ("T-22", "documents/form_t-22.pdf", "Owner Title Policy Commitment Eminent Domain"),
    ("T-23", "documents/form_t-23.pdf", "Access Endorsement"),
    ("T-24", "documents/form_t-24.pdf", "Non-Imputation"),
    ("T-24.1", "documents/form_t-24-1.pdf", "Non-Imputation Mezzanine Financing"),
    ("T-25", "documents/form_t-25.pdf", "Contiguity"),
    ("T-25.1", "documents/form_t-25-1.pdf", "Contiguity"),
    ("T-26", "documents/form_t-26.pdf", "Additional Insured"),
    ("T-27", "documents/form_t-27.pdf", "Assignment of Rents/Leases"),
    ("T-28", "documents/form_t-28.pdf", "Condominium"),
    ("T-30", "documents/form_t-30.pdf", "Tax Deletion"),
    ("T-31", "documents/form_t-31.pdf", "Manufactured Housing"),
    ("T-31.1", "documents/form_t-31-1.pdf", "Supplemental Coverage Manufactured Housing"),
    ("T-33", "documents/form_t-33.pdf", "Variable Rate Mortgage"),
    ("T-33.1", "documents/form_t-33-1.pdf", "Variable Rate Mortgage - Negative Amortization"),
    ("T-34", "documents/form_t-34.pdf", "Increased Value"),
    ("T-35", "documents/form_t-35.pdf", "Future Advance/Revolving Credit"),
    ("T-36", "documents/form_t-36.pdf", "Environmental Protection Lien"),
    ("T-36.1", "documents/form_t-36-1.pdf", "Commercial Environmental Protection Lien"),
    ("T-38", "documents/form_t-38.pdf", "Loan Policy Endorsement Form"),
    ("T-39", "documents/form_t-39.pdf", "Balloon Mortgage"),
    ("T-42", "documents/form_t-42.pdf", "Equity Loan Mortgage"),
    ("T-42.1", "documents/form_t-42-1.pdf", "Supplemental Coverage Equity Loan"),
    ("T-43", "documents/form_t-43.pdf", "Texas Reverse Mortgage"),
    ("T-44", "documents/form_t-44.pdf", "Texas Residential Limited Coverage Junior Combined"),
    ("T-45", "documents/form_t-45.pdf", "Texas Residential Limited Coverage Junior Down Date"),
    ("T-46", "documents/form_t-46.pdf", "Texas Residential Limited Coverage Junior HELOC"),
    ("T-48", "documents/form_t-48.pdf", "Co-Insurance"),
    ("T-53", "documents/form_t-53.pdf", "Texas Limited Coverage Residential Chain"),
    ("T-54", "documents/form_t-54.pdf", "Severable Improvements"),
    ("T-98", "documents/form_t-98.pdf", "Limited Pre-Foreclosure Policy"),
    ("T-99", "documents/form_t-99.pdf", "Limited Pre-Foreclosure Policy Date Down"),
    # Section V - Exhibits and Business Forms
    ("T-00", "documents/form_t-00.pdf", "Verification of Services Rendered"),
    ("T-29", "documents/form_t-29.pdf", "Texas Master Indemnity Agreement"),
    ("T-37", "documents/form_t-37.pdf", "Immediately Available Funds Procedure"),
    ("T-37A", "documents/form_t-37a.pdf", "Immediately Available Funds Agent Designation"),
    ("T-40", "documents/form_t-40.pdf", "Texas Title Insurance Proof of Loss"),
    ("T-47", "documents/formT-47.pdf", "Residential Real Property Affidavit"),
    ("T-50", "documents/form_t-50.pdf", "Insured Closing Service"),
    ("T-51", "documents/formt51.pdf", "Purchaser/Seller Insured Closing"),
    ("T-56", "documents/form_t-56.pdf", "Owner's Policy Rejection"),
    ("T-57", "documents/form_t-57.pdf", "Agreement to Furnish Title Evidence"),
    ("T-58", "documents/form_t-58.pdf", "Title Attorneys Affidavit Unavailability"),
    ("T-60", "documents/title-t60.pdf", "Borrower's Statement"),
    ("T-61", "documents/title-t61.pdf", "Purchaser's Statement"),
    ("T-62", "documents/title-t62.pdf", "Seller's Statement"),
    ("T-63", "documents/form_t-63.pdf", "Texas Escrow Accounting Addendum"),
    ("T-64", "documents/t64form.pdf", "Texas Disclosure"),
]

# Additional PDFs from other TDI locations
PDF_FORMS_EXTRA = [
    ("T-52", "../forms/finagentlicense/FINT120.pdf", "Abstract Plant Information"),
    ("T-S1", "../forms/pctitle/pc411form_t-s1.pdf", "Title Agent's Unencumbered Assets"),
    ("T-S2", "../forms/pctitle/pc412form_t-s2.pdf", "Tripartite Agreement"),
    ("T-S3", "../forms/pctitle/pc413form_t-s3.pdf", "Solvency Account Release Request"),
    ("T-S4", "../forms/pctitle/pc414form_t-s4.pdf", "Annual Report Title Officers"),
    ("T-S4-A", "../forms/pctitle/pc415form_t-s4-.pdf", "Financial Matter Disclosure"),
    ("T-S5", "../forms/pctitle/pc416form_t-s5.pdf", "Title Agent Quarterly Tax Report"),
    ("T-G1", "documents/form_t-g1.pdf", "Policy Guaranty Fee Remittance"),
    ("T-G2", "documents/form_t-g2.pdf", "Guaranty Assessment Recoupment Remittance"),
    ("T-G3", "documents/form_t-g3.pdf", "Statement of Assessment/Recoupments"),
    ("Ti-100", "documents/form_ti-100.pdf", "Notice of Cession"),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def slugify(text):
    """Create a safe filename from text."""
    text = re.sub(r'[^\w\s-]', '', text.lower())
    return re.sub(r'[\s]+', '_', text).strip('_')[:80]


def fetch_html(url, retries=3, delay=1.0):
    """Fetch a URL with retries and rate limiting."""
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            time.sleep(delay)
            return resp.text
        except Exception as e:
            print(f"  Attempt {attempt+1} failed for {url}: {e}")
            if attempt < retries - 1:
                time.sleep(delay * (attempt + 1))
    return None


def clean_text(text):
    """Clean up extracted text."""
    # Normalize whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\t', ' ', text)
    return text.strip()


def extract_tdi_content(html, url):
    """Extract main content from a TDI page, removing nav/footer."""
    soup = BeautifulSoup(html, 'html.parser')

    # Remove navigation, headers, footers
    for tag in soup.find_all(['nav', 'header', 'footer']):
        tag.decompose()
    for div in soup.find_all('div', class_=re.compile(r'(nav|menu|footer|header|breadcrumb)', re.I)):
        div.decompose()
    for div in soup.find_all('div', id=re.compile(r'(nav|menu|footer|header|topBanner)', re.I)):
        div.decompose()
    # Remove skip links
    for a in soup.find_all('a', class_='skip'):
        a.decompose()

    # Try to find the main content area
    content = soup.find('div', id='contentArea') or soup.find('div', class_='content') or soup.find('main')
    if not content:
        content = soup.find('body') or soup

    return content


def split_tdi_by_rule(content_soup, section_id, section_name, page_url):
    """Split TDI content into individual rules/procedures."""
    chunks = []
    text = content_soup.get_text(separator='\n')
    text = clean_text(text)

    # Try to split by rule identifiers (R-1, P-1, etc.)
    # Pattern: line starting with R-\d+, P-\d+, G.\d+, L-\d+, S.\d+, D.\d+
    pattern = r'^(?=(?:R-\d+|P-\d+|G\.\d+|L-\d+|S\.\d+|D\.\d+)\.?\s)'
    parts = re.split(pattern, text, flags=re.MULTILINE)

    if len(parts) <= 1:
        # No rule splits found, treat whole page as one chunk
        if text and len(text.strip()) > 50:
            chunks.append({
                "id": f"{section_id}_{slugify(page_url)}",
                "section": section_name,
                "section_id": section_id,
                "rule_id": None,
                "title": section_name,
                "content": text,
                "source_url": page_url,
                "content_type": "tdi_rule",
            })
        return chunks

    # First part is usually preamble/header
    preamble = parts[0].strip()

    # Re-find the rules with their identifiers
    rule_matches = list(re.finditer(
        r'^((?:R-\d+|P-\d+|G\.\d+|L-\d+|S\.\d+|D\.\d+)[\w.]*)',
        text, re.MULTILINE
    ))

    for i, match in enumerate(rule_matches):
        start = match.start()
        end = rule_matches[i+1].start() if i+1 < len(rule_matches) else len(text)
        rule_text = text[start:end].strip()
        rule_id = match.group(1).rstrip('.')

        # Extract title (first line after the rule ID)
        first_line = rule_text.split('\n')[0]
        title_match = re.match(r'^[\w.\-]+\.?\s*(.+)', first_line)
        title = title_match.group(1).strip() if title_match else rule_id

        if len(rule_text) > 20:
            chunks.append({
                "id": f"{section_id}_{slugify(rule_id)}",
                "section": section_name,
                "section_id": section_id,
                "rule_id": rule_id,
                "title": f"{rule_id} - {title}",
                "content": rule_text,
                "source_url": f"{page_url}#{rule_id.lower().replace('-', '').replace('.', '')}",
                "content_type": "tdi_rule",
            })

    # Include preamble if substantial
    if preamble and len(preamble) > 100:
        chunks.insert(0, {
            "id": f"{section_id}_preamble",
            "section": section_name,
            "section_id": section_id,
            "rule_id": None,
            "title": f"{section_name} - Preamble",
            "content": preamble,
            "source_url": page_url,
            "content_type": "tdi_rule",
        })

    return chunks


# ---------------------------------------------------------------------------
# Phase 1A: Scrape TDI HTML pages
# ---------------------------------------------------------------------------

def scrape_tdi_pages():
    """Scrape all TDI section content pages."""
    print("\n=== Phase 1A: Scraping TDI HTML Pages ===\n")
    all_chunks = []

    for section_id, section_info in TDI_CONTENT_PAGES.items():
        section_name = section_info["name"]
        print(f"\n--- {section_name} ---")

        for page_file in section_info["pages"]:
            url = urljoin(BASE_TDI, page_file)
            print(f"  Fetching {url}...")
            html = fetch_html(url)
            if not html:
                print(f"  FAILED to fetch {url}")
                continue

            content = extract_tdi_content(html, url)
            chunks = split_tdi_by_rule(content, section_id, section_name, url)
            print(f"  Found {len(chunks)} chunks")
            all_chunks.extend(chunks)

    # Save TDI chunks
    outfile = os.path.join(OUTPUT_DIR, "tdi_pages", "all_tdi_chunks.json")
    with open(outfile, 'w') as f:
        json.dump(all_chunks, f, indent=2)
    print(f"\nSaved {len(all_chunks)} TDI chunks to {outfile}")
    return all_chunks


# ---------------------------------------------------------------------------
# Phase 1B: Scrape statutes using Playwright
# ---------------------------------------------------------------------------

def scrape_statutes():
    """Scrape all statute chapters using Playwright (handles Angular SPA)."""
    print("\n=== Phase 1B: Scraping Statutes (Playwright) ===\n")

    from playwright.sync_api import sync_playwright

    all_chunks = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for chapter_info in STATUTE_CHAPTERS:
            chapter = chapter_info["chapter"]
            filename = chapter_info["file"]
            title = chapter_info["title"]
            url = BASE_STATUTES + filename

            print(f"  Fetching {title} ({url})...")
            try:
                page.goto(url, wait_until="networkidle", timeout=30000)
                # Wait for Angular to render content
                page.wait_for_timeout(2000)

                # Try to get the statute content
                # The statutes site renders into a specific container
                content_html = page.content()
                soup = BeautifulSoup(content_html, 'html.parser')

                # Extract all statute sections
                # Look for section headers (Sec. XXXX.XXX)
                body_text = soup.get_text(separator='\n')
                body_text = clean_text(body_text)

                # Split by "Sec." pattern
                sec_pattern = r'(?=Sec\.?\s+\d+\.\d+)'
                sections = re.split(sec_pattern, body_text)

                chunk_count = 0
                for sec_text in sections:
                    sec_text = sec_text.strip()
                    if not sec_text or len(sec_text) < 30:
                        continue

                    # Extract section number
                    sec_match = re.match(r'Sec\.?\s+(\d+\.\d+\w*)', sec_text)
                    if sec_match:
                        sec_num = sec_match.group(1)
                        # Extract title (text after section number, before first period or newline)
                        title_match = re.match(
                            r'Sec\.?\s+\d+\.\d+\w*\.?\s+([^\n.]+)',
                            sec_text
                        )
                        sec_title = title_match.group(1).strip() if title_match else ""
                    else:
                        sec_num = f"ch{chapter}_misc"
                        sec_title = ""

                    chunk_id = f"statute_{chapter}_{sec_num.replace('.', '_')}"

                    all_chunks.append({
                        "id": chunk_id,
                        "section": f"Section I - {title}",
                        "section_id": "section_i",
                        "chapter": chapter,
                        "statute_section": sec_num,
                        "title": f"Sec. {sec_num}" + (f" - {sec_title}" if sec_title else ""),
                        "content": sec_text,
                        "source_url": f"{url}#{sec_num}",
                        "content_type": "statute",
                    })
                    chunk_count += 1

                print(f"  Found {chunk_count} sections in Chapter {chapter}")

            except Exception as e:
                print(f"  ERROR on {url}: {e}")
                # Fallback: try plain requests (some pages might work)
                try:
                    html = fetch_html(url)
                    if html:
                        soup = BeautifulSoup(html, 'html.parser')
                        body_text = soup.get_text(separator='\n')
                        body_text = clean_text(body_text)
                        if len(body_text) > 100:
                            all_chunks.append({
                                "id": f"statute_{chapter}_full",
                                "section": f"Section I - {title}",
                                "section_id": "section_i",
                                "chapter": chapter,
                                "statute_section": chapter,
                                "title": title,
                                "content": body_text,
                                "source_url": url,
                                "content_type": "statute",
                            })
                            print(f"  Fallback: saved full chapter text")
                except Exception as e2:
                    print(f"  Fallback also failed: {e2}")

            time.sleep(1)

        browser.close()

    # Save statute chunks
    outfile = os.path.join(OUTPUT_DIR, "statutes", "all_statute_chunks.json")
    with open(outfile, 'w') as f:
        json.dump(all_chunks, f, indent=2)
    print(f"\nSaved {len(all_chunks)} statute chunks to {outfile}")
    return all_chunks


# ---------------------------------------------------------------------------
# Phase 1C: Download and extract PDFs
# ---------------------------------------------------------------------------

def download_and_extract_pdfs():
    """Download all PDF forms and extract text."""
    print("\n=== Phase 1C: Downloading and Extracting PDFs ===\n")
    import pdfplumber

    all_chunks = []
    pdf_dir = os.path.join(OUTPUT_DIR, "pdfs")

    all_pdfs = PDF_FORMS + PDF_FORMS_EXTRA

    for form_id, rel_path, form_title in all_pdfs:
        url = urljoin(BASE_TDI, rel_path)
        safe_name = slugify(form_id) + ".pdf"
        local_path = os.path.join(pdf_dir, safe_name)

        print(f"  Downloading {form_id}: {form_title}...")
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            with open(local_path, 'wb') as f:
                f.write(resp.content)
            time.sleep(0.5)
        except Exception as e:
            print(f"    FAILED to download {url}: {e}")
            continue

        # Extract text from PDF
        try:
            text_parts = []
            with pdfplumber.open(local_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)

            full_text = "\n\n".join(text_parts)
            full_text = clean_text(full_text)

            if full_text and len(full_text) > 20:
                all_chunks.append({
                    "id": f"form_{slugify(form_id)}",
                    "section": "Section II - Insuring Forms" if not form_id.startswith(("T-S", "T-G", "Ti-")) else "Section V - Exhibits and Forms",
                    "section_id": "section_ii" if not form_id.startswith(("T-S", "T-G", "Ti-")) else "section_v",
                    "form_id": form_id,
                    "title": f"Form {form_id} - {form_title}",
                    "content": full_text,
                    "source_url": url,
                    "content_type": "pdf_form",
                    "pdf_pages": len(text_parts),
                })
                print(f"    Extracted {len(full_text)} chars from {len(text_parts)} pages")
            else:
                print(f"    WARNING: No text extracted (may be scanned/image PDF)")

        except Exception as e:
            print(f"    ERROR extracting text from {local_path}: {e}")

    # Save PDF chunks
    outfile = os.path.join(OUTPUT_DIR, "pdfs", "all_pdf_chunks.json")
    with open(outfile, 'w') as f:
        json.dump(all_chunks, f, indent=2)
    print(f"\nSaved {len(all_chunks)} PDF chunks to {outfile}")
    return all_chunks


# ---------------------------------------------------------------------------
# Phase 1D: Combine all content into structured output
# ---------------------------------------------------------------------------

def combine_all_content(tdi_chunks, statute_chunks, pdf_chunks):
    """Combine all chunks into a single structured dataset."""
    print("\n=== Combining All Content ===\n")

    all_chunks = tdi_chunks + statute_chunks + pdf_chunks

    # Deduplicate by content hash
    seen = set()
    unique_chunks = []
    for chunk in all_chunks:
        content_hash = hashlib.md5(chunk["content"].encode()).hexdigest()
        if content_hash not in seen:
            seen.add(content_hash)
            chunk["content_hash"] = content_hash
            unique_chunks.append(chunk)

    # Save combined output
    outfile = os.path.join(OUTPUT_DIR, "structured", "all_content.json")
    with open(outfile, 'w') as f:
        json.dump(unique_chunks, f, indent=2)

    # Save manifest
    manifest = {
        "total_chunks": len(unique_chunks),
        "by_type": {},
        "by_section": {},
        "sources": [],
    }
    for chunk in unique_chunks:
        ct = chunk.get("content_type", "unknown")
        manifest["by_type"][ct] = manifest["by_type"].get(ct, 0) + 1
        sec = chunk.get("section_id", "unknown")
        manifest["by_section"][sec] = manifest["by_section"].get(sec, 0) + 1
        manifest["sources"].append({
            "id": chunk["id"],
            "title": chunk["title"],
            "source_url": chunk["source_url"],
            "content_type": chunk.get("content_type"),
            "content_length": len(chunk["content"]),
        })

    manifest_file = os.path.join(OUTPUT_DIR, "structured", "manifest.json")
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f"Total unique chunks: {len(unique_chunks)}")
    print(f"By type: {manifest['by_type']}")
    print(f"By section: {manifest['by_section']}")
    print(f"\nSaved to {outfile}")
    print(f"Manifest saved to {manifest_file}")
    return unique_chunks


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Texas Title Insurance Basic Manual - Content Scraper")
    print("=" * 60)

    os.makedirs(os.path.join(OUTPUT_DIR, "statutes"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "tdi_pages"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "pdfs"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "structured"), exist_ok=True)

    # Phase 1A: TDI pages
    tdi_chunks = scrape_tdi_pages()

    # Phase 1B: Statutes
    statute_chunks = scrape_statutes()

    # Phase 1C: PDFs
    pdf_chunks = download_and_extract_pdfs()

    # Phase 1D: Combine
    combine_all_content(tdi_chunks, statute_chunks, pdf_chunks)

    print("\n" + "=" * 60)
    print("Scraping complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
