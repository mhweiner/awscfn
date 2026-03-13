import {Stack} from '@aws-sdk/client-cloudformation';
import {getStackByName} from './getStackByName';
import {isStackTerminal} from './isStackTerminal';
import {
    createEventStreamState,
    fetchNewEvents,
    printEvent,
    getFailureReason,
    EventStreamState,
} from './streamStackEvents';
import {getOutputConfig, dim} from '../output';

export interface WaitResult {
    stack: Stack
    failureReason?: string
    allEvents: EventStreamState
}

export async function waitUntilStackTerminal(name: string): Promise<Stack> {

    const result = await waitUntilStackTerminalWithEvents(name);

    return result.stack;

}

// eslint-disable-next-line max-lines-per-function
export async function waitUntilStackTerminalWithEvents(name: string): Promise<WaitResult> {

    const config = getOutputConfig();
    const eventState = createEventStreamState();
    const allEventsList: import('@aws-sdk/client-cloudformation').StackEvent[] = [];
    const startTime = Date.now();
    let pollCount = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {

        const stack = await getStackByName(name, true);

        if (!stack) throw new Error('stack not found');

        // Fetch and display new events
        try {

            const newEvents = await fetchNewEvents(name, eventState);

            for (const event of newEvents) {

                allEventsList.push(event);
                printEvent(event);

            }

        } catch {

            // Ignore event fetch errors - stack status is the source of truth

        }

        if (!isStackTerminal(stack)) {

            pollCount++;

            // Only show waiting message every 6 polls (60 seconds) in CI, or if no events shown
            if (!config.ci || (pollCount % 6 === 0 && allEventsList.length === 0)) {

                const elapsed = Math.round((Date.now() - startTime) / 1000);

                dim(`waiting for stack... (${elapsed}s)`);

            }

            await new Promise((resolve) => setTimeout(resolve, 10000));

        } else {

            const elapsed = Math.round((Date.now() - startTime) / 1000);

            console.log(`stack reached ${stack.StackStatus} in ${elapsed}s`);

            const failureReason = getFailureReason(allEventsList);

            return {
                stack,
                failureReason,
                allEvents: eventState,
            };

        }

    }

}
