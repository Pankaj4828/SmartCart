from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import delete, func, select
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from .database import get_db
from .db_models import (
    OrderDB,
    OrderItemDB,
    ProductDB,
    UserDB,
    WishlistItemDB,
)
from .models import (
    Order,
    OrderCreate,
    OrderItem,
    Product,
    ProductCreate,
    ProductUpdate,
    ProductListResponse,
    User,
    UserCreate,
    Token,
    WishlistItem,
)


from fastapi.security import OAuth2PasswordRequestForm
from .auth import (
    create_access_token,
    get_current_admin,
    get_current_user,
    hash_password,
    verify_password,
)
from typing import Literal
from .ai.router import router as ai_router


ORDER_STATUSES = {
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
}

ORDER_STATUS_TRANSITIONS = {
    "PLACED": {
        "CONFIRMED",
        "CANCELLED",
    },
    "CONFIRMED": {
        "SHIPPED",
        "CANCELLED",
    },
    "SHIPPED": {
        "OUT_FOR_DELIVERY",
    },
    "OUT_FOR_DELIVERY": {
        "DELIVERED",
    },
    "DELIVERED": set(),
    "CANCELLED": set(),
}

app = FastAPI(
    title="SmartCart API",
    description="Backend API for the SmartCart AI-powered e-commerce platform",
    version="0.1.0",
)

