from pydantic import BaseModel


class ApiResponse[DataT](BaseModel):
    success: bool
    data: DataT
    message: str = "OK"
    error: str | None = None
