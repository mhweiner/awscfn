"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = isError;
function isError(e) {
    return typeof e === 'object' && e !== null && 'message' in e;
}
//# sourceMappingURL=isError.js.map