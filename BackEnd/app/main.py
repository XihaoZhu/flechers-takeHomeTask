from fastapi import FastAPI

from . import models
from .database import Base, engine
from .dependencies import get_db

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, UploadFile
from sqlalchemy.orm import Session

from uuid import uuid4

import shutil


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

supported_file_types = [".pdf", ".docx"]

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Processing Pipeline")


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/documents")
def upload_document(
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

    status = "processing"
    

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

    return {
        'id': document.id,
        'filename': document.filename,
        'status': document.status,
    }

