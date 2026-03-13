import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
export type TemplateParams = Record<string, any>;
export type Template<P extends TemplateParams> = {
    body: string;
    params: P;
} | string;
export declare function initCloudFormationClient(): void;
export declare function getCfClient(): CloudFormationClient;
export * from './createStack';
export * from './getStackByName';
export * from './updateStack';
export * from './deleteStack';
export * from './validateTemplate';
export * from './generateStackName';
export * from './isStackTerminal';
export * from './waitUntilStackTerminal';
export * from './getParamFromStack';
export * from './streamStackEvents';
