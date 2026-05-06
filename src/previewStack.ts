import {StackStatus} from '@aws-sdk/client-cloudformation';
import * as cfn from './lib/cfn';
import {loadTemplateAndParams} from './cli/loadTemplateAndParams';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {cyan, info, symbols, warn} from './lib/output';

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

    const operation = existing ? 'UPDATE' : 'CREATE';

    info(`${symbols.arrow} Preview ${cyan(operation)} for stack ${cyan(stackName)}`);

    await cfn.previewChangeSet(stackName, {body: template, params}, operation);

}
