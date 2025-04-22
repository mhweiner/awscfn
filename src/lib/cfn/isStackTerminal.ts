import {Stack, StackStatus} from '@aws-sdk/client-cloudformation';

export function isStackTerminal(stack: Stack): boolean {

    return [
        StackStatus.CREATE_COMPLETE,
        StackStatus.CREATE_FAILED,
        StackStatus.DELETE_COMPLETE,
        StackStatus.DELETE_FAILED,
        StackStatus.ROLLBACK_COMPLETE,
        StackStatus.ROLLBACK_FAILED,
        StackStatus.UPDATE_COMPLETE,
        StackStatus.UPDATE_ROLLBACK_COMPLETE,
        StackStatus.UPDATE_ROLLBACK_FAILED,
    ].indexOf(stack.StackStatus as any) !== -1;

}
