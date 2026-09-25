from pydantic import BaseModel


class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    response: str


class AIProductIntent(BaseModel):
    intent: str
    search_terms: list[str]
    max_price: float | None = None