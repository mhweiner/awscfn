"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitUntilStackTerminal = waitUntilStackTerminal;
exports.waitUntilStackTerminalWithEvents = waitUntilStackTerminalWithEvents;
const getStackByName_1 = require("./getStackByName");
const isStackTerminal_1 = require("./isStackTerminal");
const streamStackEvents_1 = require("./streamStackEvents");
const output_1 = require("../output");
async function waitUntilStackTerminal(name) {
    const result = await waitUntilStackTerminalWithEvents(name);
    return result.stack;
}
// eslint-disable-next-line max-lines-per-function
async function waitUntilStackTerminalWithEvents(name) {
    const config = (0, output_1.getOutputConfig)();
    const eventState = (0, streamStackEvents_1.createEventStreamState)();
    const allEventsList = [];
    const startTime = Date.now();
    let pollCount = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const stack = await (0, getStackByName_1.getStackByName)(name, true);
        if (!stack)
            throw new Error('stack not found');
        // Fetch and display new events
        try {
            const newEvents = await (0, streamStackEvents_1.fetchNewEvents)(name, eventState);
            for (const event of newEvents) {
                allEventsList.push(event);
                (0, streamStackEvents_1.printEvent)(event);
            }
        }
        catch {
            // Ignore event fetch errors - stack status is the source of truth
        }
        if (!(0, isStackTerminal_1.isStackTerminal)(stack)) {
            pollCount++;
            // Only show waiting message every 6 polls (60 seconds) in CI, or if no events shown
            if (!config.ci || (pollCount % 6 === 0 && allEventsList.length === 0)) {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                (0, output_1.dim)(`waiting for stack... (${elapsed}s)`);
            }
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
        else {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`stack reached ${stack.StackStatus} in ${elapsed}s`);
            const failureReason = (0, streamStackEvents_1.getFailureReason)(allEventsList);
            return {
                stack,
                failureReason,
                allEvents: eventState,
            };
        }
    }
}
//# sourceMappingURL=waitUntilStackTerminal.js.map