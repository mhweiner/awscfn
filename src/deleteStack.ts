import * as cfn from './lib/cfn';
import {logStackAction} from './cli/log';

/**
 * CLI handler: delete a CloudFormation stack (with confirmation).
 */
export async function deleteStack(
    stackName: string,
    confirmName: string,
): Promise<void> {

    if (stackName !== confirmName) {

        throw new Error('stack name mismatch');

    }

    cfn.initCloudFormationClient();

    const existing = await cfn.getStackByName(stackName);

    if (!existing) {

        throw new Error('stack not found');

    }

    logStackAction(stackName, 'deleting');
    await cfn.deleteStack(existing);

}
