from typing import List, Dict

class Chunker:
    def __init__(self, max_tokens: int = 512, overlap: int = 64):
        self.max_tokens = max_tokens
        # Approximation: 1 token ≈ 0.75 words -> 512 tokens ≈ 384 words
        self.max_words = int(max_tokens * 0.75)
        self.overlap_words = int(overlap * 0.75)

    def chunk_file(self, file_path: str, content: str, repo_id: str) -> List[Dict]:
        words = content.split()
        chunks = []
        
        if not words:
            return []
            
        start = 0
        chunk_idx = 0
        while start < len(words):
            end = start + self.max_words
            chunk_words = words[start:end]
            chunk_content = " ".join(chunk_words)
            
            chunks.append({
                "repo_id": repo_id,
                "file_path": file_path,
                "chunk_index": chunk_idx,
                "content": chunk_content
            })
            
            start += (self.max_words - self.overlap_words)
            chunk_idx += 1
            
            if start >= len(words):
                break
                
        return chunks
