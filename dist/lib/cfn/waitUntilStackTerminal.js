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
            // keep waiting
            if (config.ci) {
                console.log(`stack is still in progress with status: ${stack.StackStatus}`);
            }
            else {
                (0, output_1.dim)(`waiting... (${stack.StackStatus})`);
            }
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
        else {
            // we're done
            console.log(`stack is terminal with status: ${stack.StackStatus}`);
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