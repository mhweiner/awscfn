import { Stack, StackStatus } from '@aws-sdk/client-cloudformation';
import { Template, TemplateParams } from './index';
export declare function updateStack<P extends TemplateParams>(existingStack: Stack, template: Template<P>): Promise<Stack>;
interface StackUpdateFailureData {
    stackName: string;
    originalStack: Stack;
    terminalStack: Stack;
    params?: TemplateParams;
    sdkError?: Error;
    status?: StackStatus;
    failureReason?: string;
}
export declare class StackUpdateFailure extends Error {
    data: StackUpdateFailureData;
    constructor(data: StackUpdateFailureData);
}
export {};
//# sourceMappingURL=updateStack.d.ts.map