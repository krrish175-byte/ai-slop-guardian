import statistics
import re
from detectors.base import BaseDetector
from models.schemas import DetectorResult

class BurstinessDetector(BaseDetector):
    name = "Burstiness"
    weight = 0.05

    async def detect(self, content: str, repo_id: str) -> DetectorResult:
        # Split content into sentences
        sentences = [s.strip() for s in re.split(r'[.!?]\s+', content) if s.strip()]
        
        if len(sentences) < 5:
            return DetectorResult(
                name=self.name,
                score=0.5,
                confidence=0.3,
                signals=["Too few sentences for reliable burstiness analysis."]
            )
        
        lengths = [len(s.split()) for s in sentences]
        variance = statistics.variance(lengths)
        mean = statistics.mean(lengths)
        
        # burstiness = variance / (mean + 1) -> coefficient of variation approximation
        burstiness = variance / (mean + 1)
        
        # burstiness < 1.5 -> AI-like (score 0.8)
        # burstiness > 4.0 -> human-like (score 0.2)
        if burstiness < 1.5:
            score = 0.8
        elif burstiness > 4.0:
            score = 0.2
        else:
            # Linear interpolation
            # 1.5 -> 0.8, 4.0 -> 0.2
            # score = 0.8 - (burstiness - 1.5) * (0.6 / 2.5)
            score = 0.8 - (burstiness - 1.5) * 0.24
            
        return DetectorResult(
            name=self.name,
            score=round(score, 2),
            confidence=0.7,
            signals=[f"Burstiness index: {burstiness:.2f} (AI typically < 1.5, Human > 4.0)"]
        )
