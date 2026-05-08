import {
    DeleteChangeSetCommand,
    DescribeChangeSetCommand,
    type Change,
    type DescribeChangeSetOutput,
} from '@aws-sdk/client-cloudformation';
import {formatChangeSetPreviewLines} from '../formatChangeSet';
import {
    submitChangeSetRequest,
    waitForChangeSetBuild,
    type ChangeSetOperation,
    type SubmitChangeSetOptions,
} from './executeChangeSet';
import {Template, TemplateParams, getCfClient} from './index';
import {cyan, dim, gray, info, success, symbols} from '../output';

export interface PreviewChangeSetOptions extends SubmitChangeSetOptions {}
export interface PreviewChangeSetResult {
    changeSetId: string
    previewStackId?: string
}
type PreviewError = Error & { previewStackId?: string };
type PreviewErrorWithChangeSet = PreviewError & { changeSetId?: string };

function isNoChangesOutcome(desc: DescribeChangeSetOutput): boolean {

    const reason = desc.StatusReason ?? '';

    return Boolean(desc.Status === 'FAILED'
           && (reason.includes('didn\'t contain changes')
               || reason.includes('No updates are to be performed')));

}

/** Merge paginated {@link DescribeChangeSetCommand} results so large change lists are complete. */
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

export async function deletePreviewChangeSet(changeSetId: string): Promise<void> {

    const cf = getCfClient();

    try {

        await cf.send(new DeleteChangeSetCommand({
            ChangeSetName: changeSetId,
        }));

    } catch {

        // Best-effort cleanup after preview

    }

}

export async function describePreviewChangeSet(changeSetId: string): Promise<DescribeChangeSetOutput> {

    return describeChangeSetPaginated(changeSetId);

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

function toPreviewError(
    original: unknown,
    detail: string,
    previewStackId?: string,
): PreviewError {

    const error = original instanceof Error
        ? original
        : new Error(detail, {cause: original});

    error.message = `${detail}${original instanceof Error ? ` — ${original.message}` : ''}`;

    (error as PreviewError).previewStackId = previewStackId;

    return error as PreviewError;

}

function withChangeSetId(error: unknown, changeSetId: string): PreviewErrorWithChangeSet {

    const normalized = error instanceof Error
        ? error as PreviewErrorWithChangeSet
        : new Error(String(error)) as PreviewErrorWithChangeSet;

    normalized.changeSetId = changeSetId;

    return normalized;

}

async function waitForPreviewDescription(
    changeSetId: string,
): Promise<DescribeChangeSetOutput> {

    try {

        await waitForChangeSetBuild(changeSetId);

    } catch (waitErr) {

        const descEarly = await describeChangeSetPaginated(changeSetId);

        if (isNoChangesOutcome(descEarly)) return descEarly;

        const detail = descEarly.StatusReason ?? 'Change set did not complete successfully';

        throw toPreviewError(waitErr, detail, descEarly.StackId);

    }

    return describeChangeSetPaginated(changeSetId);

}

function finalizePreviewResult(
    stackName: string,
    desc: DescribeChangeSetOutput,
    changeSetId: string,
): PreviewChangeSetResult {

    if (isNoChangesOutcome(desc)) {

        success(`${symbols.check} Stack ${cyan(stackName)} — no changes to apply`);
        return {changeSetId, previewStackId: desc.StackId};

    }

    if (desc.Status !== 'CREATE_COMPLETE') {

        const detail = desc.StatusReason ?? `Change set status: ${desc.Status ?? 'unknown'}`;

        throw toPreviewError(new Error(detail), detail, desc.StackId);

    }

    printPlannedTable(stackName, desc);

    return {changeSetId, previewStackId: desc.StackId};

}

/**
 * Build a change set and print planned resource changes without executing.
 * The change set is deleted only when deleteAfterPreview is true (default).
 */
export async function previewChangeSet<P extends TemplateParams>(
    stackName: string,
    template: Template<P>,
    operation: ChangeSetOperation,
    options: PreviewChangeSetOptions & { deleteAfterPreview?: boolean } = {},
): Promise<PreviewChangeSetResult> {

    dim(`  ${symbols.bullet} Building change set ${gray(`(${operation.toLowerCase()} preview)`)}`);

    const {deleteAfterPreview = true} = options;
    const changeSetId = await submitChangeSetRequest(stackName, template, operation, options);

    try {

        try {

            const desc = await waitForPreviewDescription(changeSetId);

            return finalizePreviewResult(stackName, desc, changeSetId);

        } catch (error) {

            throw withChangeSetId(error, changeSetId);

        }

    } finally {

        if (deleteAfterPreview) {

            await deletePreviewChangeSet(changeSetId);

        }

    }

}
