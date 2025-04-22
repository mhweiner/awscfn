import {Template, TemplateParams, getCfClient} from './index';
import {
    CreateChangeSetCommand,
    ExecuteChangeSetCommand,
    waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';

type ChangeSetOperation = 'UPDATE' | 'CREATE';

async function createChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation
): Promise<string> {

    const cf = getCfClient();
    const changeset = await cf.send(new CreateChangeSetCommand({
        StackName: stackName,
        TemplateBody: typeof template === 'string' ? template : template.template,
        ChangeSetName: `${stackName}-rev-${Date.now()}`,
        ChangeSetType: operation,
        Parameters: typeof template === 'string' ? undefined : Object.entries(template.params).map(([key, value]) => ({
            ParameterKey: key,
            ParameterValue: value,
        })),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
    }));

    console.log(changeset);

    await waitUntilChangeSetCreateComplete({client: cf, maxWaitTime: 120}, {
        ChangeSetName: changeset.Id,
    });

    return changeset.Id as string;

}

export async function createAndExecChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation
): Promise<string> {

    console.log(`creating changeset for ${stackName} with operation ${operation}`);

    const cf = getCfClient();
    const changeSetId = await createChangeSet(stackName, template, operation);

    console.log(`executing changeset ${changeSetId}`);

    await cf.send(new ExecuteChangeSetCommand({
        ChangeSetName: changeSetId,
    }));

    return changeSetId;

}
