import { Stack } from '@aws-sdk/client-cloudformation';
import { TemplateParams } from '.';
export declare function getParamsFromStack(stack: Stack): TemplateParams;
