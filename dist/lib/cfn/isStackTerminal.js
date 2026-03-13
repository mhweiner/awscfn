"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStackTerminal = isStackTerminal;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
function isStackTerminal(stack) {
    return [
        client_cloudformation_1.StackStatus.CREATE_COMPLETE,
        client_cloudformation_1.StackStatus.CREATE_FAILED,
        client_cloudformation_1.StackStatus.DELETE_COMPLETE,
        client_cloudformation_1.StackStatus.DELETE_FAILED,
        client_cloudformation_1.StackStatus.ROLLBACK_COMPLETE,
        client_cloudformation_1.StackStatus.ROLLBACK_FAILED,
        client_cloudformation_1.StackStatus.UPDATE_COMPLETE,
        client_cloudformation_1.StackStatus.UPDATE_ROLLBACK_COMPLETE,
        client_cloudformation_1.StackStatus.UPDATE_ROLLBACK_FAILED,
    ].indexOf(stack.StackStatus) !== -1;
}
//# sourceMappingURL=isStackTerminal.js.map