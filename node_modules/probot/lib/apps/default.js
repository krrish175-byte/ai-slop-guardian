import { resolve } from "node:path";
import { loadPackageJson } from "../helpers/load-package-json.js";
import { probotView } from "../views/probot.js";
export function defaultApp(_app, { cwd = process.cwd() }) {
    const pkg = loadPackageJson(resolve(cwd, "package.json"));
    const probotViewRendered = probotView({
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
    });
    const defaultHandler = (req, res) => {
        if (req.method === "GET") {
            const path = req.url?.split("?")[0] || "";
            if (path === "/") {
                res
                    .writeHead(302, { "content-type": "text/plain", location: `/probot` })
                    .end(`Found. Redirecting to /probot`);
                return true;
            }
            if (path === "/probot") {
                res
                    .writeHead(200, { "content-type": "text/html" })
                    .end(probotViewRendered);
                return true;
            }
        }
        return false;
    };
    return defaultHandler;
}
