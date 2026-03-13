"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndExecChangeSet = createAndExecChangeSet;
const index_1 = require("./index");
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const output_1 = require("../output");
async function createChangeSet(stackName, template, operation) {
    const cf = (0, index_1.getCfClient)();
    const changeSetName = `${stackName}-rev-${Date.now()}`;
    const changeset = await cf.send(new client_cloudformation_1.CreateChangeSetCommand({
        StackName: stackName,
        TemplateBody: typeof template === 'string' ? template : template.body,
        ChangeSetName: changeSetName,
        ChangeSetType: operation,
        Parameters: typeof template === 'string' ? undefined : Object.entries(template.params).map(([key, value]) => ({
            ParameterKey: key,
            ParameterValue: value,
        })),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
    }));
    (0, output_1.dim)(`  ${output_1.symbols.ellipsis} Waiting for changeset to be ready...`);
    await (0, client_cloudformation_1.waitUntilChangeSetCreateComplete)({ client: cf, maxWaitTime: 120 }, {
        ChangeSetName: changeset.Id,
    });
    return changeset.Id;
}
async function createAndExecChangeSet(stackName, template, operation) {
    (0, output_1.dim)(`  ${output_1.symbols.bullet} Creating changeset ${(0, output_1.gray)(`(${operation.toLowerCase()})`)}`);
    const cf = (0, index_1.getCfClient)();
    const changeSetId = await createChangeSet(stackName, template, operation);
    (0, output_1.dim)(`  ${output_1.symbols.bullet} Executing changeset...`);
    await cf.send(new client_cloudformation_1.ExecuteChangeSetCommand({
        ChangeSetName: changeSetId,
    }));
    return changeSetId;
}
//# sourceMappingURL=executeChangeSet.js.map