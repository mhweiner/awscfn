"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStackByName = getStackByName;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const toResult_1 = require("../toResult");
const _1 = require(".");
async function getStackByName(name, suppressLog = false) {
    !suppressLog && console.log(`looking up stack ${name}`);
    const cf = (0, _1.getCfClient)();
    const [error, result] = await (0, toResult_1.toResultAsync)(cf.send(new client_cloudformation_1.DescribeStacksCommand({ StackName: name })));
    if (error) {
        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
            !suppressLog && console.log('stack does not exist');
            return;
        }
        throw error; // Unexpected error occurred
    }
    const stack = result.Stacks ? result.Stacks[0] : undefined;
    if (stack) {
        !suppressLog && console.log(`found stack ${name} as ${stack.StackId}`);
        return stack;
    }
}
//# sourceMappingURL=getStackByName.js.map