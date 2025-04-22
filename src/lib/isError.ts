export function isError(e: any): e is Error {

    return e.message !== undefined;

}
