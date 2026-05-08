import {
    CreateChangeSetCommand,
    ExecuteChangeSetCommand,
    waitUntilChangeSetCreateComplete,
} from '@aws-sdk/client-cloudformation';
import {Template, TemplateParams, getCfClient} from './index';
import {dim, getOutputConfig, gray, startSpinner, symbols} from '../output';

export type ChangeSetOperation = 'UPDATE' | 'CREATE';
export interface SubmitChangeSetOptions {
    clientToken?: string
}

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

/**
 * Create a change set and return its ARN/id (does not wait).
 */
export async function submitChangeSetRequest<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
    options: SubmitChangeSetOptions = {},
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
        Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        ClientToken: options.clientToken,
    }));

    return changeset.Id as string;

}

/**
 * Wait until the change set finishes building ({@link waitUntilChangeSetCreateComplete}) with spinner.
 */
export async function waitForChangeSetBuild(changeSetId: string): Promise<void> {

    const cf = getCfClient();
    const cfg = getOutputConfig();
    const stopSpinner = cfg.ci ? null : startSpinner();

    if (cfg.ci) dim(`  ${symbols.ellipsis} Waiting for changeset to be ready...`);

    try {

        await waitUntilChangeSetCreateComplete({client: cf, maxWaitTime: 120}, {
            ChangeSetName: changeSetId,
        });

    } finally {

        if (stopSpinner) stopSpinner();

    }

}


async function createChangeSetAndWait<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
): Promise<string> {

    const changeSetId = await submitChangeSetRequest(stackName, template, operation);

    await waitForChangeSetBuild(changeSetId);

    return changeSetId;

}

export async function createAndExecChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
): Promise<string> {

    dim(`  ${symbols.bullet} Creating changeset ${gray(`(${operation.toLowerCase()})`)}`);

    const changeSetId = await createChangeSetAndWait(stackName, template, operation);

    dim(`  ${symbols.bullet} Executing changeset...`);

    await executeExistingChangeSet(changeSetId);

    return changeSetId;

}

export async function executeExistingChangeSet(changeSetId: string): Promise<void> {

    const cf = getCfClient();

    await cf.send(new ExecuteChangeSetCommand({
        ChangeSetName: changeSetId,
    }));

}
