import * as cfn from './lib/cfn';
import {loadTemplateAndParams} from './cli/loadTemplateAndParams';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {logStackAction} from './cli/log';

/**
 * CLI handler: update an existing CloudFormation stack.
 */
export async function updateStack(
    stackName: string,
    templatePath: string,
    paramsPath: string,
): Promise<void> {

    cfn.initCloudFormationClient();

    const {template, params} = await loadTemplateAndParams(templatePath, paramsPath);
    const existing = await cfn.getStackByName(stackName);

    if (!existing) {

        throw new Error('stack not found, try create command');

    }

    console.log('validating template...');
    await validateTemplateOrExit(template);

    logStackAction(stackName, 'updating', params);
    await cfn.updateStack(existing, {body: template, params});

}
