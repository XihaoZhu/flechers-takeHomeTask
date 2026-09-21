import zipfile

import pytest
from docx import Document as DocxDocument

from app.main import validate_file_content


def test_rejects_fake_pdf(tmp_path):

    fake_pdf = tmp_path / "fake.pdf"
    fake_pdf.write_bytes(b"This is not actually a PDF file.")

    with pytest.raises(ValueError):
        validate_file_content(fake_pdf, ".pdf")


def test_rejects_fake_docx(tmp_path):

    fake_docx = tmp_path / "fake.docx"

    with zipfile.ZipFile(fake_docx, "w") as archive:
        archive.writestr("hello.txt", "This is just a normal ZIP file.")

    with pytest.raises(ValueError):
        validate_file_content(fake_docx, ".docx")


def test_accepts_valid_docx(tmp_path):

    valid_docx = tmp_path / "valid.docx"

    document = DocxDocument()
    document.add_paragraph("Valid document")
    document.save(valid_docx)

    validate_file_content(valid_docx, ".docx")
