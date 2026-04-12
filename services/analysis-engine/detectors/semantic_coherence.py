from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
from detectors.base import BaseDetector
from models.schemas import DetectorResult
from typing import List

class SemanticCoherenceDetector(BaseDetector):
    name = "SemanticCoherence"
    weight = 0.10

    def __init__(self):
        self.model_id = "all-MiniLM-L6-v2"
        self.model = None

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer(self.model_id)

    async def detect(self, content: str, repo_id: str, history: List[str] = []) -> DetectorResult:
        # Expected content format: "TITLE\n\nBODY\n\n--- DIFF ---\nDIFF"
        parts = content.split("--- DIFF ---")
        if len(parts) < 2:
            return DetectorResult(
                name=self.name,
                score=0.0,
                confidence=0.5,
                signals=["Content format not suitable for semantic coherence check."]
            )

        metadata = parts[0].strip()
        diff = parts[1].strip()

        if len(metadata) < 20 or len(diff) < 50:
             return DetectorResult(
                name=self.name,
                score=0.0,
                confidence=0.5,
                signals=["Insufficient content for semantic mapping."]
            )

        self._load_model()
        
        # 1. Embed metadata (Title + Body)
        meta_vec = self.model.encode([metadata])
        faiss.normalize_L2(meta_vec)
        
        # 2. Embed diff
        diff_vec = self.model.encode([diff[:5000]]) # Limit diff size
        faiss.normalize_L2(diff_vec)
        
        # 3. Compute similarity
        similarity = float(np.dot(meta_vec, diff_vec.T)[0][0])
        
        # Logic: AI PRs sometimes have a generic title but weird code, or vice versa
        # Low similarity (< 0.3) -> High slop signal
        if similarity < 0.3:
            score = 1.0
            signals = [f"Critical semantic mismatch between PR description and code changes (Sim: {similarity:.2f})"]
        elif similarity < 0.45:
            score = 0.6
            signals = [f"Low semantic coherence detected ({similarity:.2f})"]
        else:
            score = 0.0
            signals = [f"PR description semantically aligns with code changes ({similarity:.2f})"]

        return DetectorResult(
            name=self.name,
            score=score,
            confidence=0.85,
            signals=signals
        )
