import {readFileSync} from 'node:fs';
import * as cfn from './lib/cfn';
import {getParamsFromStack} from './lib/cfn/getParamsFromStack';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {logStackAction} from './cli/log';

/**
 * CLI handler: redeploy stack with existing params (template only).
 */
export async function redeployStack(stackName: string, templatePath: string): Promise<void> {

    cfn.initCloudFormationClient();

    const template = readFileSync(templatePath, 'utf-8');
    const existing = await cfn.getStackByName(stackName);

    if (!existing) {

        throw new Error('stack not found, try create command');

    }

    const params = getParamsFromStack(existing);

    console.log('stack found, validating template...');
    await validateTemplateOrExit(template);

    logStackAction(stackName, 'updating', params);
    await cfn.updateStack(existing, {body: template, params});

}
