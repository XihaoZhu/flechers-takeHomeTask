export interface Document {
    id: number;
    filename: string;
    file_type: string;
    status: DocumentStatus;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContentBlock {
    id: number;
    sequence: number;
    page_number: number | null;
    text: string;
    extraction_method: string;
}

export interface ContentBlockListResponse {
    blocks: ContentBlock[];
    limit: number;
    offset: number;
    document_id: number;
}

export interface DocumentListResponse {
    documents: Document[];
    limit: number;
    offset: number;
}

export interface DocumentUploadResponse {
    id: number;
    filename: string;
    status: string;
}

export type DocumentStatus =
    | "uploaded"
    | "processing"
    | "completed"
    | "failed"
