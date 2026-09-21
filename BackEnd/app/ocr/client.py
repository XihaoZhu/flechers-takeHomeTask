import os
from abc import ABC, abstractmethod
from io import BytesIO

import pymupdf
import pytesseract
from PIL import Image


# Abstract client keeps the extraction pipeline independent of the OCR provider.
class OCRClient(ABC):
    @abstractmethod
    def extract_text(self, page: pymupdf.Page) -> str:
        pass


class MockOCRClient(OCRClient):
    def extract_text(self, page: pymupdf.Page) -> str:
        return "[Mock OCR result]"


#The local OCR is with tesseract
class LocalOCRClient(OCRClient):
    def extract_text(self, page: pymupdf.Page) -> str:
        pixmap = page.get_pixmap(dpi=200)
        image = Image.open(BytesIO(pixmap.tobytes("png")))

        return pytesseract.image_to_string(image).strip()


class ExternalOCRClient(OCRClient):
    def extract_text(self, page: pymupdf.Page) -> str:
        raise NotImplementedError(
            "External OCR service is not configured in this demo."
        )
    
def get_ocr_client() -> OCRClient:
    provider = os.getenv("OCR_PROVIDER", "mock").lower()

    if provider == "local":
        return LocalOCRClient()

    if provider == "mock":
        return MockOCRClient()

    raise ValueError(f"Unsupported OCR provider: {provider}")