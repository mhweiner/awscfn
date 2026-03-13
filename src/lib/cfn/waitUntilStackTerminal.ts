import {Stack, StackStatus} from '@aws-sdk/client-cloudformation';
import {getStackByName} from './getStackByName';
import {isStackTerminal} from './isStackTerminal';
import {
    createEventStreamState,
    fetchNewEvents,
    printEvent,
    getFailureReason,
    EventStreamState,
} from './streamStackEvents';
import {getOutputConfig, dim, success, error, gray, startSpinner, symbols} from '../output';

export interface WaitResult {
    stack: Stack
    failureReason?: string
    allEvents: EventStreamState
}

/** Default max wait for stack terminal state (e.g. ECS placement fails, CFN rolls back slowly). */
const DEFAULT_WAIT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function waitUntilStackTerminal(name: string): Promise<Stack> {

    const result = await waitUntilStackTerminalWithEvents(name);

    return result.stack;

}

const FAILURE_STATUSES: StackStatus[] = [
    StackStatus.CREATE_FAILED,
    StackStatus.DELETE_FAILED,
    StackStatus.UPDATE_FAILED,
    StackStatus.ROLLBACK_COMPLETE,
    StackStatus.ROLLBACK_FAILED,
    StackStatus.UPDATE_ROLLBACK_COMPLETE,
    StackStatus.UPDATE_ROLLBACK_FAILED,
];

export interface WaitUntilStackTerminalOptions {
    /** Max wait (ms). Default 30m. Throws when exceeded (e.g. ECS placement failure). */
    timeoutMs?: number
}

// eslint-disable-next-line max-lines-per-function
export async function waitUntilStackTerminalWithEvents(
    name: string,
    options: WaitUntilStackTerminalOptions = {},
): Promise<WaitResult> {

    const {timeoutMs = DEFAULT_WAIT_TIMEOUT_MS} = options;
    const config = getOutputConfig();
    const eventState = createEventStreamState();
    const allEventsList: import('@aws-sdk/client-cloudformation').StackEvent[] = [];
    const startTime = Date.now();
    let pollCount = 0;
    let stopSpinner: (() => void) | null = null;

    while (true) {

        const stack = await getStackByName(name, true);

        if (!stack) throw new Error('stack not found');

        // Fetch and display new events
        try {

            const newEvents = await fetchNewEvents(name, eventState);

            if (newEvents.length > 0 && stopSpinner) {

                stopSpinner();
                stopSpinner = null;

            }

            for (const event of newEvents) {

                allEventsList.push(event);
                printEvent(event);

            }

        } catch {

            // Ignore event fetch errors - stack status is the source of truth

        }

        if (!isStackTerminal(stack)) {

            const elapsed = Date.now() - startTime;

            if (elapsed >= timeoutMs) {

                if (stopSpinner) stopSpinner();

                const minutes = Math.round(timeoutMs / 60000);

                throw new Error(
                    `Stack ${name} did not reach a terminal state within ${minutes} minutes. `
                    + 'This can happen when ECS cannot place tasks (e.g. insufficient memory). Check ECS service events above.',
                );

            }

            pollCount++;

            if (config.ci) {

                if (pollCount % 6 === 0 && allEventsList.length === 0) {

                    const elapsedSec = Math.round(elapsed / 1000);

                    dim(`  ${symbols.ellipsis} Waiting for stack ${gray(`(${elapsedSec}s)`)}`);

                }

            } else {

                if (!stopSpinner) stopSpinner = startSpinner();

            }

            await new Promise((resolve) => setTimeout(resolve, 10000));

        } else {

            if (stopSpinner) stopSpinner();

            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const status = stack.StackStatus as StackStatus;
            const isFailed = FAILURE_STATUSES.includes(status);
            const statusDisplay = status.replace(/_/g, ' ').toLowerCase();

            if (isFailed) {

                error(`  ${symbols.cross} Stack reached ${statusDisplay} ${gray(`(${elapsed}s)`)}`);

            } else {

                success(`  ${symbols.check} Stack reached ${statusDisplay} ${gray(`(${elapsed}s)`)}`);

            }

            const failureReason = getFailureReason(allEventsList);

            return {
                stack,
                failureReason,
                allEvents: eventState,
            };

        }

    }

}
