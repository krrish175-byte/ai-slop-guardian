from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from detectors.base import BaseDetector
from models.schemas import DetectorResult
from utils.vector_store import DistributedVectorStore


class DNADetector(BaseDetector):
    name = "DNA"
    weight = 0.15

    def __init__(self):
        self.model_id = "all-MiniLM-L6-v2"
        self.model = None
        self.store = DistributedVectorStore(collection_name="shared_dna")

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer(self.model_id)

    async def detect(
        self, content: str, repo_id: str, history: List[str] = []
    ) -> DetectorResult:
        self._load_model()

        total_vectors = self.store.get_count()

        if total_vectors == 0:
            # First run, nothing to match against
            return DetectorResult(
                name=self.name,
                score=0.0,
                confidence=0.5,
                signals=["Global DNA index is empty. First scan recorded."]
            )

        # Embed query content
        query_vector = self.model.encode([content])
        # Note: DistributedVectorStore (Qdrant) handles normalization if configured
        # but we can also do it here if we want to be safe.
        # However, our store uses COSINE distance which is scale-invariant.

        # Search for nearest neighbors
        results = self.store.search(query_vector, k=3)

        if not results:
            return DetectorResult(
                name=self.name,
                score=0.0,
                confidence=0.8,
                signals=["No similar signatures found in global DNA database."]
            )

        max_sim = float(max(r["score"] for r in results))

        # Thresholds
        if max_sim > 0.92:
            score = 1.0
            signals = [
                (
                    "Near-duplicate of a previously analyzed PR detected "
                    f"(Similarity: {max_sim:.2f})"
                )
            ]
        elif max_sim > 0.80:
            score = 0.5
            signals = [
                (
                    "High structural similarity to previous outputs "
                    f"(Similarity: {max_sim:.2f})"
                )
            ]
        else:
            score = 0.0
            signals = [
                (
                    "Unique code signature "
                    f"(Max global similarity: {max_sim:.2f})"
                )
            ]

        return DetectorResult(
            name=self.name,
            score=score,
            confidence=0.9,
            signals=signals
        )

    def add_to_index(self, content: str):
        """Called after analysis to persist the output to the global index"""
        self._load_model()
        vector = self.model.encode([content])
        self.store.add(vector, payload={"content_hash": hash(content)})

