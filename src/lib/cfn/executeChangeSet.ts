import {
    CreateChangeSetCommand,
    ExecuteChangeSetCommand,
    waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import {Template, TemplateParams, getCfClient} from './index';
import {dim, getOutputConfig, gray, startSpinner, symbols} from '../output';

type ChangeSetOperation = 'UPDATE' | 'CREATE';

function hasParams<P extends TemplateParams>(template: Template<P>): boolean {

    if (typeof template === 'string') return false;
    const p = template.params;

    return Boolean(p && Object.keys(p).length > 0);

}

function toCfnParameters(params: Record<string, unknown>): { ParameterKey: string; ParameterValue: string }[] {

    return Object.entries(params).map(([key, value]) => ({
        ParameterKey: key,
        ParameterValue: String(value),
    }));

}

// eslint-disable-next-line max-lines-per-function
async function createChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
): Promise<string> {

    const cf = getCfClient();
    const changeSetName = `${stackName}-rev-${Date.now()}`;
    const templateBody = typeof template === 'string' ? template : template.body;
    const parameters = hasParams(template)
        ? toCfnParameters((template as { params: Record<string, unknown> }).params)
        : undefined;

    const changeset = await cf.send(new CreateChangeSetCommand({
        StackName: stackName,
        TemplateBody: templateBody,
        ChangeSetName: changeSetName,
        ChangeSetType: operation,
        Parameters: parameters,
        Capabilities: ['CAPABILITY_NAMED_IAM'],
    }));

    const cfg = getOutputConfig();
    const stopSpinner = cfg.ci ? null : startSpinner();

    if (cfg.ci) dim(`  ${symbols.ellipsis} Waiting for changeset to be ready...`);

    try {

        await waitUntilChangeSetCreateComplete({client: cf, maxWaitTime: 120}, {
            ChangeSetName: changeset.Id,
        });

    } finally {

        if (stopSpinner) stopSpinner();

    }

    return changeset.Id as string;

}

export async function createAndExecChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
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
