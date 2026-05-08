import {randomUUID} from 'node:crypto';
import {stdin, stdout} from 'node:process';
import {createInterface} from 'node:readline/promises';
import {DescribeChangeSetOutput, StackStatus} from '@aws-sdk/client-cloudformation';
import * as cfn from './lib/cfn';
import {logStackAction} from './cli/log';
import {loadTemplateAndParams} from './cli/loadTemplateAndParams';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {cyan, info, success, symbols, warn} from './lib/output';

const PREVIEW_DELETE_WAIT_TIMEOUT_MS = 2 * 60 * 1000;
const PREVIEW_DELETE_POLL_MS = 3000;

type ExistingStack = Awaited<ReturnType<typeof cfn.getStackByName>>;
type PreviewChangeSetError = Error & { previewStackId?: string; changeSetId?: string };
type PreviewOperation = 'CREATE' | 'UPDATE';
interface PreviewSession {
    operation: PreviewOperation
    keepChangeSet: boolean
    changeSetId?: string
    previewStackId?: string
}
interface RunPreviewInput {
    stackName: string
    template: string
    params: Record<string, unknown>
    existing: ExistingStack
    previewRunId: string
    keepChangeSet: boolean
}

/**
 * CLI: preview stack changes without executing (build change set, print table, delete change set).
 * CREATE vs UPDATE matches whether the stack already exists.
 */
export async function previewStack(
    stackName: string,
    templatePath: string,
    paramsPath?: string,
    overrides?: Record<string, string>,
): Promise<void> {

    cfn.initCloudFormationClient();

    const {template, params} = await loadTemplateAndParams(templatePath, paramsPath, overrides);
    const existing = await cfn.getStackByName(stackName);
    const previewRunId = createPreviewRunId();

    await ensurePreviewable(stackName, template, existing);
    await previewThenMaybeDeploy(stackName, template, params, existing, previewRunId);

}

async function previewThenMaybeDeploy(
    stackName: string,
    template: string,
    params: Record<string, unknown>,
    existing: ExistingStack,
    previewRunId: string,
): Promise<void> {

    const keepChangeSet = canPromptInteractively();
    const previewSession = await runPreviewChangeSet({
        stackName,
        template,
        params,
        existing,
        previewRunId,
        keepChangeSet,
    });

    const shouldDeploy = await promptDeployAfterPreview(stackName);

    if (!shouldDeploy) {

        await cleanupPreviewArtifacts(existing, stackName, previewSession, previewRunId, shouldDeploy);
        return;

    }

    await deployFromPreview(stackName, template, params, previewSession);

}

async function runPreviewChangeSet(input: RunPreviewInput): Promise<PreviewSession> {

    const {
        stackName,
        template,
        params,
        existing,
        previewRunId,
        keepChangeSet,
    } = input;

    const operation: PreviewOperation = existing ? 'UPDATE' : 'CREATE';

    info(`${symbols.arrow} Preview ${cyan(operation)} for stack ${cyan(stackName)}`);

    try {

        const previewResult = await cfn.previewChangeSet(
            stackName,
            {body: template, params},
            operation,
            {clientToken: previewRunId, deleteAfterPreview: !keepChangeSet},
        );

        return {
            operation,
            keepChangeSet,
            changeSetId: previewResult.changeSetId,
            previewStackId: previewResult.previewStackId,
        };

    } catch (error) {

        await handlePreviewChangeSetError(error, existing, stackName, previewRunId, keepChangeSet);
        throw error;

    }

}

async function handlePreviewChangeSetError(
    error: unknown,
    existing: ExistingStack,
    stackName: string,
    previewRunId: string,
    keepChangeSet: boolean,
): Promise<void> {

    const previewStackId = getPreviewStackIdFromError(error)
        ?? await resolvePreviewStackId(existing, stackName);
    const changeSetId = getChangeSetIdFromError(error);

    if (keepChangeSet && changeSetId) await cleanupChangeSetBestEffort(changeSetId);

    await cleanupCreatePreviewStackBestEffort(
        existing,
        stackName,
        false,
        previewStackId,
        previewRunId,
    );

}

async function deployFromPreview(
    stackName: string,
    template: string,
    params: Record<string, unknown>,
    previewSession: PreviewSession,
): Promise<void> {

    info(`${symbols.arrow} Deploying stack ${cyan(stackName)} from preview...`);

    if (!previewSession.changeSetId) {

        await deployPreview(stackName, template, params);
        return;

    }

    await executeReviewedPreviewChangeSet(stackName, previewSession);

}

