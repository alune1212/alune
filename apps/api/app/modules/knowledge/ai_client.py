import asyncio
import json
from dataclasses import dataclass
from typing import Any, cast
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status


@dataclass(frozen=True)
class OpenAICompatibleClient:
    base_url: str
    api_key: str | None
    chat_model: str
    embedding_model: str

    async def embed(self, inputs: list[str]) -> list[list[float]]:
        payload: dict[str, Any] = {"model": self.embedding_model, "input": inputs}
        body = await self._post_json("/embeddings", payload)
        data = body.get("data")
        if not isinstance(data, list):
            raise HTTPException(status_code=502, detail="Embedding 服务响应无效")
        return [cast(list[float], item["embedding"]) for item in cast(list[dict[str, Any]], data)]

    async def chat(self, prompt: str) -> str:
        payload: dict[str, Any] = {
            "model": self.chat_model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个严谨的知识库问答助手, 只基于给定资料回答。",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        body = await self._post_json("/chat/completions", payload)
        choices = body.get("choices")
        if not isinstance(choices, list) or not choices:
            raise HTTPException(status_code=502, detail="问答服务响应无效")
        message = cast(dict[str, Any], choices[0]).get("message", {})
        content = message.get("content")
        if not isinstance(content, str):
            raise HTTPException(status_code=502, detail="问答服务响应无效")
        return content

    async def _post_json(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI 服务未配置, 请设置 AI_API_KEY",
            )
        return await asyncio.to_thread(self._post_json_sync, path, payload)

    def _post_json_sync(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url.rstrip('/')}{path}"
        request = Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=60) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise HTTPException(status_code=502, detail=f"AI 服务请求失败: {detail}") from exc
        except (URLError, TimeoutError) as exc:
            raise HTTPException(status_code=502, detail="AI 服务暂不可用") from exc
