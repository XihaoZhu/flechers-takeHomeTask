import {
    type ContentBlockListResponse,
    type Document,
    type DocumentListResponse,
    type DocumentUploadResponse,
} from "../types/documents";

import { API_BASE_URL } from '../API_BASE_URL'

export async function getDocuments(offset = 0, limit = 10): Promise<DocumentListResponse> {
    const response = await fetch(`${API_BASE_URL}/documents?offset=${offset}&limit=${limit}`);

    if (!response.ok) {
        throw new Error("Failed to fetch documents");
    }

    return response.json();
}

export async function uploadDocument(file: File): Promise<DocumentUploadResponse> {

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/documents`, {
        method: "POST",
        body: formData,
    })
    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to upload document: ${errorData.detail}`)
    }

    return response.json();
}

export async function getDocument(documentId: number): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch document with ID ${documentId}`);
    }

    return response.json();

}

export async function getDocumentBlocks(
    documentId: number,
    offset = 0,
    limit = 10,
): Promise<ContentBlockListResponse> {
    const response = await fetch(
        `${API_BASE_URL}/documents/${documentId}/blocks?offset=${offset}&limit=${limit}`,
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch content blocks for document with ID ${documentId}`);
    }

    return response.json();
}
