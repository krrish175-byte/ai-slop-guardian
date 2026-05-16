import os
from typing import List, Optional, Dict, Any
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

class DistributedVectorStore:
    def __init__(self, collection_name: str = "ai_dna"):
        self.host = os.getenv("QDRANT_HOST", "localhost")
        self.port = int(os.getenv("QDRANT_PORT", 6333))
        self.collection_name = collection_name
        self.client = QdrantClient(host=self.host, port=self.port)
        self._ensure_collection()

    def _ensure_collection(self):
        """Ensures the collection exists in Qdrant with correct dimensions."""
        try:
            self.client.get_collection(self.collection_name)
        except (UnexpectedResponse, Exception):
            # dimension 384 for all-MiniLM-L6-v2
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=384,
                    distance=models.Distance.COSINE
                ),
            )

    def search(self, vector: np.ndarray, k: int = 3) -> List[Dict[str, Any]]:
        """Search for nearest neighbors in the collection."""
        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=vector[0].tolist() if len(vector.shape) > 1 else vector.tolist(),
                limit=k,
                with_payload=True
            )
            return [
                {
                    "score": r.score,
                    "payload": r.payload,
                    "id": r.id
                } for r in results
            ]
        except Exception as e:
            print(f"Vector Store Search Error: {e}")
            return []

    def add(self, vector: np.ndarray, payload: Optional[Dict[str, Any]] = None):
        """Add a vector with optional payload to the collection."""
        try:
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=str(os.urandom(16).hex()),
                        vector=vector[0].tolist() if len(vector.shape) > 1 else vector.tolist(),
                        payload=payload or {}
                    )
                ]
            )
        except Exception as e:
            print(f"Vector Store Add Error: {e}")

    def get_count(self) -> int:
        """Returns the total number of vectors in the collection."""
        try:
            return self.client.get_collection(self.collection_name).points_count
        except Exception:
            return 0