app.include_router(ai_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/products", response_model=ProductListResponse)
def get_products(
    search: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort: str | None = None,
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db),
):
    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="Page must be greater than 0",
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 100",
        )

    query = select(ProductDB).where(
    ProductDB.is_active.is_(True)
    )

    if search:
        search_pattern = f"%{search}%"

        query = query.where(
            ProductDB.name.ilike(search_pattern)
            | ProductDB.description.ilike(search_pattern)
        )

    if category:
        query = query.where(
            ProductDB.category == category
        )

    if min_price is not None:
        query = query.where(
            ProductDB.price >= min_price
        )

    if max_price is not None:
        query = query.where(
            ProductDB.price <= max_price
        )

    if sort == "price_asc":
        query = query.order_by(ProductDB.price.asc())

    elif sort == "price_desc":
        query = query.order_by(ProductDB.price.desc())

    elif sort == "name_asc":
        query = query.order_by(ProductDB.name.asc())

    elif sort == "name_desc":
        query = query.order_by(ProductDB.name.desc())

    else:
        query = query.order_by(ProductDB.id.asc())

    # Count matching products before pagination.
    count_query = select(
        func.count()
    ).select_from(
        query.order_by(None).subquery()
    )

    total = db.scalar(count_query) or 0

    offset = (page - 1) * limit

    products = db.scalars(
        query.offset(offset).limit(limit)
    ).all()

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return ProductListResponse(
        items=[
            Product.model_validate(
                product,
                from_attributes=True,
            )
            for product in products
        ],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@app.get("/products/{product_id}", response_model=Product)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = db.scalar(
        select(ProductDB).where(
            ProductDB.id == product_id,
            ProductDB.is_active.is_(True),
        )
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return Product.model_validate(
        product,
        from_attributes=True,
    )

@app.get(
    "/admin/products",
    response_model=list[Product],
)
def get_admin_products(
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    products = db.scalars(
        select(ProductDB).order_by(
            ProductDB.id.asc()
        )
    ).all()

    return [
        Product.model_validate(
            product,
            from_attributes=True,
        )
        for product in products
    ]

@app.get(
    "/admin/users",
    response_model=list[User],
)
def get_admin_users(
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    users = db.scalars(
        select(UserDB).order_by(
            UserDB.created_at.desc()
        )
    ).all()

    return [
        User.model_validate(
            user,
            from_attributes=True,
        )
        for user in users
    ]


@app.post("/products", response_model=Product, status_code=201)
def create_product(
    product: ProductCreate,
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    new_product = ProductDB(
        **product.model_dump(),
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return Product.model_validate(
        new_product,
        from_attributes=True,
    )

@app.patch(
    "/admin/products/{product_id}",
    response_model=Product,
)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    product = db.get(ProductDB, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    update_data = product_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return Product.model_validate(
        product,
        from_attributes=True,
    )

@app.patch(
    "/admin/products/{product_id}/deactivate",
    response_model=Product,
)
def deactivate_product(
    product_id: int,
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    product = db.get(ProductDB, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    if not product.is_active:
        raise HTTPException(
            status_code=400,
            detail="Product is already inactive",
        )

    product.is_active = False

    db.commit()
    db.refresh(product)

    return Product.model_validate(
        product,
        from_attributes=True,
    )

@app.patch(
    "/admin/products/{product_id}/activate",
    response_model=Product,
)
def activate_product(
    product_id: int,
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    product = db.get(ProductDB, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    if product.is_active:
        raise HTTPException(
            status_code=400,
            detail="Product is already active",
        )

    product.is_active = True

    db.commit()
    db.refresh(product)

    return Product.model_validate(
        product,
        from_attributes=True,
    )

@app.post(
    "/auth/register",
    response_model=User,
    status_code=201,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    email = str(user.email).lower()

    existing_email = db.scalar(
        select(UserDB).where(
            UserDB.email == email
        )
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    existing_mobile = db.scalar(
        select(UserDB).where(
            UserDB.mobile_number
            == user.mobile_number
        )
    )

    if existing_mobile is not None:
        raise HTTPException(
            status_code=409,
            detail="Mobile number is already registered",
        )

    new_user = UserDB(
        name=user.name,
        email=email,
        mobile_number=user.mobile_number,
        password_hash=hash_password(
            user.password
        ),
        role="CUSTOMER",
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return User(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        mobile_number=new_user.mobile_number,
        role=new_user.role,
        is_active=new_user.is_active,
        created_at=new_user.created_at,
    )

@app.post(
    "/auth/token",
    response_model=Token,
)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username.lower()

    user = db.scalar(
        select(UserDB).where(
            UserDB.email == email
        )
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not verify_password(
        form_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
    )

@app.get(
    "/auth/me",
    response_model=User,
)
def get_me(
    current_user: UserDB = Depends(
        get_current_user
    ),
):
    return User(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        mobile_number=current_user.mobile_number,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
    )

@app.post(
    "/wishlist/{product_id}",
    response_model=WishlistItem,
    status_code=201,
)
def add_to_wishlist(
    product_id: int,
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    product = db.scalar(
    select(ProductDB).where(
        ProductDB.id == product_id,
        ProductDB.is_active.is_(True),
       )
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    existing_item = db.scalar(
        select(WishlistItemDB).where(
            WishlistItemDB.user_id == current_user.id,
            WishlistItemDB.product_id == product_id,
        )
    )

    if existing_item is not None:
        raise HTTPException(
            status_code=409,
            detail="Product is already in your wishlist",
        )

    wishlist_item = WishlistItemDB(
        user_id=current_user.id,
        product_id=product_id,
    )

    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)

    return WishlistItem(
        id=wishlist_item.id,
        product_id=wishlist_item.product_id,
        product=Product.model_validate(
            product,
            from_attributes=True,
        ),
        created_at=wishlist_item.created_at,
    )

@app.get(
    "/wishlist",
    response_model=list[WishlistItem],
)
def get_wishlist(
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    wishlist_items = db.scalars(
    select(WishlistItemDB)
    .join(
        ProductDB,
        WishlistItemDB.product_id == ProductDB.id,
    )
    .options(
        selectinload(WishlistItemDB.product)
    )
    .where(
        WishlistItemDB.user_id == current_user.id,
        ProductDB.is_active.is_(True),
    )
    .order_by(
        WishlistItemDB.created_at.desc()
    )
    ).all()

    return [
        WishlistItem(
            id=item.id,
            product_id=item.product_id,
            product=Product.model_validate(
                item.product,
                from_attributes=True,
            ),
            created_at=item.created_at,
        )
        for item in wishlist_items
    ]

@app.delete(
    "/wishlist/{product_id}",
    status_code=204,
)
def remove_from_wishlist(
    product_id: int,
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    wishlist_item = db.scalar(
        select(WishlistItemDB).where(
            WishlistItemDB.user_id == current_user.id,
            WishlistItemDB.product_id == product_id,
        )
    )

    if wishlist_item is None:
        raise HTTPException(
            status_code=404,
            detail="Product is not in your wishlist",
        )

    db.delete(wishlist_item)
    db.commit()

    return None


@app.post(
    "/orders",
    response_model=Order,
    status_code=201,
)
def create_order(
    order: OrderCreate,
     current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    order_items: list[OrderItemDB] = []
    total_amount = 0.0

    for item in order.items:
        product = db.scalar(
            select(ProductDB).where(
                ProductDB.id == item.product_id,
                ProductDB.is_active.is_(True),
            )
        )

        if product is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Product {item.product_id} "
                    "not found"
                ),
            )

        item_total = (
            product.price * item.quantity
        )

        total_amount += item_total

        order_item = OrderItemDB(
            product_id=product.id,
            product_name=product.name,
            price=product.price,
            quantity=item.quantity,
        )

        order_items.append(order_item)

    new_order = OrderDB(
        user_id=current_user.id,
        status="PLACED",
        payment_method=order.payment_method,
        customer_name=order.customer_name,
        phone=order.phone,
        address=order.address,
        city=order.city,
        state=order.state,
        pincode=order.pincode,
        total_amount=total_amount,
    )

    new_order.items = order_items

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return Order(
        id=new_order.id,
        status=new_order.status,
        payment_method=new_order.payment_method,
        customer_name=new_order.customer_name,
        phone=new_order.phone,
        address=new_order.address,
        city=new_order.city,
        state=new_order.state,
        pincode=new_order.pincode,
        total_amount=new_order.total_amount,
        created_at=new_order.created_at,
        items=[
            OrderItem(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                price=item.price,
                quantity=item.quantity,
            )
            for item in new_order.items
        ],
    )

@app.get(
    "/orders",
    response_model=list[Order],
)
def get_orders(
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    orders = db.scalars(
        select(OrderDB)
        .options(
            selectinload(OrderDB.items)
        )
        .where(
            OrderDB.user_id == current_user.id
        )
        .order_by(
            OrderDB.created_at.desc()
        )
    ).all()

    return [
        Order(
            id=order.id,
            status=order.status,
            payment_method=order.payment_method,
            customer_name=order.customer_name,
            phone=order.phone,
            address=order.address,
            city=order.city,
            state=order.state,
            pincode=order.pincode,
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=[
                OrderItem(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    price=item.price,
                    quantity=item.quantity,
                )
                for item in order.items
            ],
        )
        for order in orders
    ]

@app.get(
    "/orders/{order_id}",
    response_model=Order,
)
def get_order(
    order_id: int,
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    order = db.scalar(
        select(OrderDB)
        .options(
            selectinload(OrderDB.items)
        )
        .where(
            OrderDB.id == order_id,
            OrderDB.user_id == current_user.id,
        )
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    return Order(
        id=order.id,
        status=order.status,
        payment_method=order.payment_method,
        customer_name=order.customer_name,
        phone=order.phone,
        address=order.address,
        city=order.city,
        state=order.state,
        pincode=order.pincode,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItem(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                price=item.price,
                quantity=item.quantity,
            )
            for item in order.items
        ],
    )

@app.get(
    "/admin/orders",
    response_model=list[Order],
)
def get_admin_orders(
    current_admin: UserDB = Depends(
        get_current_admin
    ),
    db: Session = Depends(get_db),
):
    orders = db.scalars(
        select(OrderDB)
        .options(
            selectinload(OrderDB.items)
        )
        .order_by(
            OrderDB.created_at.desc()
        )
    ).all()

    return [
        Order(
            id=order.id,
            status=order.status,
            payment_method=order.payment_method,
            customer_name=order.customer_name,
            phone=order.phone,
            address=order.address,
            city=order.city,
            state=order.state,
            pincode=order.pincode,
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=[
                OrderItem(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    price=item.price,
                    quantity=item.quantity,
                )
                for item in order.items
            ],
        )
        for order in orders
    ]

@app.patch(
    "/orders/{order_id}/cancel",
    response_model=Order,
)
def cancel_order(
    order_id: int,
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    order = db.scalar(
        select(OrderDB)
        .options(
            selectinload(OrderDB.items)
        )
        .where(
            OrderDB.id == order_id,
            OrderDB.user_id == current_user.id,
        )
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    cancellable_statuses = {
        "PLACED",
        "CONFIRMED",
    }

    if order.status not in cancellable_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Order cannot be cancelled "
                f"when status is {order.status}"
            ),
        )

    order.status = "CANCELLED"

    db.commit()
    db.refresh(order)

    return Order(
        id=order.id,
        status=order.status,
        payment_method=order.payment_method,
        customer_name=order.customer_name,
        phone=order.phone,
        address=order.address,
        city=order.city,
        state=order.state,
        pincode=order.pincode,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItem(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                price=item.price,
                quantity=item.quantity,
            )
            for item in order.items
        ],
    )

@app.patch(
    "/orders/{order_id}/status",
    response_model=Order,
)
def update_order_status(
    order_id: int,
    new_status: Literal[
        "CONFIRMED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
    ],
    current_user: UserDB = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    order = db.scalar(
        select(OrderDB)
        .options(
            selectinload(OrderDB.items)
        )
        .where(
            OrderDB.id == order_id
        )
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    allowed_statuses = (
        ORDER_STATUS_TRANSITIONS.get(
            order.status,
            set(),
        )
    )

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Order cannot move from "
                f"{order.status} to "
                f"{new_status}"
            ),
        )

    order.status = new_status

    db.commit()
    db.refresh(order)

    return Order(
        id=order.id,
        status=order.status,
        payment_method=order.payment_method,
        customer_name=order.customer_name,
        phone=order.phone,
        address=order.address,
        city=order.city,
        state=order.state,
        pincode=order.pincode,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            OrderItem(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                price=item.price,
                quantity=item.quantity,
            )
            for item in order.items
        ],
    )
