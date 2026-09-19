from fastapi import FastAPI

from . import models
from .database import Base, engine
from .dependencies import get_db

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session

from uuid import uuid4

import shutil

from .services.document_processors import process_document


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

supported_file_types = [".pdf", ".docx"]

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Processing Pipeline")


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/documents/{document_id}")
def get_document(document_id: int,
                db: Session = Depends(get_db)
                ):
    document = db.get(models.Document, document_id)

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {
        'id': document.id,
        'filename': document.filename,
        'file_type': document.file_type,
        'status': document.status,
        'storage_key': document.storage_key,
        'error_message': document.error_message,
        'created_at': document.created_at,
        'updated_at': document.updated_at,
        }

@app.get("/documents/{document_id}/blocks")
def get_document_blocks(
    document_id: int,
    offset: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    ):
    blocks = db.query(models.ContentBlock).filter(models.ContentBlock.document_id == document_id).order_by(models.ContentBlock.sequence).offset(offset).limit(limit).all()

    items = []

    for block in blocks:
        items.append({
            'id': block.id,
            'sequence': block.sequence,
            'page_number': block.page_number,
            'text': block.text,
            'extraction_method': block.extraction_method,
        })

    return {
        'document_id': document_id,
        'offset': offset,
        'limit': limit,
        'blocks': items,
    }


@app.post("/documents")
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    db: Session = Depends(get_db),
):
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    file_extension = Path(filename).suffix.lower()
    if file_extension not in supported_file_types:
        raise HTTPException(status_code=400, detail=f"This take home task only supports {supported_file_types} only.")
    
    storage_key = f"{uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / storage_key

    with open(file_path, "wb") as output:
        shutil.copyfileobj(file.file,output)

    match file_extension:
        case ".pdf":
            file_type = "pdf"
        case ".docx":
            file_type = "docx"

    status = "uploaded"
    

    document = models.Document(
        filename=filename,
        file_type=file_type,
        status=status,
        storage_key=storage_key,
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    
    except Exception:
        db.rollback()

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(status_code=500, detail="An error occurred while saving the document.")

    background_tasks.add_task(
    process_document,
    document.id,
    )

    return {
        'id': document.id,
        'filename': document.filename,
        'status': document.status,
    }