async function cleanupPreviewArtifacts(
    existing: ExistingStack,
    stackName: string,
    previewSession: PreviewSession,
    previewRunId: string,
    waitForCompletion: boolean,
): Promise<void> {

    if (previewSession.keepChangeSet && previewSession.changeSetId) {

        await cleanupChangeSetBestEffort(previewSession.changeSetId);

    }

    await cleanupCreatePreviewStackBestEffort(
        existing,
        stackName,
        waitForCompletion,
        previewSession.previewStackId,
        previewRunId,
    );

}

async function cleanupChangeSetBestEffort(changeSetId: string): Promise<void> {

    try {

        await cfn.deletePreviewChangeSet(changeSetId);

    } catch {

        // best effort cleanup when user declines deploy

    }

}

async function executeReviewedPreviewChangeSet(
    stackName: string,
    previewSession: PreviewSession,
): Promise<void> {

    const desc = await cfn.describePreviewChangeSet(previewSession.changeSetId as string);

    if (isNoChangesChangeSet(desc)) {

        await handleNoChangesPreviewExecution(stackName, previewSession);
        return;

    }

    ensurePreviewChangeSetIsExecutable(stackName, previewSession, desc);

    await cfn.executeExistingChangeSet(previewSession.changeSetId as string);

    const terminal = await cfn.waitUntilStackTerminalWithEvents(stackName);

    if (!isExpectedDeployTerminalStatus(previewSession.operation, terminal.stack.StackStatus as StackStatus)) {

        const reason = terminal.failureReason ? ` Reason: ${terminal.failureReason}` : '';

        throw new Error(
            `Preview deploy did not complete successfully for stack "${stackName}". `
            + `Final status: ${terminal.stack.StackStatus}.${reason}`,
        );

    }

    const verb = previewSession.operation === 'CREATE' ? 'created' : 'updated';

    success(`${symbols.check} Stack ${cyan(stackName)} ${verb} successfully from reviewed preview`);

}

async function handleNoChangesPreviewExecution(
    stackName: string,
    previewSession: PreviewSession,
): Promise<void> {

    success(`${symbols.check} Stack ${cyan(stackName)} is up to date (no changes)`);
    await cleanupChangeSetBestEffort(previewSession.changeSetId as string);

    if (previewSession.operation !== 'CREATE') return;

    await cleanupCreatePreviewStackBestEffort(
        undefined,
        stackName,
        false,
        previewSession.previewStackId,
    );

}

function ensurePreviewChangeSetIsExecutable(
    stackName: string,
    previewSession: PreviewSession,
    desc: DescribeChangeSetOutput,
): void {

    if (previewSession.previewStackId && desc.StackId !== previewSession.previewStackId) {

        throw new Error(
            `Preview change set ownership mismatch for stack "${stackName}". `
            + 'Refusing to execute a different stack identity.',
        );

    }

    if (desc.Status !== 'CREATE_COMPLETE' || desc.ExecutionStatus !== 'AVAILABLE') {

        throw new Error(
            `Preview change set is not executable for stack "${stackName}". `
            + `Status: ${desc.Status ?? 'unknown'}, execution: ${desc.ExecutionStatus ?? 'unknown'}.`,
        );

    }

}

function isNoChangesChangeSet(desc: DescribeChangeSetOutput): boolean {

    const reason = desc.StatusReason ?? '';

    return Boolean(desc.Status === 'FAILED'
        && (reason.includes('didn\'t contain changes')
            || reason.includes('No updates are to be performed')));

}

function isExpectedDeployTerminalStatus(
    operation: PreviewOperation,
    status: StackStatus,
): boolean {

    if (operation === 'CREATE') return status === StackStatus.CREATE_COMPLETE;

    return status === StackStatus.UPDATE_COMPLETE;

}

async function ensurePreviewable(
    stackName: string,
    template: string,
    existing: ExistingStack,
): Promise<void> {

    if (existing?.StackStatus === StackStatus.ROLLBACK_COMPLETE) {

        warn(
            `Stack ${stackName} is in ROLLBACK_COMPLETE; update-stack would delete and recreate it. `
            + 'Preview cannot model that flow.',
        );

        throw new Error(
            'cannot preview: stack is ROLLBACK_COMPLETE — delete the stack or run update-stack (delete + create) first.',
        );

    }

    console.log('validating template...');
    await validateTemplateOrExit(template);

}

async function cleanupCreatePreviewStackBestEffort(
    existing: ExistingStack,
    stackName: string,
    waitForCompletion: boolean,
    expectedStackId?: string,
    previewRunId?: string,
): Promise<void> {

    try {

        await cleanupCreatePreviewStack(
            existing,
            stackName,
            waitForCompletion,
            expectedStackId,
            previewRunId,
        );

    } catch (error) {

        const message = error instanceof Error ? error.message : String(error);

        warn(`Could not fully clean preview stack "${stackName}": ${message}`);

    }

}

