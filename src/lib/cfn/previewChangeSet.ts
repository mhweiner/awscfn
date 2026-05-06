import {
    DeleteChangeSetCommand,
    DescribeChangeSetCommand,
    type Change,
    type DescribeChangeSetOutput,
} from '@aws-sdk/client-cloudformation';
import {formatChangeSetPreviewLines} from '../../cli/formatChangeSet';
import {
    submitChangeSetRequest,
    waitForChangeSetBuild,
    type ChangeSetOperation,
} from './executeChangeSet';
import {Template, TemplateParams, getCfClient} from './index';
import {cyan, dim, gray, info, success, symbols} from '../output';

function isNoChangesOutcome(desc: DescribeChangeSetOutput): boolean {

    const reason = desc.StatusReason ?? '';

    return Boolean(desc.Status === 'FAILED'
           && (reason.includes('didn\'t contain changes')
               || reason.includes('No updates are to be performed')));

}

async function describeChangeSetPaginated(changeSetId: string): Promise<DescribeChangeSetOutput> {

    const cf = getCfClient();
    let nextToken: string | undefined;
    let first: DescribeChangeSetOutput | undefined;
    const allChanges: Change[] = [];

    do {

        const page = await cf.send(new DescribeChangeSetCommand({
            ChangeSetName: changeSetId,
            NextToken: nextToken,
        }));

        if (!first) {

            first = page;

        }

        allChanges.push(...(page.Changes ?? []));
        nextToken = page.NextToken;

    } while (nextToken);

    return {...(first ?? {}), Changes: allChanges};

}

async function deleteChangeSetQuiet(changeSetId: string): Promise<void> {

    const cf = getCfClient();

    try {

        await cf.send(new DeleteChangeSetCommand({
            ChangeSetName: changeSetId,
        }));

    } catch {

        // Best-effort cleanup after preview

    }

}

function printPlannedTable(stackName: string, desc: DescribeChangeSetOutput): void {

    console.log('');
    info(`${symbols.arrow} Planned resource changes for ${cyan(stackName)}`);

    const lines = formatChangeSetPreviewLines(desc.Changes ?? []);

    for (const line of lines) console.log(line);

    console.log('');

    const statusNote = `  ${symbols.info} Change set status: ${desc.Status ?? 'unknown'}${
        desc.ExecutionStatus ? ` · execution: ${desc.ExecutionStatus}` : ''}`;

    dim(statusNote);

    success(`${symbols.check} Preview complete — change set was not executed`);

}

async function runPreviewFromBuiltChangeSet(
    stackName: string,
    changeSetId: string,
): Promise<void> {

    const desc = await describeChangeSetPaginated(changeSetId);

    if (isNoChangesOutcome(desc)) {

        success(`${symbols.check} Stack ${cyan(stackName)} — no changes to apply`);

        return;

    }

    if (desc.Status !== 'CREATE_COMPLETE') {

        throw new Error(desc.StatusReason ?? `Change set status: ${desc.Status ?? 'unknown'}`);

    }

    printPlannedTable(stackName, desc);

}

/**
 * Build a change set, print planned resource changes (without executing), then delete the change set.
 */
export async function previewChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
): Promise<void> {

    dim(`  ${symbols.bullet} Building change set ${gray(`(${operation.toLowerCase()} preview)`)}`);

    const changeSetId = await submitChangeSetRequest(stackName, template, operation);

    try {

        try {

            await waitForChangeSetBuild(changeSetId);

        } catch {

            const descEarly = await describeChangeSetPaginated(changeSetId);

            if (isNoChangesOutcome(descEarly)) {

                success(`${symbols.check} Stack ${cyan(stackName)} — no changes to apply`);

                return;

            }

            throw new Error(descEarly.StatusReason ?? 'Change set did not complete successfully');

        }

        await runPreviewFromBuiltChangeSet(stackName, changeSetId);

    } finally {

        await deleteChangeSetQuiet(changeSetId);

    }

}
