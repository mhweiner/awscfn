"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndExecChangeSet = createAndExecChangeSet;
const index_1 = require("./index");
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
async function createChangeSet(stackName, template, operation) {
    const cf = (0, index_1.getCfClient)();
    const changeset = await cf.send(new client_cloudformation_1.CreateChangeSetCommand({
        StackName: stackName,
        TemplateBody: typeof template === 'string' ? template : template.body,
        ChangeSetName: `${stackName}-rev-${Date.now()}`,
        ChangeSetType: operation,
        Parameters: typeof template === 'string' ? undefined : Object.entries(template.params).map(([key, value]) => ({
            ParameterKey: key,
            ParameterValue: value,
        })),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
    }));
    console.log(changeset);
    await (0, client_cloudformation_1.waitUntilChangeSetCreateComplete)({ client: cf, maxWaitTime: 120 }, {
        ChangeSetName: changeset.Id,
    });
    return changeset.Id;
}
async function createAndExecChangeSet(stackName, template, operation) {
    console.log(`creating changeset for ${stackName} with operation ${operation}`);
    const cf = (0, index_1.getCfClient)();
    const changeSetId = await createChangeSet(stackName, template, operation);
    console.log(`executing changeset ${changeSetId}`);
    await cf.send(new client_cloudformation_1.ExecuteChangeSetCommand({
        ChangeSetName: changeSetId,
    }));
    return changeSetId;
}
//# sourceMappingURL=executeChangeSet.js.map