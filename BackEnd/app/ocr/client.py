from abc import ABC, abstractmethod
import pymupdf

class OCRClient(ABC):

    @abstractmethod
    def extract_text(self, page: pymupdf.Page) -> str:
        pass

class MockOCRClient(OCRClient):

    def extract_text(self, page: pymupdf.Page) -> str:
        return "[Mock OCR result]"