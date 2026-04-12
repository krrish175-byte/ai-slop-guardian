import os
import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict

class VectorStore:
    def __init__(self, data_dir: str = "data/faiss"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        self.model_id = "all-MiniLM-L6-v2"
        self.model = None

    def _load_model(self):
        if self.model is None:
            self.model = SentenceTransformer(self.model_id)

    def build_index(self, repo_id: str, chunks: List[Dict]):
        self._load_model()
        
        repo_id_clean = repo_id.replace("/", "_")
        index_path = os.path.join(self.data_dir, f"{repo_id_clean}.index")
        meta_path = os.path.join(self.data_dir, f"{repo_id_clean}.json")
        
        contents = [c["content"] for c in chunks]
        embeddings = self.model.encode(contents)
        
        # Convert to float32 and normalize for cosine similarity via inner product
        embeddings = np.array(embeddings).astype('float32')
        faiss.normalize_L2(embeddings)
        
        dimension = embeddings.shape[1]
        # IndexFlatIP is inner product (cosine similarity on normalized vectors)
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        faiss.write_index(index, index_path)
        
        with open(meta_path, "w") as f:
            json.dump(chunks, f)
            
        return len(chunks)

    def search(self, repo_id: str, query_vector: np.ndarray, k: int = 5):
        repo_id_clean = repo_id.replace("/", "_")
        index_path = os.path.join(self.data_dir, f"{repo_id_clean}.index")
        meta_path = os.path.join(self.data_dir, f"{repo_id_clean}.json")
        
        if not os.path.exists(index_path):
            return [], []
            
        index = faiss.read_index(index_path)
        distances, indices = index.search(query_vector, k)
        
        with open(meta_path, "r") as f:
            all_chunks = json.load(f)
            
        results = []
        for i in range(len(indices[0])):
            idx = indices[0][i]
            if idx < len(all_chunks):
                results.append(all_chunks[idx])
                
        return results, distances[0].tolist()
