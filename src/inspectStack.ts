import {Stack, StackEvent} from '@aws-sdk/client-cloudformation';
import * as cfn from './lib/cfn';
import {viewText} from './lib/viewText';
import {InspectTuiSection, viewInspectTui} from './lib/viewInspectTui';

export interface InspectStackOptions {
    eventsLimit: number
    usePager: boolean
}

interface FailureEventSummary {
    timestamp: string
    resource: string
    status: string
    reason: string
}

const DEFAULT_OPTIONS: InspectStackOptions = {
    eventsLimit: 500,
    usePager: true,
};

const GENERIC_FAILURE_PATTERNS = [
    /resource creation cancelled/i,
    /resource update cancelled/i,
    /the following resource\(s\) failed/i,
    /user initiated/i,
];

function toIso(value?: Date): string {

    if (!value) {

        return '—';

    }

    return value.toISOString();

}

function toTimestamp(event: StackEvent): number {

    return event.Timestamp?.getTime() ?? 0;

}

function toChronological(events: StackEvent[]): StackEvent[] {

    return events.slice().sort((left, right) => toTimestamp(left) - toTimestamp(right));

}

function isFailureStatus(status: string): boolean {

    return status.includes('FAILED') || status.includes('ROLLBACK');

}

function isGenericFailureReason(reason: string): boolean {

    return GENERIC_FAILURE_PATTERNS.some((pattern) => pattern.test(reason));

}

function getFailureEvents(events: StackEvent[]): FailureEventSummary[] {

    const out: FailureEventSummary[] = [];

    for (const event of events) {

        const status = event.ResourceStatus ?? '';
        const reason = event.ResourceStatusReason ?? '';

        if (!isFailureStatus(status) || !reason) continue;

        out.push({
            timestamp: toIso(event.Timestamp),
            resource: `${event.LogicalResourceId ?? 'Unknown'} (${event.ResourceType ?? 'Unknown'})`,
            status,
            reason,
        });

    }

    return out;

}

function uniqueRootCauseCandidates(failures: FailureEventSummary[]): FailureEventSummary[] {

    const seenReasons = new Set<string>();
    const rootCauses: FailureEventSummary[] = [];

    for (const failure of failures) {

        if (isGenericFailureReason(failure.reason) || seenReasons.has(failure.reason)) continue;

        seenReasons.add(failure.reason);
        rootCauses.push(failure);

    }

    return rootCauses;

}

function formatSection(title: string, body: string): string {

    return `${title}\n${'-'.repeat(title.length)}\n${body}`;

}

function formatParameters(stack: Stack): string {

    const params = stack.Parameters ?? [];

    if (params.length === 0) return 'No parameters on stack.';

    return params
        .map((param) => `${param.ParameterKey ?? 'Unknown'}: ${param.ParameterValue ?? '(no value returned)'}`)
        .join('\n');

}

function formatOutputs(stack: Stack): string {

    const outputs = stack.Outputs ?? [];

    if (outputs.length === 0) return 'No outputs on stack.';

    return outputs.map((output) => `${output.OutputKey ?? 'Unknown'}: ${output.OutputValue ?? ''}`).join('\n');

}

function formatRootCauses(failures: FailureEventSummary[]): string {

    const rootCauses = uniqueRootCauseCandidates(failures).slice(0, 10);

    if (rootCauses.length === 0) return 'No specific root-cause errors detected.';

    return rootCauses
        .map((failure) => `[${failure.timestamp}] ${failure.status} ${failure.resource}\n  Reason: ${failure.reason}`)
        .join('\n\n');

}

function formatFailureEvents(failures: FailureEventSummary[]): string {

    if (failures.length === 0) return 'No failure events found.';

    return failures
        .slice(-50)
        .map((failure) => `[${failure.timestamp}] ${failure.status} ${failure.resource}\n  Reason: ${failure.reason}`)
        .join('\n\n');

}

