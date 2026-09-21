from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.dependencies import get_db
from app.main import app


@pytest.fixture
def db_session(tmp_path):
    database_path = tmp_path / "test.db"

    engine = create_engine(
        f"sqlite:///{database_path}",
        connect_args={"check_same_thread": False},
    )

    TestSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    Base.metadata.create_all(bind=engine)

    db = TestSessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_database_fixture(db_session):
    document = models.Document(
        filename="test.pdf",
        file_type="pdf",
        status="completed",
        storage_key="test.pdf",
    )

    db_session.add(document)
    db_session.commit()

    saved_document = db_session.get(
        models.Document,
        document.id,
    )

    assert saved_document is not None
    assert saved_document.filename == "test.pdf"


def test_get_document_returns_404_when_not_found(client):
    response = client.get("/documents/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Document not found."}


def test_get_document_returns_document(
    client,
    db_session,
):
    document = models.Document(
        filename="medical.pdf",
        file_type="pdf",
        status="completed",
        storage_key="internal-123.pdf",
    )

    db_session.add(document)
    db_session.commit()

    response = client.get(f"/documents/{document.id}")

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert "storage_key" not in response.json()


def test_list_documents_order(client, db_session):
    document1 = models.Document(
        filename="old.pdf",
        file_type="pdf",
        status="completed",
        storage_key="doc1.pdf",
        created_at=datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc),
    )

    document2 = models.Document(
        filename="new.pdf",
        file_type="pdf",
        status="completed",
        storage_key="doc2.pdf",
        created_at=datetime(2024, 1, 2, 12, 0, 0, tzinfo=timezone.utc),
    )

    db_session.add_all([document1, document2])
    db_session.commit()

    response = client.get("/documents")

    assert response.status_code == 200
    documents = response.json()["documents"]
    assert len(documents) == 2
    assert documents[0]["filename"] == "new.pdf"
    assert documents[1]["filename"] == "old.pdf"


def test_block_sequence_order(client, db_session):
    document = models.Document(
        filename="test.pdf",
        file_type="pdf",
        status="completed",
        storage_key="test.pdf",
    )

    db_session.add(document)
    db_session.commit()

    block1 = models.ContentBlock(
        document_id=document.id,
        sequence=2,
        page_number=1,
        text="Second block",
        extraction_method="pdf_digital",
    )

    block2 = models.ContentBlock(
        document_id=document.id,
        sequence=1,
        page_number=1,
        text="First block",
        extraction_method="pdf_digital",
    )

    block3 = models.ContentBlock(
        document_id=document.id,
        sequence=3,
        page_number=3,
        text="Third block",
        extraction_method="pdf_digital",
    )

    db_session.add_all([block1, block2, block3])
    db_session.commit()

    response = client.get(f"/documents/{document.id}/blocks")

    assert response.status_code == 200
    blocks = response.json()["blocks"]
    assert len(blocks) == 3
    sequences = [block["sequence"] for block in response.json()["blocks"]]
    assert sequences == [1, 2, 3]


def test_list_documents_pagination(client, db_session):

    response = client.get("/documents?offset=0&limit=9999")

    assert response.status_code == 422
