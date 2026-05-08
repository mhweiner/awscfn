import {stdin, stdout} from 'node:process';
import {createInterface} from 'node:readline/promises';
import {StackStatus} from '@aws-sdk/client-cloudformation';
import * as cfn from './lib/cfn';
import {logStackAction} from './cli/log';
import {loadTemplateAndParams} from './cli/loadTemplateAndParams';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {cyan, info, symbols, warn} from './lib/output';

const PREVIEW_DELETE_WAIT_TIMEOUT_MS = 2 * 60 * 1000;
const PREVIEW_DELETE_POLL_MS = 3000;

type ExistingStack = Awaited<ReturnType<typeof cfn.getStackByName>>;

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

    await ensurePreviewable(stackName, template, existing);
    await previewThenMaybeDeploy(stackName, template, params, existing);

}

async function previewThenMaybeDeploy(
    stackName: string,
    template: string,
    params: Record<string, unknown>,
    existing: ExistingStack,
): Promise<void> {

    await runPreviewChangeSet(stackName, template, params, existing);

    const shouldDeploy = await promptDeployAfterPreview(stackName);

    await cleanupCreatePreviewStackBestEffort(existing, stackName, shouldDeploy);

    if (!shouldDeploy) return;

    info(`${symbols.arrow} Deploying stack ${cyan(stackName)} from preview...`);
    await deployPreview(stackName, template, params);

}

async function runPreviewChangeSet(
    stackName: string,
    template: string,
    params: Record<string, unknown>,
    existing: ExistingStack,
): Promise<void> {

    const operation = existing ? 'UPDATE' : 'CREATE';

    info(`${symbols.arrow} Preview ${cyan(operation)} for stack ${cyan(stackName)}`);

    try {

        await cfn.previewChangeSet(stackName, {body: template, params}, operation);

    } catch (error) {

        await cleanupCreatePreviewStackBestEffort(existing, stackName, false);
        throw error;

    }

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
): Promise<void> {

    try {

        await cleanupCreatePreviewStack(existing, stackName, waitForCompletion);

    } catch (error) {

        const message = error instanceof Error ? error.message : String(error);

        warn(`Could not fully clean preview stack "${stackName}": ${message}`);

    }

}

async function cleanupCreatePreviewStack(
    existing: ExistingStack,
    stackName: string,
    waitForCompletion: boolean,
): Promise<void> {

    if (existing) return;

    const createdForPreview = await cfn.getStackByName(stackName, true);

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

        await waitForPreviewDeletion(stackName);

    }

}

async function waitForPreviewDeletion(stackName: string): Promise<void> {

    const startedAt = Date.now();

    while (Date.now() - startedAt < PREVIEW_DELETE_WAIT_TIMEOUT_MS) {

        const current = await cfn.getStackByName(stackName, true);

        if (!current) return;

        await new Promise((resolve) => setTimeout(resolve, PREVIEW_DELETE_POLL_MS));

    }

    throw new Error(
        `Timed out waiting for preview cleanup to delete stack "${stackName}". `
        + 'Try again in a minute.',
    );

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
