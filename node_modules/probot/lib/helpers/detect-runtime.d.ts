type Runtime = "node" | "deno" | "bun" | "browser";
export type GlobalThis = {
    process?: {
        versions?: {
            node?: string;
            deno?: string;
            bun?: string;
        };
    };
    window?: object;
};
export declare function detectRuntime(globalThis: GlobalThis): Runtime;
export {};
