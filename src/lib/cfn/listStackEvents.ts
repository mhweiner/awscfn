import {DescribeStackEventsCommand, StackEvent} from '@aws-sdk/client-cloudformation';
import {getCfClient} from '.';

function trimToLimit(events: StackEvent[], limit: number): StackEvent[] {

    if (limit <= 0) {

        return events;

    }

    return events.slice(0, limit);

}

export async function listStackEvents(stackName: string, limit: number = 500): Promise<StackEvent[]> {

    const cf = getCfClient();
    const events: StackEvent[] = [];
    let nextToken: string|undefined;

    do {

        const response = await cf.send(new DescribeStackEventsCommand({
            StackName: stackName,
            NextToken: nextToken,
        }));

        events.push(...(response.StackEvents ?? []));
        nextToken = response.NextToken;

    } while (nextToken && (limit <= 0 || events.length < limit));

    return trimToLimit(events, limit);

}
