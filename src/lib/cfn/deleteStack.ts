import {DeleteStackCommand, Stack} from '@aws-sdk/client-cloudformation';
import {waitUntilStackTerminal} from './waitUntilStackTerminal';
import {toResultAsync} from '../toResult';
import {getCfClient} from '.';

export async function deleteStack(stack: Stack): Promise<void> {

    console.log(`deleting stack ${stack.StackName}...`);

    const cf = getCfClient();
    const deleteStackCommand = new DeleteStackCommand({StackName: stack.StackName});

    await cf.send(deleteStackCommand);

    const [err] = await toResultAsync(waitUntilStackTerminal(stack.StackName as string));

    if (err && err.message !== 'stack not found') throw err;

    console.log(`🗑 successfully deleted stack ${stack.StackName} (${stack.StackId})`);

}
