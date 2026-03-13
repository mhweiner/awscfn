"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventStreamState = createEventStreamState;
exports.fetchNewEvents = fetchNewEvents;
exports.formatEvent = formatEvent;
exports.printEvent = printEvent;
exports.getFailureReason = getFailureReason;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const index_1 = require("./index");
const output_1 = require("../output");
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
function createEventStreamState() {
    return {
        lastEventId: undefined,
        seenEventIds: new Set(),
        startTime: new Date(),
    };
}
async function fetchNewEvents(stackName, state) {
    const cf = (0, index_1.getCfClient)();
    const response = await cf.send(new client_cloudformation_1.DescribeStackEventsCommand({
        StackName: stackName,
    }));
    if (!response.StackEvents)
        return [];
    const newEvents = [];
    for (const event of response.StackEvents) {
        if (!event.EventId)
            continue;
        // Skip events we've already seen
        if (state.seenEventIds.has(event.EventId))
            continue;
        // Skip events from before we started watching
        if (event.Timestamp && event.Timestamp < state.startTime)
            continue;
        state.seenEventIds.add(event.EventId);
        newEvents.push(event);
    }
    // Return in chronological order (oldest first)
    return newEvents.reverse();
}
function formatResourceType(resourceType) {
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
function getStatusSymbol(status) {
    const isFailure = FAILURE_STATUSES.some((s) => status.includes(s));
    const isSuccess = SUCCESS_STATUSES.some((s) => status.includes(s));
    if (isFailure)
        return output_1.symbols.cross;
    if (isSuccess)
        return output_1.symbols.check;
    return output_1.symbols.bullet;
}
// eslint-disable-next-line max-lines-per-function
function formatEvent(event) {
    const config = (0, output_1.getOutputConfig)();
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
    let formattedReason = reason ? ` ${output_1.symbols.arrow} ${reason}` : '';
    if (config.color) {
        if (isFailure) {
            formattedSymbol = (0, output_1.red)(symbol);
            formattedStatus = (0, output_1.red)(formattedStatus);
            formattedReason = reason ? ` ${output_1.symbols.arrow} ${(0, output_1.red)(reason)}` : '';
        }
        else if (isSuccess) {
            formattedSymbol = (0, output_1.green)(symbol);
            formattedStatus = (0, output_1.green)(formattedStatus);
        }
        else if (isInProgress) {
            formattedSymbol = (0, output_1.yellow)(symbol);
            formattedStatus = (0, output_1.yellow)(formattedStatus);
        }
        formattedType = (0, output_1.magenta)(shortType);
        formattedId = (0, output_1.cyan)(logicalId);
    }
    const prefix = config.ci ? '  ' : '    ';
    return `${prefix}${formattedSymbol} ${formattedType} ${(0, output_1.gray)('/')} ${formattedId} ${(0, output_1.gray)('—')} ${formattedStatus}${formattedReason}`;
}
function printEvent(event) {
    console.log(formatEvent(event));
}
function getFailureReason(events) {
    for (const event of events) {
        const status = event.ResourceStatus || '';
        if (FAILURE_STATUSES.some((s) => status.includes(s)) && event.ResourceStatusReason) {
            return event.ResourceStatusReason;
        }
    }
    return undefined;
}
//# sourceMappingURL=streamStackEvents.js.map