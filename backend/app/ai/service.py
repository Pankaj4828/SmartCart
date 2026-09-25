import os

import httpx


OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://localhost:11434",
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "tinyllama",
)


async def generate_response(
    message: str,
    product_context: str,
) -> str:
    prompt = (
        "You are SmartCart AI, a concise shopping assistant.\n"
        "Answer the user's question briefly and clearly.\n"
        "Use only the product information provided below.\n"
        "Do not invent products, prices, or availability.\n"
        "If the provided products do not answer the question, "
        "say that the requested product was not found.\n\n"
        f"{product_context}\n\n"
        f"User: {message}"
    )

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 48,
        },
    }

    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json=payload,
        )

    response.raise_for_status()

    data = response.json()

    return data["response"]