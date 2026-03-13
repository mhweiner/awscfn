import {ListStacksCommand, StackSummary} from '@aws-sdk/client-cloudformation';
import {getCfClient} from '.';

/**
 * Fetches all CloudFormation stacks (paginated). Excludes DELETE_COMPLETE by default (AWS behavior).
 */
export async function listStacks(): Promise<StackSummary[]> {

    const cf = getCfClient();
    const out: StackSummary[] = [];
    let nextToken: string | undefined;

    do {

        const result = await cf.send(new ListStacksCommand({NextToken: nextToken}));
        const summaries = result.StackSummaries ?? [];

        out.push(...summaries);
        nextToken = result.NextToken;

    } while (nextToken);

    return out;

}
