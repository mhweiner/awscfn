import {ListStacksCommand, StackStatus, StackSummary} from '@aws-sdk/client-cloudformation';
import {getCfClient} from '.';

/** All stack statuses except deleted (DELETE_COMPLETE, DELETE_IN_PROGRESS). */
const ACTIVE_STATUS_FILTER: StackStatus[] = (Object.values(StackStatus) as StackStatus[]).filter(
    (s) => s !== StackStatus.DELETE_COMPLETE && s !== StackStatus.DELETE_IN_PROGRESS,
);

/**
 * Fetches all CloudFormation stacks (paginated). Excludes deleted stacks (DELETE_COMPLETE, DELETE_IN_PROGRESS).
 */
export async function listStacks(): Promise<StackSummary[]> {

    const cf = getCfClient();
    const out: StackSummary[] = [];
    let nextToken: string | undefined;

    do {

        const result = await cf.send(new ListStacksCommand({
            NextToken: nextToken,
            StackStatusFilter: ACTIVE_STATUS_FILTER,
        }));
        const summaries = result.StackSummaries ?? [];

        out.push(...summaries);
        nextToken = result.NextToken;

    } while (nextToken);

    return out;

}
