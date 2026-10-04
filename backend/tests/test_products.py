from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_products():
    response = client.get("/products")

    assert response.status_code == 200

    data = response.json()

    assert "items" in data
    assert "total" in data
    assert data["total"] == 4


def test_search_products():
    response = client.get("/products?search=laptop")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["name"] == "Smart Laptop"


def test_inactive_product_is_not_returned():
    response = client.get("/products/6")

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"