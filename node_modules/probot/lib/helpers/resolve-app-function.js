import { resolve } from "import-meta-resolve";
import { pathToFileURL } from "node:url";
export const resolveAppFunction = async (appFnId, opts = {}) => {
    // These are mostly to ease testing
    const basedir = process.cwd();
    const resolver = opts.resolver || resolve;
    const appFnPath = resolver(appFnId, pathToFileURL(basedir).href + "/");
    const { default: mod } = await import(appFnPath);
    // mod.default gets exported by transpiled TypeScript code
    return mod.__esModule && mod.default ? mod.default : mod;
};
