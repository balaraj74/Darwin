from pydantic import BaseModel
from typing import List


class CodeFile(BaseModel):
    file_path: str
    content: str


class FileTree(BaseModel):
    files: List[str]
