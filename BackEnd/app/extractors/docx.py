from pathlib import Path

from docx import Document as DocxDocument

from .base import ExtractedBlock


def extract_docx(file_path: Path) -> list[ExtractedBlock]:

    document = DocxDocument(str(file_path))

    blocks = []

    #docx has no page so the paragraph was chosen as a natural seperator for chunking
    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            blocks.append(
                ExtractedBlock(
                    text=text, page_number=None, extraction_method="docx_text"
                )
            )

    return blocks
