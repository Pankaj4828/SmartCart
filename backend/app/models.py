from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    description: str
    image_url: str | None = None


class Product(ProductCreate):
    id: int
    is_active: bool

class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: float | None = None
    description: str | None = None
    image_url: str | None = None

class WishlistItem(BaseModel):
    id: int
    product_id: int
    product: Product
    created_at: datetime


class ProductListResponse(BaseModel):
    items: list[Product]
    total: int
    page: int
    limit: int
    total_pages: int


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    payment_method: Literal[
        "UPI",
        "CARD",
        "COD",
    ]

    customer_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str

    items: list[OrderItemCreate] = Field(
        min_length=1,
    )


class OrderItem(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: float
    quantity: int


class Order(BaseModel):
    id: int
    status: str
    payment_method: str

    customer_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str

    total_amount: float
    created_at: datetime

    items: list[OrderItem]

class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    mobile_number: str = Field(
        min_length=10,
        max_length=20,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class User(BaseModel):
    id: int
    name: str
    email: EmailStr
    mobile_number: str
    role: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str