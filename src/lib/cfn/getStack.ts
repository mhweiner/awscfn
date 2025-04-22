import {DescribeStacksCommand, Stack} from '@aws-sdk/client-cloudformation';
import {toResultAsync} from '../toResult';
import {getCfClient} from '.';

export async function getStackByName(name: string, suppressLog: boolean = false): Promise<Stack|undefined> {

    !suppressLog && console.log(`looking up stack ${name}`);

    const cf = getCfClient();
    const [error, result] = await toResultAsync(cf.send(new DescribeStacksCommand({StackName: name})));

    if (error) {

        if (error.name === 'ValidationError' && error.message.includes('does not exist')) {

            !suppressLog && console.log('stack does not exist');
            return;

        }
        throw error; // Unexpected error occurred

    }

    const stack = result.Stacks ? result.Stacks[0] : undefined;

    if (stack) {

        !suppressLog && console.log(`found stack ${name} as ${stack.StackId}`);
        return stack;

    }

}
