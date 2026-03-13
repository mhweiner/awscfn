"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackCreateFailure = void 0;
exports.createStack = createStack;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const waitUntilStackTerminal_1 = require("./waitUntilStackTerminal");
const executeChangeSet_1 = require("./executeChangeSet");
const toResult_1 = require("../toResult");
const output_1 = require("../output");
async function createStack(stackName, template) {
    (0, output_1.info)(`${output_1.symbols.arrow} Creating stack ${(0, output_1.cyan)(stackName)}`);
    const [sdkError] = await (0, toResult_1.toResultAsync)((0, executeChangeSet_1.createAndExecChangeSet)(stackName, template, 'CREATE'));
    if (sdkError) {
        throw new StackCreateFailure({
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
            sdkError,
        });
    }
    const result = await (0, waitUntilStackTerminal_1.waitUntilStackTerminalWithEvents)(stackName);
    const status = result.stack.StackStatus;
    if (result.stack.StackStatus === client_cloudformation_1.StackStatus.CREATE_COMPLETE) {
        (0, output_1.success)(`${output_1.symbols.check} Stack ${(0, output_1.cyan)(stackName)} created successfully`);
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