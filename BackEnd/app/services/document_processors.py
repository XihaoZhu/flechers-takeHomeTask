
from app.ocr.client import MockOCRClient, OCRClient

from ..database import SessionLocal
from ..models import Document, ContentBlock
from ..extractors.docx import extract_docx
from ..extractors.pdf import extract_pdf

from pathlib import Path




def process_document(document_id: int):

    db = SessionLocal()

    UPLOAD_DIR = Path("uploads")

    document = None

    try:

        document = db.get(Document, document_id)

        if document is None:
            return

        file_path = UPLOAD_DIR / document.storage_key

        document.status = "processing"
        
        db.commit()

        if document.file_type == "docx":
            extracted_blocks = extract_docx(file_path)
        elif document.file_type == "pdf":
            extracted_blocks = extract_pdf(file_path, ocr_client=MockOCRClient())
        else:
            raise ValueError(f"Unsupported file type: {document.file_type}")

        for sequence, block in enumerate(extracted_blocks, start=1):
            content_block = ContentBlock(
                document_id=document.id,
                sequence=sequence,
                page_number=block.page_number, 
                text=block.text,
                extraction_method=block.extraction_method,
            )
            db.add(content_block)

        document.status = "completed"
        document.error_message = None

        db.commit()

    except Exception as e:

        db.rollback()

        if document:
            document.status = "failed"
            document.error_message = str(e)
            db.commit()

    finally:
        db.close()