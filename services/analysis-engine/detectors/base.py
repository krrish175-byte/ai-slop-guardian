from abc import ABC, abstractmethod
from models.schemas import DetectorResult

class BaseDetector(ABC):
    name: str
    weight: float

    @abstractmethod
    async def detect(self, content: str, repo_id: str) -> DetectorResult:
        """
        Analyze the content and return a DetectorResult.
        """
        pass
