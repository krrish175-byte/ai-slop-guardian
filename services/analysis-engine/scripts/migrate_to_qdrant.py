import os
import sys
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Add parent dir to sys.path to allow imports from utils
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

def migrate():
    # We use a try-import for faiss as it might not be installed in all environments
    try:
        import faiss
    except ImportError:
        print("Error: 'faiss' is required for migration but not installed.")
        return

    index_path = "data/faiss/shared_dna.index"
    if not os.path.exists(index_path):
        print(f"No FAISS index found at {index_path}. Skipping migration.")
        return

    print(f"Loading FAISS index from {index_path}...")
    try:
        index = faiss.read_index(index_path)
    except Exception as e:
        print(f"Error reading FAISS index: {e}")
        return

    ntotal = index.ntotal
    print(f"Found {ntotal} vectors to migrate.")

    if ntotal == 0:
        print("Index is empty. Skipping.")
        return

    # Extract all vectors from the index
    try:
        # Reconstruct all vectors from 0 to ntotal
        vectors = np.zeros((ntotal, index.d), dtype='float32')
        for i in range(ntotal):
            vectors[i] = index.reconstruct(i)
    except Exception as e:
        print(f"Error reconstructing vectors: {e}")
        print("Note: Migration might fail if the FAISS index doesn't support reconstruction.")
        return

    # Connect to Qdrant
    qdrant_host = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port = int(os.getenv("QDRANT_PORT", 6333))
    client = QdrantClient(host=qdrant_host, port=qdrant_port)
    collection_name = "shared_dna"

    print(f"Connecting to Qdrant at {qdrant_host}:{qdrant_port}...")
    
    # Create/Reset collection
    client.recreate_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=vectors.shape[1],
            distance=models.Distance.COSINE
        ),
    )

    print(f"Migrating {ntotal} vectors to Qdrant collection '{collection_name}'...")
    
    # Upsert in batches to avoid overwhelming the network
    batch_size = 100
    for i in range(0, ntotal, batch_size):
        end = min(i + batch_size, ntotal)
        batch_vectors = vectors[i:end].tolist()
        
        points = [
            models.PointStruct(
                id=str(os.urandom(16).hex()),
                vector=v,
                payload={"migrated_from": "faiss", "index": i + j}
            ) for j, v in enumerate(batch_vectors)
        ]
        
        client.upsert(
            collection_name=collection_name,
            points=points
        )
        print(f"Migrated {end}/{ntotal}...")

    print("Migration complete!")

if __name__ == "__main__":
    migrate()
