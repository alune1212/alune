from dataclasses import dataclass


@dataclass(frozen=True)
class TextChunk:
    chunk_index: int
    text: str


def chunk_text(text: str, *, chunk_size: int, chunk_overlap: int) -> list[TextChunk]:
    normalized = "\n".join(stripped for line in text.splitlines() if (stripped := line.strip()))
    if not normalized:
        return []
    if chunk_size <= 0:
        msg = "chunk_size must be greater than 0"
        raise ValueError(msg)
    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        msg = "chunk_overlap must be greater than or equal to 0 and smaller than chunk_size"
        raise ValueError(msg)

    chunks: list[TextChunk] = []
    step = chunk_size - chunk_overlap
    for start in range(0, len(normalized), step):
        chunk = normalized[start : start + chunk_size].strip()
        if chunk:
            chunks.append(TextChunk(chunk_index=len(chunks), text=chunk))
        if start + chunk_size >= len(normalized):
            break
    return chunks
