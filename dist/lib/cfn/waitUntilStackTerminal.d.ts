import { Stack } from '@aws-sdk/client-cloudformation';
import { EventStreamState } from './streamStackEvents';
export interface WaitResult {
    stack: Stack;
    failureReason?: string;
    allEvents: EventStreamState;
}
export declare function waitUntilStackTerminal(name: string): Promise<Stack>;
export declare function waitUntilStackTerminalWithEvents(name: string): Promise<WaitResult>;
