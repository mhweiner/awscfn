/**
 * Redeploys a CloudFormation stack with the given name and template file, using
 * the existing stack's parameters. Useful for updating a stack with a new template
 * without having to specify all the parameters again, or for re-deploying a stack
 * that failed to create for some reason.
 * Only used by the CLI.
 */
export declare function redeployStack(stackName: string, templateFile: string): Promise<void>;
