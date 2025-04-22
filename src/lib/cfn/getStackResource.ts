import {DescribeStackResourcesCommand, StackResource} from '@aws-sdk/client-cloudformation';
import {getCfClient} from '.';

export async function getStackResourcesByLogicalResourceId(
    stackName: string,
    logicalResourceId: string
): Promise<StackResource[]> {

    const cf = getCfClient();
    const response = await cf.send(new DescribeStackResourcesCommand({
        StackName: stackName,
        LogicalResourceId: logicalResourceId,
    }));

    if (!response.StackResources) throw new Error(`resource not found: stack: ${stackName}, logicalResourceId: ${logicalResourceId}`);

    return response.StackResources;

}
