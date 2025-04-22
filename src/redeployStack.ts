import {readFileSync} from 'fs';
import * as cfn from './lib/cfn';
import {getParamsFromStack} from './lib/cfn/getParamsFromStack';

// The following must be exported
const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AWS_REGION,
    AWS_ACCOUNT_ID,
} = process.env;

/**
 * Redeploys a CloudFormation stack with the given name and template file, using
 * the existing stack's parameters. Useful for updating a stack with a new template
 * without having to specify all the parameters again, or for re-deploying a stack
 * that failed to create for some reason.
 * Only used by the CLI.
 */
export async function redeployStack(stackName: string, templateFile: string): Promise<void> {

    cfn.initCloudFormationClient();

    const template = readFileSync(templateFile, 'utf-8');
    const existingStack = await cfn.getStackByName(stackName);

    if (!existingStack) throw new Error('stack not found, try create command');

    const params = getParamsFromStack(existingStack);

    console.log('stack found, validating template...');

    const validationResult = await cfn.validateTemplate(template);

    if (validationResult instanceof Error) {

        console.error('template validation failed:', validationResult);
        process.exit(1);

    }

    console.log(`updating stack "${stackName}" on account ${AWS_ACCOUNT_ID} with the following params:`, params);
    await cfn.updateStack(existingStack, {body: template, params});

}
