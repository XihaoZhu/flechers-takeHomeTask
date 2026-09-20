from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    file_type: str
    status: str
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class ContentBlockResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sequence: int
    page_number: int | None
    text: str
    extraction_method: str


class ContentBlockListResponse(BaseModel):
    document_id: int
    offset: int
    limit: int
    blocks: list[ContentBlockResponse]

class DocumentListResponse(BaseModel):
    offset: int
    limit: int
    documents: list[DocumentResponse]

class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    status: str