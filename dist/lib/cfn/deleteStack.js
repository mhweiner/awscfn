"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStack = deleteStack;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const waitUntilStackTerminal_1 = require("./waitUntilStackTerminal");
const toResult_1 = require("../toResult");
const _1 = require(".");
async function deleteStack(stack) {
    console.log(`deleting stack ${stack.StackName}...`);
    const cf = (0, _1.getCfClient)();
    const deleteStackCommand = new client_cloudformation_1.DeleteStackCommand({ StackName: stack.StackName });
    await cf.send(deleteStackCommand);
    const [err] = await (0, toResult_1.toResultAsync)((0, waitUntilStackTerminal_1.waitUntilStackTerminal)(stack.StackName));
    if (err && err.message !== 'stack not found')
        throw err;
    console.log(`🗑 successfully deleted stack ${stack.StackName} (${stack.StackId})`);
}
//# sourceMappingURL=deleteStack.js.map