import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from detectors.base import BaseDetector
from models.schemas import DetectorResult
from typing import List

class GhostAuthorDetector(BaseDetector):
    name = "GhostAuthor"
    weight = 0.20

    def __init__(self):
        self.model_id = "all-MiniLM-L6-v2"
        self.model = None

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer(self.model_id)

    async def detect(self, content: str, repo_id: str, history: List[str] = []) -> DetectorResult:
        if not history or len(history) < 3:
            return DetectorResult(
                name=self.name,
                score=0.0,
                confidence=0.3,
                signals=["Insufficient history for ghost author detection (need >= 3 PRs)."]
            )

        self._load_model()
        
        # 1. Embed current content
        current_vector = self.model.encode([content])
        faiss.normalize_L2(current_vector)
        
        # 2. Embed history
        history_vectors = self.model.encode(history)
        faiss.normalize_L2(history_vectors)
        
        # 3. Compute centroid
        centroid = np.mean(history_vectors, axis=0, keepdims=True)
        faiss.normalize_L2(centroid)
        
        # 4. Compute cosine similarity (dot product of normalized vectors)
        similarity = float(np.dot(current_vector, centroid.T)[0][0])
        
        # Distance > 0.5 (Similarity < 0.5) -> High deviation
        deviation = 1.0 - similarity
        
        if deviation > 0.5:
            score = 1.0
            signals = [f"Significant style deviation from 10 historical PRs: {deviation*100:.1f}%"]
        elif deviation > 0.3:
            score = 0.5
            signals = [f"Moderate style deviation from history: {deviation*100:.1f}%"]
        else:
            score = 0.0
            signals = [f"Stylistic match with historical contributions (Similarity: {similarity:.2f})"]

        return DetectorResult(
            name=self.name,
            score=score,
            confidence=0.8,
            signals=signals
        )
