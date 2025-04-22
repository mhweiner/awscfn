import {Stack} from '@aws-sdk/client-cloudformation';

export function getParamFromStack(stack: Stack, paramName: string): string {

    const param = stack.Parameters?.find((param) => param.ParameterKey === paramName);

    if (param) {

        return param.ParameterValue ?? '';

    }

    throw new Error(`Parameter ${paramName} not found in stack ${stack.StackName}`);

}
