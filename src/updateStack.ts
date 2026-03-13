import {getParamsFromFile} from './lib/getParamsFromFile';
import {readFileSync} from 'node:fs';
import * as cfn from './lib/cfn';
import {templateHasParameters} from './lib/templateHasParameters';

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
    paramsFile: string,
): Promise<void> {

    cfn.initCloudFormationClient();

    const template = readFileSync(templateFile, 'utf-8');
    const needsParams = templateHasParameters(template);
    const params = needsParams
        ? (await getParamsFromFile(paramsFile) as Record<string, unknown>)
        : {};

    const existingStack = await cfn.getStackByName(stackName);

    if (!existingStack) throw new Error('stack not found, try create command');

    console.log('validating template...');

    const validationResult = await cfn.validateTemplate(template);

    if (validationResult instanceof Error) {

        console.error('template validation failed:', validationResult);
        process.exit(1);

    }

    if (Object.keys(params).length > 0) {

        console.log(`updating stack "${stackName}" on account ${AWS_ACCOUNT_ID} with the following params:`, params);

    } else {

        console.log(`updating stack "${stackName}" on account ${AWS_ACCOUNT_ID}`);

    }

    await cfn.updateStack(existingStack, {body: template, params});

}