function formatEvent(event: StackEvent): string {

    const timestamp = toIso(event.Timestamp);
    const status = event.ResourceStatus ?? 'UNKNOWN';
    const logical = event.LogicalResourceId ?? 'Unknown';
    const type = event.ResourceType ?? 'Unknown';
    const reason = event.ResourceStatusReason ? `\n  Reason: ${event.ResourceStatusReason}` : '';

    return `[${timestamp}] ${status} ${logical} (${type})${reason}`;

}

function formatEvents(events: StackEvent[], eventsLimit: number): string {

    if (events.length === 0) return 'No stack events found.';

    const chronological = toChronological(events);
    const header = eventsLimit > 0
        ? `Showing up to ${eventsLimit} events in chronological order.`
        : 'Showing all events in chronological order.';

    return `${header}\n\n${chronological.map((event) => formatEvent(event)).join('\n\n')}`;

}

function stackDetailsJson(stack: Stack): string {

    return JSON.stringify(stack, (_key, value) => value instanceof Date ? value.toISOString() : value, 2);

}

function stackSummary(stack: Stack): string {

    const lines = [
        `StackName: ${stack.StackName ?? '—'}`,
        `StackId: ${stack.StackId ?? '—'}`,
        `Status: ${stack.StackStatus ?? '—'}`,
        `StatusReason: ${stack.StackStatusReason ?? '—'}`,
        `CreatedAt: ${toIso(stack.CreationTime)}`,
        `UpdatedAt: ${toIso(stack.LastUpdatedTime)}`,
        `DriftStatus: ${stack.DriftInformation?.StackDriftStatus ?? '—'}`,
        `EnableTerminationProtection: ${stack.EnableTerminationProtection ?? false}`,
    ];

    return lines.join('\n');

}

function buildSections(
    stack: Stack,
    templateBody: string,
    events: StackEvent[],
    options: InspectStackOptions,
): InspectTuiSection[] {

    const failures = getFailureEvents(toChronological(events));
    const sections: InspectTuiSection[] = [
        {title: 'Stack Summary', body: stackSummary(stack)},
        {title: 'Stack Details (Raw JSON)', body: stackDetailsJson(stack)},
        {title: 'Parameters', body: formatParameters(stack)},
        {title: 'Outputs', body: formatOutputs(stack)},
        {title: 'Likely Root Causes', body: formatRootCauses(failures)},
        {title: 'Failure Events', body: formatFailureEvents(failures)},
        {title: 'Events', body: formatEvents(events, options.eventsLimit)},
        {title: 'Full Deployed Template', body: templateBody || 'Template body is empty.'},
    ];

    return sections;

}

function buildReport(sections: InspectTuiSection[]): string {

    return [
        'awscfn inspect-stack',
        '='.repeat(20),
        '',
        ...sections.map((section) => formatSection(section.title, section.body)),
    ].join('\n\n');

}

export async function inspectStack(
    stackName: string,
    options?: Partial<InspectStackOptions>,
): Promise<void> {

    cfn.initCloudFormationClient();

    const resolvedOptions = {...DEFAULT_OPTIONS, ...options};
    const stack = await cfn.getStackByName(stackName, true);

    if (!stack) throw new Error(`stack ${stackName} does not exist`);

    const [templateBody, events] = await Promise.all([
        cfn.getStackTemplateBody(stackName),
        cfn.listStackEvents(stackName, resolvedOptions.eventsLimit),
    ]);

    const sections = buildSections(stack, templateBody, events, resolvedOptions);

    if (resolvedOptions.usePager) {

        const didShowTui = await viewInspectTui(sections, {
            title: `awscfn inspect-stack: ${stackName}`,
            subtitle: [
                'Tab switches focus.',
                'Up/Down navigates.',
                'PgUp/PgDn scrolls.',
                'q quits.',
            ].join(' '),
        });

        if (didShowTui) {

            return;

        }

    }

    const report = buildReport(sections);

    viewText(`inspect-${stackName}`, report, {usePager: resolvedOptions.usePager});

}
