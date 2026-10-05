import pytest

from app.database import SessionLocal
from app.db_models import ProductDB


@pytest.fixture(scope="session", autouse=True)
def prepare_test_products():
    """
    Prepare the products required by the backend tests.

    CI uses a fresh PostgreSQL database, so test data is created
    here rather than being hard-coded inside the GitHub Actions workflow.
    """
    db = SessionLocal()

    products = [
        ProductDB(
            id=1,
            name="Smart Laptop",
            category="Computers",
            price=64999,
            description="High-performance laptop for work and entertainment.",
            is_active=True,
        ),
        ProductDB(
            id=2,
            name="Wireless Headphones",
            category="Audio",
            price=4999,
            description="Noise-cancelling wireless headphones.",
            is_active=True,
        ),
        ProductDB(
            id=4,
            name="Smart Watch",
            category="Wearables",
            price=7999,
            description="Fitness and productivity smartwatch.",
            is_active=True,
        ),
        ProductDB(
            id=5,
            name="Gaming Mouse",
            category="Accessories",
            price=2499,
            description="Responsive gaming mouse.",
            is_active=True,
        ),
        ProductDB(
            id=6,
            name="Inactive Product",
            category="Test",
            price=100,
            description="Inactive product used by tests.",
            is_active=False,
        ),
    ]

    try:
        db.add_all(products)
        db.commit()
        yield
    finally:
        db.close()