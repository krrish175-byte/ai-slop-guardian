from typing import List, Dict
from indexer.chunker import Chunker

class RepoScanner:
    def __init__(self):
        self.chunker = Chunker()
        self.allowed_extensions = {
            ".md", ".py", ".js", ".ts", ".go", ".rs", ".java", 
            ".cpp", ".c", ".txt", ".sh", ".sql"
        }
        self.skip_dirs = {
            "node_modules", ".git", "dist", "build", "__pycache__", 
            "vendor", ".gradle", ".idea"
        }

    def process_files(self, repo_id: str, files: List[Dict]) -> List[Dict]:
        all_chunks = []
        for f in files:
            path = f.get("path", "")
            content = f.get("content", "")
            
            # Basic filtering
            if any(skip in path for skip in self.skip_dirs):
                continue
                
            if not any(path.endswith(ext) for ext in self.allowed_extensions):
                continue
                
            if not content:
                continue
                
            chunks = self.chunker.chunk_file(path, content, repo_id)
            all_chunks.extend(chunks)
            
        return all_chunks
