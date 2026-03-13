"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackCreateFailure = void 0;
exports.createStack = createStack;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const waitUntilStackTerminal_1 = require("./waitUntilStackTerminal");
const executeChangeSet_1 = require("./executeChangeSet");
const toResult_1 = require("../toResult");
async function createStack(stackName, template) {
    console.log(`creating stack ${stackName}`);
    const [sdkError, changeSetId] = await (0, toResult_1.toResultAsync)((0, executeChangeSet_1.createAndExecChangeSet)(stackName, template, 'CREATE'));
    if (sdkError) {
        throw new StackCreateFailure({
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
            sdkError,
        });
    }
    console.log(`created stack ${stackName} with changeset ${changeSetId}`);
    const result = await (0, waitUntilStackTerminal_1.waitUntilStackTerminalWithEvents)(stackName);
    const status = result.stack.StackStatus; // AWS type issue
    if (result.stack.StackStatus === client_cloudformation_1.StackStatus.CREATE_COMPLETE) {
        console.log(`✅ stack ${result.stack.StackId} is CREATE_COMPLETE`);
        return result.stack;
    }
    else {
        throw new StackCreateFailure({
            status,
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
            failureReason: result.failureReason,
        });
    }
}
class StackCreateFailure extends Error {
    constructor(data) {
        const reason = data.failureReason ? `\n\nReason: ${data.failureReason}` : '';
        super(`💥 Failed to create stack ${data.stackName}${reason}`);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = this.constructor.name;
        this.data = data;
    }
}
exports.StackCreateFailure = StackCreateFailure;
//# sourceMappingURL=createStack.js.map