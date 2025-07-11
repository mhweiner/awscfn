import {getParamsFromFile} from './lib/getParamsFromFile';
import {readFileSync} from 'fs';
import * as cfn from './lib/cfn';

// The following must be exported
const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AWS_REGION,
    AWS_ACCOUNT_ID,
} = process.env;

/**
 * Only used by the CLI
 */
export async function updateStack(
    stackName: string,
    templateFile: string,
    paramsFile: string
): Promise<void> {

    cfn.initCloudFormationClient();

    const params = await getParamsFromFile(paramsFile) as any;
    const template = readFileSync(templateFile, 'utf-8');
    const existingStack = await cfn.getStackByName(stackName);

    if (!existingStack) throw new Error('stack not found, try create command');

    console.log('validating template...');

    const validationResult = await cfn.validateTemplate(template);

    if (validationResult instanceof Error) {

        console.error('template validation failed:', validationResult);
        process.exit(1);

    }

    console.log(`updating stack "${stackName}" on account ${AWS_ACCOUNT_ID} with the following params:`, params);
    await cfn.updateStack(existingStack, {body: template, params});

}
