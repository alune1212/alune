from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException, status


@dataclass(frozen=True)
class ParsedDocument:
    title: str
    text: str


_TEXT_CONTENT_TYPES = {
    "text/plain",
    "text/markdown",
    "application/markdown",
    "text/x-markdown",
}
_DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
_PDF_CONTENT_TYPE = "application/pdf"


def parse_document_bytes(
    content: bytes,
    *,
    filename: str,
    content_type: str | None,
) -> ParsedDocument:
    suffix = Path(filename).suffix.lower()
    if content_type in _TEXT_CONTENT_TYPES or suffix in {".txt", ".md", ".markdown"}:
        return ParsedDocument(title=filename, text=_decode_text(content))
    if content_type == _DOCX_CONTENT_TYPE or suffix == ".docx":
        return ParsedDocument(title=filename, text=_parse_docx(content))
    if content_type == _PDF_CONTENT_TYPE or suffix == ".pdf":
        return ParsedDocument(title=filename, text=_parse_pdf_fallback(content))

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="当前仅支持 PDF、DOCX、TXT 和 Markdown 文档",
    )


def _decode_text(content: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "gb18030"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace")


def _parse_docx(content: bytes) -> str:
    try:
        with ZipFile(BytesIO(content)) as archive:
            document_xml = archive.read("word/document.xml")
    except (BadZipFile, KeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DOCX 文档无法解析",
        ) from exc

    try:
        root = ElementTree.fromstring(document_xml)
    except ElementTree.ParseError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DOCX 文档内容无效",
        ) from exc

    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    paragraphs: list[str] = []
    for paragraph in root.iter(f"{namespace}p"):
        texts = [node.text or "" for node in paragraph.iter(f"{namespace}t")]
        line = "".join(texts).strip()
        if line:
            paragraphs.append(line)
    return "\n".join(paragraphs)


def _parse_pdf_fallback(content: bytes) -> str:
    decoded = content.decode("latin-1", errors="ignore")
    snippets: list[str] = []
    for raw in decoded.replace("\\)", ")").replace("\\(", "(").split("(")[1:]:
        value = raw.split(")", 1)[0].strip()
        if len(value) >= 2:
            snippets.append(value)
    text = "\n".join(snippets).strip()
    if text:
        return text
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="PDF 文档无法提取文本, 请先上传可复制文本的 PDF",
    )
