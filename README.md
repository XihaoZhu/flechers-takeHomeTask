# Document Processing Pipeline

## Overview

This project is a full-stack document processing pipeline built for the Fletchers AI take-home assessment. It accepts PDF and DOCX uploads, extracts their textual content, stores the results as ordered content blocks, and exposes the processed content through a REST API and responsive React interface.

The backend uses FastAPI, SQLAlchemy, and SQLite. Uploaded documents are processed asynchronously so the upload request can return immediately while the frontend polls for processing status.

Document processing uses a two-stage routing approach. Files are first validated and routed to the appropriate extractor. PDFs are then inspected page by page: pages containing usable embedded text are extracted directly, while pages with little or no embedded text are routed to OCR. This allows digital, scanned, and mixed PDFs to use the same pipeline.

The frontend is built with React, TypeScript, Vite, and Tailwind CSS. It provides document upload, processing status, document history, and extracted-content viewing across desktop and mobile layouts.

---

## Features

* Upload and process `.pdf` and `.docx` files.
* Validate file content instead of relying only on extensions.
* Extract text from DOCX files and digital PDF pages.
* Route scanned PDF pages to OCR.
* Support mixed PDFs where extraction methods differ by page.
* Optional local OCR using Tesseract.
* Store extracted content as ordered blocks for later retrieval.
* Track `uploaded`, `processing`, `completed`, and `failed` states.
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
              │        Native extraction          OCR
              │                                   │
              │                           ┌───────┴────────┐
              │                           │                │
              │                          Mock      Local Tesseract
              │                           │                │
              └──────────────┬────────────┴────────────────┘
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

Original files are stored locally so they can be reprocessed if needed. Extracted text is stored separately as ordered `ContentBlock` records, keeping extraction and storage independent of the frontend or future downstream consumers.

---

## Document Routing & Extraction

File extensions are used as the initial routing hint, but the backend does not rely on them alone. PDF files are checked for a valid PDF signature, while DOCX files are validated as ZIP packages containing the expected Word document structure.

DOCX files are extracted paragraph by paragraph using `python-docx`. Each non-empty paragraph becomes an ordered content block.

PDFs are handled page by page using PyMuPDF. If a page contains enough usable embedded text, that text is extracted directly. Pages with little or no embedded text are routed to an `OCRClient`. This also allows native extraction and OCR to be used within the same mixed PDF.

OCR is kept behind an `OCRClient` abstraction. The default provider is a mock implementation so the project runs without external OCR dependencies. An optional local implementation renders PDF pages to images and uses Tesseract through `pytesseract` to perform real OCR.

The provider is selected using the `OCR_PROVIDER` environment variable, so the extraction pipeline does not need to change when switching OCR implementations.

---

## Running Locally

### Backend

From the `BackEnd` directory, create and activate a virtual environment:

```bash
python -m venv .venv
```

On Windows:

```powershell
.venv\Scripts\activate
```

Install the dependencies:

```bash
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

### Optional Local OCR

The application uses the mock OCR provider by default, so Tesseract is not required for the standard setup.

To use real local OCR, install Tesseract and make sure the `tesseract` executable is available on your system `PATH`.

Verify the installation with:

```bash
tesseract --version
```

Then set the OCR provider before starting the backend.

PowerShell:

```powershell
$env:OCR_PROVIDER="local"
uvicorn app.main:app --reload
```

With `OCR_PROVIDER=local`, PDF pages that do not contain sufficient embedded text are rendered to images and processed locally by Tesseract.

If `OCR_PROVIDER` is not set, the application defaults to the mock OCR client.

---

## API

| Method | Endpoint                 | Purpose                                           |
| ------ | ------------------------ | ------------------------------------------------- |
| `POST` | `/documents`             | Upload a PDF or DOCX document for processing      |
| `GET`  | `/documents`             | Retrieve document history with pagination         |
| `GET`  | `/documents/{id}`        | Retrieve a document and its processing status     |
| `GET`  | `/documents/{id}/blocks` | Retrieve extracted content blocks with pagination |
| `GET`  | `/health`                | Basic API health check                            |

Request and response schemas can also be inspected through FastAPI's `/docs` endpoint.

---

## Testing

Backend tests use `pytest` and cover the main extraction and API behaviour, including:

* PDF native-text and OCR routing.
* DOCX text extraction.
* File content validation.
* Database persistence.
* API responses, ordering, pagination, and error cases.

Run the backend test suite from `BackEnd`:

```bash
pytest
```

The frontend can be production-built to verify TypeScript and Vite compilation:

```bash
npm run build
```

---

## Design Decisions & Limitations

This implementation is intentionally kept small enough to run locally while keeping the main processing stages separate.

* **Background processing:** FastAPI `BackgroundTasks` keeps extraction out of the upload request. It is suitable for this demo, but it is not a durable job queue and would be replaced by independent workers in production.

* **Storage:** SQLite and the local filesystem keep setup simple. Production would use shared object storage and a managed database.

* **OCR:** Mock OCR is the default to keep the project self-contained. Local Tesseract OCR is available as an optional provider, while the `OCRClient` abstraction allows other providers to be added without changing PDF routing.

* **PDF routing:** The current heuristic routes pages with little usable embedded text to OCR. A production version could also consider image coverage and extracted-text quality.

* **Pagination:** The API bounds document and content queries using `offset` and `limit`. For very large datasets, cursor-based pagination would scale better than large offsets.

* **PDF viewer:** The demo loads PDF content blocks together to provide page-based navigation. Very large PDFs would benefit from page-aware server-side retrieval.

---
