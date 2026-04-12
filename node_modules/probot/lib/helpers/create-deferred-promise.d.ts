export type DeferredPromise<T = void> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
};
export declare function createDeferredPromise<T = void>(): DeferredPromise<T>;
