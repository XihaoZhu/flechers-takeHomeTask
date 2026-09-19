from dataclasses import dataclass


@dataclass
class ExtractedBlock:
    text: str
    page_number: int | None
    extraction_method: str