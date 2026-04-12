import type { ApplicationFunction } from "../types.js";
type ImportMetaResolve = (specifier: string, parent?: string) => string;
export declare const resolveAppFunction: (appFnId: string, opts?: ResolveOptions) => Promise<ApplicationFunction>;
export interface ResolveOptions {
    basedir?: string;
    resolver?: ImportMetaResolve;
}
export {};
