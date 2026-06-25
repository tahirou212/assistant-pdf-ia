import fitz
from pathlib import Path
from app.core.config import settings

def detect_pdf_type(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return "scanned" if len(text.strip()) < 50 else "native"

def extract_text_from_pdf(file_path: str):
    pdf_type = detect_pdf_type(file_path)
    if pdf_type == "native":
        return extract_native_pdf(file_path)
    else:
        return extract_scanned_pdf(file_path)

def extract_native_pdf(file_path: str):
    doc = fitz.open(file_path)
    text = ""
    nb_pages = len(doc)
    for page_num, page in enumerate(doc):
        text += f"\n[PAGE {page_num + 1}]\n{page.get_text()}"
    doc.close()
    return text, nb_pages

def extract_scanned_pdf(file_path: str):
    try:
        import easyocr
        reader = easyocr.Reader(["fr", "en"], gpu=False)
        doc = fitz.open(file_path)
        nb_pages = len(doc)
        text = ""
        for page_num, page in enumerate(doc):
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            results = reader.readtext(img_data)
            page_text = " ".join([r[1] for r in results])
            text += f"\n[PAGE {page_num + 1}]\n{page_text}"
        doc.close()
        return text, nb_pages
    except Exception:
        return extract_native_pdf(file_path)

def save_upload_file(file_content: bytes, filename: str, user_id: int) -> str:
    upload_dir = Path(settings.UPLOAD_DIR) / str(user_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / filename
    with open(file_path, "wb") as f:
        f.write(file_content)
    return str(file_path)
