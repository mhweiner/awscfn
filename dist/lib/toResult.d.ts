export type Result<E, T> = [E] | [undefined, T];
export type PromiseResult<E, T> = Promise<Result<E, T>>;
export declare function toResult<E extends Error, T>(executable: () => T): Result<E, T>;
export declare function toResultAsync<E extends Error, T>(p: Promise<T>): PromiseResult<E, T>;
