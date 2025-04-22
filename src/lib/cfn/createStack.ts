import {
    Stack,
    StackStatus,
} from '@aws-sdk/client-cloudformation';
import {TemplateParams, Template} from './index';
import {waitUntilStackTerminal} from './waitUntilStackTerminal';
import {createAndExecChangeSet} from './executeChangeSet';
import {toResultAsync} from '../toResult';

export async function createStack<P extends TemplateParams>(
    stackName: string,
    template: Template<P>
): Promise<Stack> {

    console.log(`creating stack ${stackName}`);

    const [sdkError, changeSetId] = await toResultAsync(createAndExecChangeSet(stackName, template, 'CREATE'));

    if (sdkError) {

        throw new StackCreateFailure({
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
            sdkError,
        });

    }

    console.log(`created stack ${stackName} with changeset ${changeSetId}`);

    const stack = await waitUntilStackTerminal(stackName);
    const status = stack.StackStatus as StackStatus; // AWS type issue

    if (stack.StackStatus === StackStatus.CREATE_COMPLETE) {

        console.log(`✅ stack ${stack.StackId} is CREATE_COMPLETE`);
        return stack;

    } else {

        throw new StackCreateFailure({
            status,
            stackName,
            params: typeof template === 'string' ? undefined : template.params,
        });

    }

}

interface StackCreationErrorData {
    stackId?: string
    params?: TemplateParams
    stackName: string
    sdkError?: Error
    status?: StackStatus
}

export class StackCreateFailure extends Error {

    data: StackCreationErrorData;
    constructor(data: StackCreationErrorData) {

        super(`💥 Failed to create stack ${data.stackName}`);
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        this.name = this.constructor.name;
        this.data = data;

    }

}
