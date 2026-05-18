import javalang


class JavaParser:
    def extract_features(self, content: str):
        try:
            tree = javalang.parse.parse(content)
        except Exception:
            return {
                "classes": [],
                "methods": [],
                "imports": []
            }

        classes = []
        methods = []
        imports = []

        for path, node in tree:
            if isinstance(node, javalang.tree.ClassDeclaration):
                classes.append(node.name)

            elif isinstance(node, javalang.tree.MethodDeclaration):
                methods.append(node.name)

            elif isinstance(node, javalang.tree.Import):
                imports.append(node.path)

        return {
            "classes": classes,
            "methods": methods,
            "imports": imports
        }
