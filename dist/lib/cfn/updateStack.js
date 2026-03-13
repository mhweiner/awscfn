"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackUpdateFailure = void 0;
exports.updateStack = updateStack;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const waitUntilStackTerminal_1 = require("./waitUntilStackTerminal");
const executeChangeSet_1 = require("./executeChangeSet");
const deleteStack_1 = require("./deleteStack");
const createStack_1 = require("./createStack");
const isStackTerminal_1 = require("./isStackTerminal");
const toResult_1 = require("../toResult");
// eslint-disable-next-line max-lines-per-function
async function updateStack(existingStack, template) {
    console.log(`updating stack ${existingStack.StackName}`);
    if (!(0, isStackTerminal_1.isStackTerminal)(existingStack))
        throw new Error('stack still in progress');
    if (existingStack.StackStatus === client_cloudformation_1.StackStatus.ROLLBACK_COMPLETE) {
        console.log(`stack ${existingStack.StackName} is currently in ROLLBACK_COMPLETE and must be deleted first`);
        return deleteAndCreateInstead(existingStack, template);
    }
    const [sdkError, changeSetId] = await (0, toResult_1.toResultAsync)((0, executeChangeSet_1.createAndExecChangeSet)(existingStack.StackName, template, 'UPDATE'));
    const result = await (0, waitUntilStackTerminal_1.waitUntilStackTerminalWithEvents)(existingStack.StackName);
    const status = result.stack.StackStatus;
    if (sdkError) {
        throw new StackUpdateFailure({
            stackName: existingStack.StackName,
            originalStack: existingStack,
            terminalStack: result.stack,
            status,
            sdkError,
            failureReason: result.failureReason,
        });
    }
    if (status === client_cloudformation_1.StackStatus.UPDATE_COMPLETE) {
        console.log(`✅ updated stack ${result.stack.StackId} with changeset ${changeSetId}`);
        return result.stack;
    }
    else {
        throw new StackUpdateFailure({
            stackName: existingStack.StackName,
            originalStack: existingStack,
            terminalStack: result.stack,
            status,
            failureReason: result.failureReason,
        });
    }
}
class StackUpdateFailure extends Error {
    constructor(data) {
        const reason = data.failureReason ? `\n\nReason: ${data.failureReason}` : '';
        super(`💥 Failed to update stack ${data.stackName}${reason}`);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = this.constructor.name;
        this.data = data;
    }
}
exports.StackUpdateFailure = StackUpdateFailure;
async function deleteAndCreateInstead(stack, template) {
    await (0, deleteStack_1.deleteStack)(stack);
    return (0, createStack_1.createStack)(stack.StackName, template);
}
//# sourceMappingURL=updateStack.js.map