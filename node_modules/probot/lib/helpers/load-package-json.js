import fs from "node:fs";
import path from "node:path";
export function loadPackageJson(filepath = path.join(process.cwd(), "package.json")) {
    let pkgContent;
    try {
        pkgContent = fs.readFileSync(filepath, "utf8");
    }
    catch {
        return {};
    }
    try {
        const pkg = pkgContent && JSON.parse(pkgContent);
        if (pkg && typeof pkg === "object") {
            return pkg;
        }
        return {};
    }
    catch {
        return {};
    }
}
