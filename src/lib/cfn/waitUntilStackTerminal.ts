import {Stack} from '@aws-sdk/client-cloudformation';
import {getStackByName} from './getStack';
import {isStackTerminal} from './isStackTerminal';

export async function waitUntilStackTerminal(name: string): Promise<Stack> {

    // eslint-disable-next-line no-constant-condition
    while (true) {

        const stack = await getStackByName(name, true);

        if (!stack) throw new Error('stack not found');

        if (!isStackTerminal(stack)) {

            // keep waiting
            console.log(`stack is still in progress with status: ${stack.StackStatus}`);
            await new Promise((resolve) => setTimeout(resolve, 10000));

        } else {

            // we're done
            console.log(`stack is terminal with status: ${stack.StackStatus}`);
            return stack;

        }

    }

}
