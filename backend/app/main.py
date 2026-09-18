from fastapi import FastAPI, HTTPException

from .data import products
from .models import Product, ProductCreate


app = FastAPI(
    title="SmartCart API",
    description="Backend API for the SmartCart AI-powered e-commerce platform",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "smartcart-backend",
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to SmartCart API",
    }


@app.get("/products", response_model=list[Product])
def get_products():
    return products


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    for product in products:
        if product.id == product_id:
            return product

    raise HTTPException(
        status_code=404,
        detail="Product not found",
    )


@app.post("/products", response_model=Product, status_code=201)
def create_product(product: ProductCreate):
    new_product = Product(
        id=len(products) + 1,
        **product.model_dump(),
    )

    products.append(new_product)

    return new_product
