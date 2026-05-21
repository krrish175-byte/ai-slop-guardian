from typing import List, Dict
from indexer.chunker import Chunker
import ast

class PythonASTVisitor(ast.NodeVisitor):
    def __init__(self):
        self.functions = []
        self.classes = []
        self.imports = []

    def visit_FunctionDef(self, node):
        self.functions.append(node.name)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self.functions.append(node.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        self.classes.append(node.name)
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)

    def visit_ImportFrom(self, node):
        if node.module:
            self.imports.append(node.module)
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
            
            # Parse Python AST
            if path.endswith(".py"):
                try:
                    tree = ast.parse(content)

                    visitor = PythonASTVisitor()
                    visitor.visit(tree)

                    ast_summary = {
                        "functions": visitor.functions,
                        "classes": visitor.classes,
                        "imports": visitor.imports,
                    }

                    content += f"\n\nAST_METADATA: {ast_summary}"

                except SyntaxError:
                    pass

            chunks = self.chunker.chunk_file(path, content, repo_id)
            all_chunks.extend(chunks)

        return all_chunks
