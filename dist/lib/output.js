"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOutputConfig = setOutputConfig;
exports.getOutputConfig = getOutputConfig;
exports.log = log;
exports.success = success;
exports.error = error;
exports.warn = warn;
exports.dim = dim;
let config = {
    ci: process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true',
    color: !process.env.NO_COLOR && process.stdout.isTTY === true,
    verbose: false,
};
function setOutputConfig(newConfig) {
    config = { ...config, ...newConfig };
}
function getOutputConfig() {
    return config;
}
function log(message) {
    console.log(message);
}
function success(message) {
    if (config.color) {
        console.log(`\x1b[32m${message}\x1b[0m`);
    }
    else {
        console.log(message);
    }
}
function error(message) {
    if (config.color) {
        console.error(`\x1b[31m${message}\x1b[0m`);
    }
    else {
        console.error(message);
    }
}
function warn(message) {
    if (config.color) {
        console.log(`\x1b[33m${message}\x1b[0m`);
    }
    else {
        console.log(message);
    }
}
function dim(message) {
    if (config.color) {
        console.log(`\x1b[90m${message}\x1b[0m`);
    }
    else {
        console.log(message);
    }
}
//# sourceMappingURL=output.js.map