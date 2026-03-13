"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toResult = toResult;
exports.toResultAsync = toResultAsync;
function toResult(executable) {
    try {
        const result = executable();
        return [undefined, result];
    }
    catch (e) {
        return [e];
    }
}
async function toResultAsync(p) {
    try {
        const result = await p;
        return [undefined, result];
    }
    catch (e) {
        return [e];
    }
}
//# sourceMappingURL=toResult.js.map