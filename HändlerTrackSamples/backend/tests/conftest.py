"""
Pytest configuration and fixtures for Händler TrackSamples tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from database.database import Base, get_db
from main import app

# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client"""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def sample_data():
    """Sample data for testing"""
    return {
        "reference_code": "REF-TEST-001",
        "description": "Muestra de prueba para testing",
        "supplier": "Proveedor Test S.A.S",
        "batch_number": "LOTE-2024-001",
        "chemical_composition": "Agua destilada",
        "business_line": "Cosmética",
        "quantity": 100.0,
        "unit": "kg",
        "zone": "COS",
        "shelf": "E1",
        "level": "N1",
        "position": "P01",
        "status": "available",
        "is_compatible": True
    }


@pytest.fixture
def user_data():
    """User data for testing"""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Usuario de Prueba",
        "password": "testpassword123"
    }
