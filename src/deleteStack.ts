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
export async function deleteStack(
    stackName: string,
    repeatStackName: string
): Promise<void> {

    if (stackName !== repeatStackName) throw new Error('stack name mismatch');

    cfn.initCloudFormationClient();

    const existingStack = await cfn.getStackByName(stackName);

    if (!existingStack) throw new Error('stack not found');

    console.log(`deleting stack "${stackName}" on account ${AWS_ACCOUNT_ID}...`);
    await cfn.deleteStack(existingStack);

}
