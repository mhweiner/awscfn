export function isError(e: unknown): e is Error {

    return typeof e === 'object' && e !== null && 'message' in e;

}
