"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParamsFromStack = getParamsFromStack;
function getParamsFromStack(stack) {
    const params = {};
    stack.Parameters?.forEach((param) => {
        params[param.ParameterKey] = param.ParameterValue;
    });
    return params;
}
//# sourceMappingURL=getParamsFromStack.js.map