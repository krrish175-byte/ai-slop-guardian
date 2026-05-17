import re


class JavaParser:
    def extract_features(self, content: str):
        classes = re.findall(r'class\s+(\w+)', content)

        method_pattern = (
            r'(public|private|protected)?\s*'
            r'(static\s+)?'
            r'(final\s+)?'
            r'(\w+.*?>|\w+)'
            r'\s+(\w+)\s*\('
        )

        constructor_pattern = (
            r'(public|private|protected)?\s+'
            r'(\w+)\s*\('
        )

        import_pattern = r'import\s+([\w\.\*]+);'

        methods = re.findall(method_pattern, content)
        constructors = re.findall(constructor_pattern, content)
        imports = re.findall(import_pattern, content)

        extracted_methods = [
            m[4] for m in methods
        ]

        extracted_constructors = [
            c[1] for c in constructors
        ]

        return {
            "classes": classes,
            "methods": (
                extracted_methods + extracted_constructors
            ),
            "imports": imports
        }
