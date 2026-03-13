"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAndExecChangeSet = createAndExecChangeSet;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const index_1 = require("./index");
const output_1 = require("../output");
function hasParams(template) {
    if (typeof template === 'string')
        return false;
    const p = template.params;
    return Boolean(p && Object.keys(p).length > 0);
}
function toCfnParameters(params) {
    return Object.entries(params).map(([key, value]) => ({
        ParameterKey: key,
        ParameterValue: String(value),
    }));
}
async function createChangeSet(stackName, template, operation) {
    const cf = (0, index_1.getCfClient)();
    const changeSetName = `${stackName}-rev-${Date.now()}`;
    const templateBody = typeof template === 'string' ? template : template.body;
    const parameters = hasParams(template)
        ? toCfnParameters(template.params)
        : undefined;
    const changeset = await cf.send(new client_cloudformation_1.CreateChangeSetCommand({
        StackName: stackName,
        TemplateBody: templateBody,
        ChangeSetName: changeSetName,
        ChangeSetType: operation,
        Parameters: parameters,
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