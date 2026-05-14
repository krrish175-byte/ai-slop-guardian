import re

class JavaParser:
    def extract_features(self, content: str):
        classes = re.findall(r'class\s+(\w+)', content)
        methods = re.findall(r'(public|private|protected)?\s+\w+\s+(\w+)\s*\(', content)
        imports = re.findall(r'import\s+([\w\.]+);', content)

        return {
            "classes": classes,
            "methods": [m[1] for m in methods],
            "imports": imports
        }