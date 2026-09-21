from pathlib import Path

import pymupdf

from app.ocr.client import OCRClient

from .base import ExtractedBlock


def extract_pdf(
    file_path: Path,
    ocr_client: OCRClient,
) -> list[ExtractedBlock]:

    blocks = []

    with pymupdf.open(file_path) as document:

        # A pdf file can be a mix of digital and scanned formats, so the extraction method was decided for each page
        for page_number, page in enumerate(document.pages(), start=1):
            text = page.get_text("text")
            if not should_use_ocr(text):
                blocks.append(
                    ExtractedBlock(
                        text=text, page_number=page_number, extraction_method="pdf_text"
                    )
                )
            else:
                ocr_text = ocr_client.extract_text(page)

                blocks.append(
                    ExtractedBlock(
                        text=ocr_text,
                        page_number=page_number,
                        extraction_method="pdf_ocr",
                    )
                )

    return blocks


MIN_USABLE_CHARACTERS = 20



#orc is involved if not enough valid text is extracted as if it's a digital pdf
def should_use_ocr(text: str) -> bool:

    usable_characters = sum(character.isalnum() for character in text)

    return usable_characters < MIN_USABLE_CHARACTERS
