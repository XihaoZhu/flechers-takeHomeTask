from abc import ABC, abstractmethod

import pymupdf


#abstract class is used so the orc method can easily swithed to different source
class OCRClient(ABC):
    @abstractmethod
    def extract_text(self, page: pymupdf.Page) -> str:
        pass


class MockOCRClient(OCRClient):
    def extract_text(self, page: pymupdf.Page) -> str:
        return "[Mock OCR result]"


class ExternalOCRClient(OCRClient):
    def extract_text(self, page: pymupdf.Page) -> str:
        raise NotImplementedError(
            "External OCR service is not configured in this demo."
        )
