import { Stack, StackStatus } from '@aws-sdk/client-cloudformation';
import { TemplateParams, Template } from './index';
export declare function createStack<P extends TemplateParams>(stackName: string, template: Template<P>): Promise<Stack>;
interface StackCreationErrorData {
    stackId?: string;
    params?: TemplateParams;
    stackName: string;
    sdkError?: Error;
    status?: StackStatus;
    failureReason?: string;
}
export declare class StackCreateFailure extends Error {
    data: StackCreationErrorData;
    constructor(data: StackCreationErrorData);
}
export {};
//# sourceMappingURL=createStack.d.ts.map