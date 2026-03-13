"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbols = void 0;
exports.setOutputConfig = setOutputConfig;
exports.getOutputConfig = getOutputConfig;
exports.colorize = colorize;
exports.log = log;
exports.success = success;
exports.error = error;
exports.warn = warn;
exports.info = info;
exports.dim = dim;
exports.bold = bold;
exports.cyan = cyan;
exports.green = green;
exports.red = red;
exports.yellow = yellow;
exports.gray = gray;
exports.blue = blue;
exports.magenta = magenta;
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
let config = {
    ci: isCI,
    // Enable colors if: no NO_COLOR env, AND (TTY OR CI - GitHub Actions supports ANSI colors)
    color: !process.env.NO_COLOR && (process.stdout.isTTY === true || isCI),
    verbose: false,
};
function setOutputConfig(newConfig) {
    config = { ...config, ...newConfig };
}
function getOutputConfig() {
    return config;
}
// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    brightGreen: '\x1b[92m',
    brightYellow: '\x1b[93m',
    brightCyan: '\x1b[96m',
};
function colorize(text, ...codes) {
    if (!config.color)
        return text;
    return codes.join('') + text + colors.reset;
}
function log(message) {
    console.log(message);
}
function success(message) {
    console.log(config.color ? colorize(message, colors.green) : message);
}
function error(message) {
    console.error(config.color ? colorize(message, colors.red) : message);
}
function warn(message) {
    console.log(config.color ? colorize(message, colors.yellow) : message);
}
function info(message) {
    console.log(config.color ? colorize(message, colors.cyan) : message);
}
function dim(message) {
    console.log(config.color ? colorize(message, colors.gray) : message);
}
function bold(text) {
    return config.color ? colorize(text, colors.bold) : text;
}
function cyan(text) {
    return config.color ? colorize(text, colors.cyan) : text;
}
function green(text) {
    return config.color ? colorize(text, colors.green) : text;
}
function red(text) {
    return config.color ? colorize(text, colors.red) : text;
}
function yellow(text) {
    return config.color ? colorize(text, colors.yellow) : text;
}
function gray(text) {
    return config.color ? colorize(text, colors.gray) : text;
}
function blue(text) {
    return config.color ? colorize(text, colors.blue) : text;
}
function magenta(text) {
    return config.color ? colorize(text, colors.magenta) : text;
}
exports.symbols = {
    check: '✓',
    cross: '✗',
    bullet: '●',
    arrow: '→',
    ellipsis: '…',
    info: 'ℹ',
    warning: '⚠',
    box: '▪',
};
//# sourceMappingURL=output.js.map