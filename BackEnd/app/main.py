from app.schemas import DocumentResponse,  ContentBlockListResponse, DocumentListResponse, DocumentUploadResponse
from app.config import UPLOAD_DIR

from . import models
from .database import Base, engine
from .dependencies import get_db

from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, UploadFile, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from uuid import uuid4

import shutil

from .services.document_processors import process_document

supported_file_types = {".pdf", ".docx"}

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Processing Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


#region Document Endpoints
@app.get("/documents/{document_id}",
         response_model=DocumentResponse)
def get_document(document_id: int,
                db: Session = Depends(get_db)
                ):
    document = db.get(models.Document, document_id)

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")

    return document
#endregion

#region Content Block Endpoints
@app.get("/documents/{document_id}/blocks",
         response_model=ContentBlockListResponse)
def get_document_blocks(
    document_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    ):

    document = db.get(models.Document, document_id)

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    blocks = db.query(models.ContentBlock).filter(models.ContentBlock.document_id == document_id).order_by(models.ContentBlock.sequence).offset(offset).limit(limit).all()


    return {
        "document_id": document_id,
        "offset": offset,
        "limit": limit,
        "blocks": blocks,
        }
#endregion

#region Document List Endpoint
@app.get('/documents', response_model=DocumentListResponse)
def list_documents(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    ):

    documents = db.query(models.Document).order_by(models.Document.created_at.desc()).offset(offset).limit(limit).all()

    return {
        'offset': offset,
        'limit': limit,
        'documents': documents,
    }
#endregion

#region Document Upload Endpoint
@app.post("/documents",
          response_model=DocumentUploadResponse)
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

    match file_extension:
        case ".pdf":
            file_type = "pdf"
        case ".docx":
            file_type = "docx"

    status = "uploaded"



    try:
        with open(file_path, "wb") as output:
            shutil.copyfileobj(file.file,output)

        document = models.Document(
            filename=filename,
            file_type=file_type,
            status=status,
            storage_key=storage_key,
        )

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

    return document
#endregion
