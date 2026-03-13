import {
    Stack,
    StackStatus,
} from '@aws-sdk/client-cloudformation';
import {TemplateParams, Template} from './index';
import {waitUntilStackTerminalWithEvents} from './waitUntilStackTerminal';
import {createAndExecChangeSet} from './executeChangeSet';
import {toResultAsync} from '../toResult';

export async function createStack<P extends TemplateParams>(
    stackName: string,
    template: Template<P>
): Promise<Stack> {

    console.log(`creating stack ${stackName}`);

    const [sdkError] = await toResultAsync(createAndExecChangeSet(stackName, template, 'CREATE'));

    if (sdkError) {

        throw new StackCreateFailure({
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
            sdkError,
        });

    }

    const result = await waitUntilStackTerminalWithEvents(stackName);
    const status = result.stack.StackStatus as StackStatus; // AWS type issue

    if (result.stack.StackStatus === StackStatus.CREATE_COMPLETE) {

        console.log(`✅ stack ${stackName} created successfully`);
        return result.stack;

    } else {

        throw new StackCreateFailure({
            status,
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
            failureReason: result.failureReason,
        });

    }

}

interface StackCreationErrorData {
    stackId?: string
    params?: TemplateParams
    stackName: string
    sdkError?: Error
    status?: StackStatus
    failureReason?: string
}

export class StackCreateFailure extends Error {

    data: StackCreationErrorData;

    constructor(data: StackCreationErrorData) {

        const reason = data.failureReason ? `\n\nReason: ${data.failureReason}` : '';

        super(`💥 Failed to create stack ${data.stackName}${reason}`);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = this.constructor.name;
        this.data = data;

    }

}
