import os
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from detectors.base import BaseDetector
from models.schemas import DetectorResult

class EmbeddingDetector(BaseDetector):
    name = "Embedding"
    weight = 0.25

    def __init__(self):
        self.model_id = "all-MiniLM-L6-v2"
        self.model = None
        self.index_cache = {}

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer(self.model_id)

    async def detect(self, content: str, repo_id: str, history: List[str] = []) -> DetectorResult:
        self._load_model()
        
        # Check if FAISS index exists for this repo
        index_path = f"data/faiss/{repo_id.replace('/', '_')}.index"
        if not os.path.exists(index_path):
            return DetectorResult(
                name=self.name,
                score=0.5,
                confidence=0.3,
                signals=["No style index exists for this repository yet. Using neutral score."]
            )
        
        # Load index (in a real app, we'd cache this)
        index = faiss.read_index(index_path)
        
        # Embed query content
        query_vector = self.model.encode([content])
        faiss.normalize_L2(query_vector)
        
        # Search for top-5 neighbors
        distances, indices = index.search(query_vector, 5)
        
        # In IndexFlatIP, distance is inner product (cosine similarity since vectors are normalized)
        # avg_similarity = np.mean(distances[0])
        # Distance > 0.4 (low similarity) -> foreign content -> high AI probability
        # Similarity < 0.6 -> high AI probability
        
        avg_sim = float(np.mean(distances[0]))
        
        # avg_sim < 0.15 -> score 0.9 (AI-like deviation)
        # avg_sim > 0.40 -> score 0.1 (Human-like similarity to repo)
        if avg_sim < 0.15:
            score = 0.9
        elif avg_sim > 0.40:
            score = 0.1
        else:
            # Linear map 0.15 -> 0.9, 0.40 -> 0.1
            score = 0.9 - (avg_sim - 0.15) * (0.8 / 0.25)
            
        return DetectorResult(
            name=self.name,
            score=round(score, 2),
            confidence=0.75,
            signals=[
                f"Style similarity to repo baseline: {avg_sim:.2f}",
                "Content is stylistically foreign to this repo's writing history" if avg_sim < 0.2 else "Content matches repo writing style"
            ]
        )
