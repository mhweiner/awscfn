"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStackResourcesByLogicalResourceId = getStackResourcesByLogicalResourceId;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const _1 = require(".");
async function getStackResourcesByLogicalResourceId(stackName, logicalResourceId) {
    const cf = (0, _1.getCfClient)();
    const response = await cf.send(new client_cloudformation_1.DescribeStackResourcesCommand({
        StackName: stackName,
        LogicalResourceId: logicalResourceId,
    }));
    if (!response.StackResources)
        throw new Error(`resource not found: stack: ${stackName}, logicalResourceId: ${logicalResourceId}`);
    return response.StackResources;
}
//# sourceMappingURL=getStackResource.js.map