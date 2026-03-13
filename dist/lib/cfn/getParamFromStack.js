"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParamFromStack = getParamFromStack;
function getParamFromStack(stack, paramName) {
    const param = stack.Parameters?.find((param) => param.ParameterKey === paramName);
    if (param) {
        return param.ParameterValue ?? '';
    }
    throw new Error(`Parameter ${paramName} not found in stack ${stack.StackName}`);
}
//# sourceMappingURL=getParamFromStack.js.map