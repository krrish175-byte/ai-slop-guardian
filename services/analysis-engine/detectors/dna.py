import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from detectors.base import BaseDetector
from models.schemas import DetectorResult

class DNADetector(BaseDetector):
    name = "DNA"
    weight = 0.15

    def __init__(self):
        self.model_id = "all-MiniLM-L6-v2"
        self.model = None
        self.index_path = "data/faiss/shared_dna.index"
        os.makedirs("data/faiss", exist_ok=True)

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer(self.model_id)

    def _get_index(self):
        if os.path.exists(self.index_path):
            return faiss.read_index(self.index_path)
        else:
            # Create a new index if none exists (dim=384 for all-MiniLM-L6-v2)
            index = faiss.IndexFlatIP(384)
            return index

    async def detect(self, content: str, repo_id: str, history: List[str] = []) -> DetectorResult:
        self._load_model()
        index = self._get_index()
        
        if index.ntotal == 0:
            # First run, nothing to match against
            # We'll need to add THIS content to the index AFTER the whole analysis is done, 
            # but for now we just return neutral.
            return DetectorResult(
                name=self.name,
                score=0.0,
                confidence=0.5,
                signals=["Global DNA index is empty. First scan recorded."]
            )

        # Embed query content
        query_vector = self.model.encode([content])
        faiss.normalize_L2(query_vector)
        
        # Search for nearest neighbors
        k = min(3, index.ntotal)
        distances, indices = index.search(query_vector, k)
        
        max_sim = float(np.max(distances[0]))
        
        # Threshold: 0.92 as requested
        if max_sim > 0.92:
            score = 1.0
            signals = [f"Near-duplicate of a previously analyzed PR detected (Similarity: {max_sim:.2f})"]
        elif max_sim > 0.80:
            score = 0.5
            signals = [f"High structural similarity to previous outputs (Similarity: {max_sim:.2f})"]
        else:
            score = 0.0
            signals = [f"Unique code signature (Max global similarity: {max_sim:.2f})"]

        return DetectorResult(
            name=self.name,
            score=score,
            confidence=0.9,
            signals=signals
        )

    def add_to_index(self, content: str):
        """Called after analysis to persist the output to the global index"""
        self._load_model()
        index = self._get_index()
        vector = self.model.encode([content])
        faiss.normalize_L2(vector)
        index.add(vector)
        faiss.write_index(index, self.index_path)
