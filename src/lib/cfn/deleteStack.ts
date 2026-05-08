import {DeleteStackCommand, Stack} from '@aws-sdk/client-cloudformation';
import {waitUntilStackTerminalWithEvents} from './waitUntilStackTerminal';
import {toResultAsync} from '../toResult';
import {getCfClient} from '.';

export interface DeleteStackOptions {
    waitForCompletion?: boolean
    timeoutMs?: number
}

export async function deleteStack(
    stack: Stack,
    options: DeleteStackOptions = {},
): Promise<void> {

    const {waitForCompletion = true, timeoutMs} = options;

    console.log(`deleting stack ${stack.StackName}...`);

    const cf = getCfClient();
    const deleteStackCommand = new DeleteStackCommand({StackName: stack.StackName});

    await cf.send(deleteStackCommand);

    if (!waitForCompletion) {

        console.log(`🗑 delete requested for stack ${stack.StackName} (${stack.StackId})`);
        return;

    }

    const [err] = await toResultAsync(waitUntilStackTerminalWithEvents(
        stack.StackName as string,
        timeoutMs ? {timeoutMs} : {},
    ));

    if (err && err.message !== 'stack not found') throw err;

    console.log(`🗑 successfully deleted stack ${stack.StackName} (${stack.StackId})`);

}
