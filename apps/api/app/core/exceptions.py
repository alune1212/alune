from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.common.response import ApiResponse


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=ApiResponse[None](
            success=False,
            data=None,
            message="Internal server error",
            error=exc.__class__.__name__,
        ).model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(Exception, unhandled_exception_handler)
