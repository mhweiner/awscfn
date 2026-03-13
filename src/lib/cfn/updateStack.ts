import {Stack, StackStatus} from '@aws-sdk/client-cloudformation';
import {Template, TemplateParams} from './index';
import {waitUntilStackTerminalWithEvents} from './waitUntilStackTerminal';
import {createAndExecChangeSet} from './executeChangeSet';
import {deleteStack} from './deleteStack';
import {createStack} from './createStack';
import {isStackTerminal} from './isStackTerminal';
import {toResultAsync} from '../toResult';

// eslint-disable-next-line max-lines-per-function
export async function updateStack<P extends TemplateParams>(
    existingStack: Stack,
    template: Template<P>
): Promise<Stack> {

    console.log(`updating stack ${existingStack.StackName}`);

    if (!isStackTerminal(existingStack)) throw new Error('stack still in progress');

    if (existingStack.StackStatus === StackStatus.ROLLBACK_COMPLETE) {

        console.log(`stack ${existingStack.StackName} is currently in ROLLBACK_COMPLETE and must be deleted first`);

        return deleteAndCreateInstead(existingStack, template);

    }

    const [sdkError] = await toResultAsync(createAndExecChangeSet(existingStack.StackName as string, template, 'UPDATE'));
    const result = await waitUntilStackTerminalWithEvents(existingStack.StackName as string);
    const status = result.stack.StackStatus as StackStatus;

    if (sdkError) {

        throw new StackUpdateFailure({
            stackName: existingStack.StackName as string,
            originalStack: existingStack,
            terminalStack: result.stack,
            status,
            sdkError,
            failureReason: result.failureReason,
        });

    }

    if (status === StackStatus.UPDATE_COMPLETE) {

        console.log(`✅ stack ${existingStack.StackName} updated successfully`);
        return result.stack;

    } else {

        throw new StackUpdateFailure({
            stackName: existingStack.StackName as string,
            originalStack: existingStack,
            terminalStack: result.stack,
            status,
            failureReason: result.failureReason,
        });

    }

}

interface StackUpdateFailureData {
    stackName: string
    originalStack: Stack
    terminalStack: Stack
    params?: TemplateParams
    sdkError?: Error
    status?: StackStatus
    failureReason?: string
}

export class StackUpdateFailure extends Error {

    data: StackUpdateFailureData;

    constructor(data: StackUpdateFailureData) {

        const reason = data.failureReason ? `\n\nReason: ${data.failureReason}` : '';

        super(`💥 Failed to update stack ${data.stackName}${reason}`);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = this.constructor.name;
        this.data = data;

    }

}

async function deleteAndCreateInstead<P extends TemplateParams>(
    stack: Stack,
    template: Template<P>
): Promise<Stack> {

    await deleteStack(stack);

    return createStack(stack.StackName as string, template);

}
