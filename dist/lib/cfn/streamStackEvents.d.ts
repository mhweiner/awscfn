import { StackEvent } from '@aws-sdk/client-cloudformation';
export interface EventStreamState {
    lastEventId: string | undefined;
    seenEventIds: Set<string>;
    startTime: Date;
}
export declare function createEventStreamState(): EventStreamState;
export declare function fetchNewEvents(stackName: string, state: EventStreamState): Promise<StackEvent[]>;
export declare function formatEvent(event: StackEvent): string;
export declare function printEvent(event: StackEvent): void;
export declare function getFailureReason(events: StackEvent[]): string | undefined;
//# sourceMappingURL=streamStackEvents.d.ts.map