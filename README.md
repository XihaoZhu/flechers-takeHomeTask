# Document Processing Pipeline

## Overview

This project is a full-stack document processing pipeline built for the Fletchers AI take-home assessment. It accepts PDF and DOCX uploads, extracts their textual content, stores the results as ordered content blocks, and exposes the processed content through a REST API and responsive React interface.

The backend uses FastAPI, SQLAlchemy, and SQLite. Uploaded documents are processed asynchronously so the upload request can return immediately while the frontend polls for processing status.

Document processing uses a two-stage routing approach. The uploaded file is first validated and routed to the appropriate extractor based on its supported format. PDF files are then inspected page by page: pages containing usable embedded text are extracted directly, while pages without sufficient embedded text are routed through an OCR abstraction. This allows the same pipeline to handle digital, scanned, and mixed PDFs.

The frontend is built with React, TypeScript, Vite, and Tailwind CSS. It provides document upload, processing status, document history, and a viewer for extracted content on both desktop and mobile layouts.

---

## Features

* Upload and process `.pdf` and `.docx` files.
* Validate uploaded files instead of relying only on their extensions.
* Extract text from DOCX files and digital PDF pages.
* Route PDF pages with insufficient embedded text to OCR.
* Support mixed PDFs where different pages may use different extraction methods.
* Store extracted content as ordered blocks for later retrieval.
* Track processing with `uploaded`, `processing`, `completed`, and `failed` states.
* Browse previous uploads and extracted content through a responsive React interface.
* Paginated APIs for document history and extracted content.

---

## Architecture

The application is split into a React frontend and a FastAPI backend. The backend handles file storage, routing, extraction, persistence, and retrieval.

```text
                         Upload
                           │
                           ▼
                     Validate file
                           │
              ┌────────────┴────────────┐
              │                         │
            DOCX                       PDF
              │                         │
              ▼                         ▼
      DOCX text extraction       Inspect each page
              │                         │
              │               ┌─────────┴─────────┐
              │               │                   │
              │        Embedded text        Little/no text
              │               │                   │
              │               ▼                   ▼
              │        Native extraction         OCR
              │               │                   │
              │               └─────────┬─────────┘
              ▼                         ▼
              └─────────────────────────┘
                          │
                          ▼
                  Normalised ExtractedBlock
                          │
                          ▼
                   SQLite / SQLAlchemy
                          │
                          ▼
                       REST API
                          │
                          ▼
                       React UI
```

Uploads return before extraction is complete. Processing runs as a FastAPI background task while the frontend polls the document status until it reaches `completed` or `failed`.

Original files are stored locally so they can be reprocessed if needed. Extracted text is stored separately as ordered `ContentBlock` records, keeping extraction and storage independent of the frontend or any future downstream agent.

---

## Document Routing & Extraction

File extensions are used as the initial routing hint, but the backend does not rely on them alone. PDF files are checked for a valid PDF signature, while DOCX files are validated as ZIP packages containing the expected Word document structure.

DOCX files are extracted paragraph by paragraph using `python-docx`. Each non-empty paragraph becomes an ordered content block.

PDFs are handled page by page using PyMuPDF. If a page contains enough usable embedded text, that text is extracted directly. Pages with little or no embedded text are routed to the OCR client instead. This also allows mixed PDFs to use native extraction and OCR within the same document.

The OCR layer is behind an `OCRClient` interface. The current implementation is mocked, as permitted by the assessment brief, so it can later be replaced by a local OCR engine or external provider without changing the routing or persistence logic.

---

## Running Locally

### Backend

From the `BackEnd` directory:

```bash
python -m venv .venv
```

Activate the virtual environment and install the dependencies:

```bash
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

Start the API:

```bash
uvicorn app.main:app --reload
```

The backend runs at `http://localhost:8000`.

FastAPI's interactive API documentation is available at `http://localhost:8000/docs`.

### Frontend

From the `FrontEnd` directory:

```bash
npm install
npm run dev
```

Vite will print the local frontend address in the terminal, normally `http://localhost:5173`.

Both the frontend and backend should be running to use the application.

---

## API

| Method | Endpoint          | Purpose                                      |
| ------ | ----------------- | -------------------------------------------- |
| `POST` | `/documents`      | Upload a PDF or DOCX document for processing |
| `GET`  | `/documents`      | Retrieve document history with pagination    |
| `GET`  | `/documents/{id}` | Retrieve a document and its current pr       |
