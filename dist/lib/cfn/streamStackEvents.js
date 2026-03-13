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
function formatEvent(event) {
    const config = (0, output_1.getOutputConfig)();
    const status = event.ResourceStatus || 'UNKNOWN';
    const resourceType = event.ResourceType || 'Unknown';
    const logicalId = event.LogicalResourceId || 'Unknown';
    const reason = event.ResourceStatusReason || '';
    const isFailure = FAILURE_STATUSES.some((s) => status.includes(s));
    const isSuccess = SUCCESS_STATUSES.some((s) => status.includes(s));
    const isInProgress = IN_PROGRESS_STATUSES.some((s) => status.includes(s));
    let statusStr = status;
    let reasonStr = reason ? ` - ${reason}` : '';
    if (config.color) {
        if (isFailure) {
            statusStr = `\x1b[31m${status}\x1b[0m`; // red
            reasonStr = reason ? ` - \x1b[31m${reason}\x1b[0m` : '';
        }
        else if (isSuccess) {
            statusStr = `\x1b[32m${status}\x1b[0m`; // green
        }
        else if (isInProgress) {
            statusStr = `\x1b[33m${status}\x1b[0m`; // yellow
        }
    }
    const prefix = config.ci ? '' : '  ';
    return `${prefix}[${statusStr}] ${resourceType} (${logicalId})${reasonStr}`;
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