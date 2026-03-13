import {
    DescribeStackEventsCommand,
    StackEvent,
} from '@aws-sdk/client-cloudformation';
import {getCfClient} from './index';
import {getOutputConfig, green, red, yellow, cyan, gray, magenta, symbols} from '../output';

const FAILURE_STATUSES = [
    'CREATE_FAILED',
    'UPDATE_FAILED',
    'DELETE_FAILED',
    'ROLLBACK_IN_PROGRESS',
    'ROLLBACK_COMPLETE',
    'ROLLBACK_FAILED',
    'UPDATE_ROLLBACK_IN_PROGRESS',
    'UPDATE_ROLLBACK_COMPLETE',
    'UPDATE_ROLLBACK_FAILED',
];

const SUCCESS_STATUSES = [
    'CREATE_COMPLETE',
    'UPDATE_COMPLETE',
    'DELETE_COMPLETE',
];

const IN_PROGRESS_STATUSES = [
    'CREATE_IN_PROGRESS',
    'UPDATE_IN_PROGRESS',
    'DELETE_IN_PROGRESS',
];

export interface EventStreamState {
    lastEventId: string | undefined
    seenEventIds: Set<string>
    startTime: Date
}

export function createEventStreamState(): EventStreamState {

    return {
        lastEventId: undefined,
        seenEventIds: new Set(),
        startTime: new Date(),
    };

}

export async function fetchNewEvents(
    stackName: string,
    state: EventStreamState,
): Promise<StackEvent[]> {

    const cf = getCfClient();
    const response = await cf.send(new DescribeStackEventsCommand({
        StackName: stackName,
    }));

    if (!response.StackEvents) return [];

    const newEvents: StackEvent[] = [];

    for (const event of response.StackEvents) {

        if (!event.EventId) continue;

        // Skip events we've already seen
        if (state.seenEventIds.has(event.EventId)) continue;

        // Skip events from before we started watching
        if (event.Timestamp && event.Timestamp < state.startTime) continue;

        state.seenEventIds.add(event.EventId);
        newEvents.push(event);

    }

    // Return in chronological order (oldest first)
    return newEvents.reverse();

}

function formatResourceType(resourceType: string): string {

    // Shorten common AWS resource types for cleaner output
    const shortened = resourceType
        .replace('AWS::ECS::', '')
        .replace('AWS::ElasticLoadBalancingV2::', 'ALB/')
        .replace('AWS::CloudWatch::', 'CW/')
        .replace('AWS::IAM::', 'IAM/')
        .replace('AWS::EC2::', 'EC2/')
        .replace('AWS::Route53::', 'R53/')
        .replace('AWS::CloudFormation::', 'CFN/')
        .replace('AWS::Logs::', 'Logs/')
        .replace('AWS::SNS::', 'SNS/')
        .replace('AWS::SQS::', 'SQS/')
        .replace('AWS::Lambda::', 'Lambda/')
        .replace('AWS::S3::', 'S3/')
        .replace('AWS::', '');

    return shortened;

}

function getStatusSymbol(status: string): string {

    const isFailure = FAILURE_STATUSES.some((s) => status.includes(s));
    const isSuccess = SUCCESS_STATUSES.some((s) => status.includes(s));

    if (isFailure) return symbols.cross;
    if (isSuccess) return symbols.check;

    return symbols.bullet;

}

// eslint-disable-next-line max-lines-per-function
export function formatEvent(event: StackEvent): string {

    const config = getOutputConfig();
    const status = event.ResourceStatus || 'UNKNOWN';
    const resourceType = event.ResourceType || 'Unknown';
    const logicalId = event.LogicalResourceId || 'Unknown';
    const reason = event.ResourceStatusReason || '';

    const isFailure = FAILURE_STATUSES.some((s) => status.includes(s));
    const isSuccess = SUCCESS_STATUSES.some((s) => status.includes(s));
    const isInProgress = IN_PROGRESS_STATUSES.some((s) => status.includes(s));

    const symbol = getStatusSymbol(status);
    const shortType = formatResourceType(resourceType);

    let formattedSymbol = symbol;
    let formattedStatus = status.replace(/_/g, ' ').toLowerCase();
    let formattedType = shortType;
    let formattedId = logicalId;
    let formattedReason = reason ? ` ${symbols.arrow} ${reason}` : '';

    if (config.color) {

        if (isFailure) {

            formattedSymbol = red(symbol);
            formattedStatus = red(formattedStatus);
            formattedReason = reason ? ` ${symbols.arrow} ${red(reason)}` : '';

        } else if (isSuccess) {

            formattedSymbol = green(symbol);
            formattedStatus = green(formattedStatus);

        } else if (isInProgress) {

            formattedSymbol = yellow(symbol);
            formattedStatus = yellow(formattedStatus);

        }

        formattedType = magenta(shortType);
        formattedId = cyan(logicalId);

    }

    const prefix = config.ci ? '  ' : '    ';

    return `${prefix}${formattedSymbol} ${formattedType} ${gray('/')} ${formattedId} ${gray('—')} ${formattedStatus}${formattedReason}`;

}

export function printEvent(event: StackEvent): void {

    console.log(formatEvent(event));

}

export function getFailureReason(events: StackEvent[]): string | undefined {

    for (const event of events) {

        const status = event.ResourceStatus || '';

        if (FAILURE_STATUSES.some((s) => status.includes(s)) && event.ResourceStatusReason) {

            return event.ResourceStatusReason;

        }

    }

    return undefined;

}
