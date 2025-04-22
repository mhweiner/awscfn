import {Stack} from '@aws-sdk/client-cloudformation';
import {TemplateParams} from '.';

export function getParamsFromStack(stack: Stack): TemplateParams {

    const params: TemplateParams = {};

    stack.Parameters?.forEach((param) => {

        params[param.ParameterKey as string] = param.ParameterValue as string;

    });

    return params;

}
