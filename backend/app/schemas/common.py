from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str


class MetaResponse(BaseModel):
    app_name: str
    version: str
    api_prefix: str
    features: list[str]


class MessageResponse(BaseModel):
    message: str