async function cleanupCreatePreviewStack(
    existing: ExistingStack,
    stackName: string,
    waitForCompletion: boolean,
    expectedStackId?: string,
    previewRunId?: string,
): Promise<void> {

    if (shouldSkipPreviewCleanup(existing, stackName, expectedStackId, previewRunId)) return;

    const verifiedStackId = expectedStackId as string;
    const createdForPreview = await getOwnedPreviewStackForCleanup(stackName, verifiedStackId);

    if (!createdForPreview) return;

    const status = createdForPreview.StackStatus as StackStatus|undefined;
    const needsDelete = status === StackStatus.REVIEW_IN_PROGRESS;
    const alreadyDeleting = status === StackStatus.DELETE_IN_PROGRESS;

    if (!needsDelete && !alreadyDeleting) {

        return;

    }

    if (needsDelete) {

        warn(
            `Preview created stack ${stackName} in REVIEW_IN_PROGRESS. `
            + 'Cleaning it up automatically...',
        );
        await cfn.deleteStack(createdForPreview, {waitForCompletion: false});

    }

    if (waitForCompletion) {

        await waitForPreviewDeletion(stackName, verifiedStackId);

    }

}

function shouldSkipPreviewCleanup(
    existing: ExistingStack,
    stackName: string,
    expectedStackId?: string,
    previewRunId?: string,
): boolean {

    if (existing) return true;

    if (expectedStackId) return false;

    warn(
        `Skipping automatic preview cleanup for stack "${stackName}" `
        + `${previewRunId ? `(run ${previewRunId.slice(0, 8)}) ` : ''}`
        + 'because ownership could not be verified.',
    );

    return true;

}

async function getOwnedPreviewStackForCleanup(
    stackName: string,
    expectedStackId: string,
): Promise<NonNullable<ExistingStack>|undefined> {

    const createdForPreview = await cfn.getStackByName(stackName, true);

    if (!createdForPreview) return undefined;

    if (isOwnedPreviewStack(createdForPreview, expectedStackId)) return createdForPreview;

    warn(
        `Skipping automatic preview cleanup for stack "${stackName}" `
        + 'because stack identity changed.',
    );

    return undefined;

}

async function waitForPreviewDeletion(
    stackName: string,
    expectedStackId: string,
): Promise<void> {

    const startedAt = Date.now();

    while (Date.now() - startedAt < PREVIEW_DELETE_WAIT_TIMEOUT_MS) {

        const current = await cfn.getStackByName(stackName, true);

        if (!current) return;

        if (!isOwnedPreviewStack(current, expectedStackId)) {

            warn(
                `Stopping preview cleanup wait for stack "${stackName}" `
                + 'because stack identity changed.',
            );
            return;

        }

        await new Promise((resolve) => setTimeout(resolve, PREVIEW_DELETE_POLL_MS));

    }

    throw new Error(
        `Timed out waiting for preview cleanup to delete stack "${stackName}". `
        + 'Try again in a minute.',
    );

}

function createPreviewRunId(): string {

    return randomUUID();

}

function getPreviewStackIdFromError(error: unknown): string|undefined {

    return (error as PreviewChangeSetError)?.previewStackId;

}

function getChangeSetIdFromError(error: unknown): string|undefined {

    return (error as PreviewChangeSetError)?.changeSetId;

}

async function resolvePreviewStackId(
    existing: ExistingStack,
    stackName: string,
): Promise<string|undefined> {

    if (existing) return undefined;

    const createdForPreview = await cfn.getStackByName(stackName, true);

    return createdForPreview?.StackId;

}

function isOwnedPreviewStack(
    stack: NonNullable<ExistingStack>,
    expectedStackId: string,
): boolean {

    return stack.StackId === expectedStackId;

}

function canPromptInteractively(): boolean {

    return stdin.isTTY === true
        && stdout.isTTY === true
        && process.env.CI !== 'true'
        && process.env.GITHUB_ACTIONS !== 'true';

}

async function promptDeployAfterPreview(stackName: string): Promise<boolean> {

    if (!canPromptInteractively()) return false;

    const rl = createInterface({input: stdin, output: stdout});

    try {

        const answer = (await rl.question(
            `Deploy stack "${stackName}" now using update/create flow? [y/N] `,
        )).trim().toLowerCase();

        return answer === 'y' || answer === 'yes';

    } finally {

        rl.close();

    }

}

async function deployPreview(
    stackName: string,
    template: string,
    params: Record<string, unknown>,
): Promise<void> {

    const latest = await cfn.getStackByName(stackName, true);

    if (!latest) {

        logStackAction(stackName, 'creating', params);
        await cfn.createStack(stackName, {body: template, params});

        return;

    }

    logStackAction(stackName, 'updating', params);
    await cfn.updateStack(latest, {body: template, params});

}
