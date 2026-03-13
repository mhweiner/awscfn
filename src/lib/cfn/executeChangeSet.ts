import {Template, TemplateParams, getCfClient} from './index';
import {
    CreateChangeSetCommand,
    ExecuteChangeSetCommand,
    waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import {dim, gray, symbols} from '../output';

type ChangeSetOperation = 'UPDATE' | 'CREATE';

async function createChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation
): Promise<string> {

    const cf = getCfClient();
    const changeSetName = `${stackName}-rev-${Date.now()}`;
    const changeset = await cf.send(new CreateChangeSetCommand({
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

    dim(`  ${symbols.ellipsis} Waiting for changeset to be ready...`);

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

    dim(`  ${symbols.bullet} Creating changeset ${gray(`(${operation.toLowerCase()})`)}`);

    const cf = getCfClient();
    const changeSetId = await createChangeSet(stackName, template, operation);

    dim(`  ${symbols.bullet} Executing changeset...`);

    await cf.send(new ExecuteChangeSetCommand({
        ChangeSetName: changeSetId,
    }));

    return changeSetId;

}
