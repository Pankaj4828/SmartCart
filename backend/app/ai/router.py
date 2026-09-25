from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from .product_context import (
    build_product_context,
    build_product_response,
    get_relevant_products,
)
from .schemas import AIChatRequest, AIChatResponse
from .service import generate_response


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


@router.post(
    "/chat",
    response_model=AIChatResponse,
)
async def chat(
    request: AIChatRequest,
    db: Session = Depends(get_db),
):
    try:
        products = get_relevant_products(
            db,
            request.message,
        )

        if products:
            response = build_product_response(
                products
            )
        else:
            product_context = build_product_context(
                products
            )

            response = await generate_response(
                request.message,
                product_context,
            )

        return AIChatResponse(
            response=response
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI service is currently unavailable.",
        )