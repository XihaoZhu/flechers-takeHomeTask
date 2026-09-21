from app.config import UPLOAD_DIR
from app.ocr.client import get_ocr_client

from ..database import SessionLocal
from ..extractors.docx import extract_docx
from ..extractors.pdf import extract_pdf
from ..models import ContentBlock, Document


def process_document(document_id: int):

    db = SessionLocal()

    document = None

    try:
        document = db.get(Document, document_id)

        if document is None:
            return

        file_path = UPLOAD_DIR / document.storage_key

        document.status = "processing"

        db.commit()

        # Extractors normalise different file types into the same block structure.
        if document.file_type == "docx":
            extracted_blocks = extract_docx(file_path)
        elif document.file_type == "pdf":
            extracted_blocks = extract_pdf(file_path, ocr_client=get_ocr_client())
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

    # Keep background processing failures attached to the document
    # instead of leaving it permanently in the processing state.
    except Exception as e: # noqa: BLE001
        db.rollback()

        if document:
            document.status = "failed"
            document.error_message = str(e)
            db.commit()

    finally:
        db.close()
