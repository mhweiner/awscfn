import * as cfn from './lib/cfn';
import {loadTemplateAndParams} from './cli/loadTemplateAndParams';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {logStackAction} from './cli/log';

/**
 * CLI handler: create a new CloudFormation stack.
 */
export async function createStack(
    stackName: string,
    templatePath: string,
    paramsPath: string,
): Promise<void> {

    cfn.initCloudFormationClient();

    const {template, params} = await loadTemplateAndParams(templatePath, paramsPath);
    const existing = await cfn.getStackByName(stackName);

    if (existing) {

        throw new Error('stack already exists, try update command');

    }

    console.log('validating template...');
    await validateTemplateOrExit(template);

    logStackAction(stackName, 'creating', params);
    await cfn.createStack(stackName, {body: template, params});

}
