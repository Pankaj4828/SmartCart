import re

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from ..db_models import ProductDB


QUERY_STOP_WORDS = {
    "find",
    "show",
    "give",
    "get",
    "under",
    "below",
    "less",
    "than",
    "upto",
    "recommend",
    "recommendation",
    "products",
    "product",
    "please",
    "need",
    "want",
    "looking",
    "for",
    "with",
    "from",
    "the",
    "what",
    "is",
    "of",
    "price",
    "cost",
    "how",
    "much",
    "do",
    "you",
    "have",
    "can",
    "i",
    "something",
    "anything",
    "suggest",
    "suggestions",
    "some",
    "any",
}

QUERY_CONCEPTS = {
    "music": ["audio", "headphones"],
    "listening": ["audio", "headphones"],
    "headphones": ["audio", "headphones"],
    "fitness": ["wearables", "watch"],
    "exercise": ["wearables", "watch"],
    "health": ["wearables", "watch"],
    "work": ["computers", "laptop"],
    "office": ["computers", "laptop"],
    "laptop": ["laptop"],
    "computer": ["computers", "laptop"],
    "gaming": ["gaming", "mouse"],
    "mouse": ["mouse"],
}


def extract_max_price(message: str) -> float | None:
    match = re.search(
        r"(?:under|below|less than|upto|up to)\s*[₹rs.]?\s*([\d,]+)",
        message.lower(),
    )

    if not match:
        return None

    return float(
        match.group(1).replace(",", "")
    )


def get_relevant_products(
    db: Session,
    message: str,
) -> list[ProductDB]:
    max_price = extract_max_price(message)

    query = select(ProductDB).where(
        ProductDB.is_active.is_(True)
    )

    if max_price is not None:
        query = query.where(
            ProductDB.price <= max_price
        )

    search_terms = [
        term
        for term in re.findall(
            r"[a-zA-Z]+",
            message.lower(),
        )
        if len(term) >= 3
        and term not in QUERY_STOP_WORDS
    ]

    if search_terms:
            expanded_terms = expand_search_terms(
                search_terms
            )

            term_conditions = []

            for alternatives in expanded_terms:
                alternative_conditions = []

                for term in alternatives:
                    pattern = f"%{term}%"

                    alternative_conditions.extend(
                        [
                            ProductDB.name.ilike(pattern),
                            ProductDB.category.ilike(pattern),
                            ProductDB.description.ilike(pattern),
                        ]
                    )

                term_conditions.append(
                    or_(*alternative_conditions)
                )

            # Independent search terms must all match,
            # while alternatives inside a concept can match
            # any one of the alternatives.
            query = query.where(
                and_(*term_conditions)
            )

    return db.scalars(
        query
        .order_by(ProductDB.id.asc())
        .limit(8)
    ).all()
    
    
def expand_search_terms(
    search_terms: list[str],
) -> list[list[str]]:
    expanded_terms = []

    for term in search_terms:
        concepts = QUERY_CONCEPTS.get(term)

        if concepts:
            expanded_terms.append(concepts)
        else:
            expanded_terms.append([term])

    return expanded_terms


def build_product_response(
    products: list[ProductDB],
) -> str:
    if not products:
        return (
            "I couldn't find any SmartCart products "
            "matching your request."
        )

    if len(products) == 1:
        product = products[0]

        return (
            f"{product.name} is available for "
            f"₹{product.price:.2f}. "
            f"{product.description}"
        )

    lines = [
        f"I found {len(products)} SmartCart products "
        "that match your request:"
    ]

    for product in products:
        lines.append(
            f"• {product.name} — ₹{product.price:.2f}"
        )

    return "\n".join(lines)


def build_product_context(
    products: list[ProductDB],
) -> str:
    if not products:
        return (
            "No matching SmartCart products "
            "were found."
        )

    lines = [
        "Available SmartCart products:"
    ]

    for product in products:
        lines.append(
            f"- {product.name} | "
            f"Category: {product.category} | "
            f"Price: ₹{product.price:.2f} | "
            f"Description: {product.description}"
        )

    return "\n".join(lines)