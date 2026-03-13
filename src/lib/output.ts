export interface OutputConfig {
    ci: boolean
    color: boolean
    verbose: boolean
}

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

let config: OutputConfig = {
    ci: isCI,
    // Enable colors if: no NO_COLOR env, AND (TTY OR CI - GitHub Actions supports ANSI colors)
    color: !process.env.NO_COLOR && (process.stdout.isTTY === true || isCI),
    verbose: false,
};

export function setOutputConfig(newConfig: Partial<OutputConfig>): void {

    config = {...config, ...newConfig};

}

export function getOutputConfig(): OutputConfig {

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

export function colorize(text: string, ...codes: string[]): string {

    if (!config.color) return text;

    return codes.join('') + text + colors.reset;

}

export function log(message: string): void {

    console.log(message);

}

export function success(message: string): void {

    console.log(config.color ? colorize(message, colors.green) : message);

}

export function error(message: string): void {

    console.error(config.color ? colorize(message, colors.red) : message);

}

export function warn(message: string): void {

    console.log(config.color ? colorize(message, colors.yellow) : message);

}

export function info(message: string): void {

    console.log(config.color ? colorize(message, colors.cyan) : message);

}

export function dim(message: string): void {

    console.log(config.color ? colorize(message, colors.gray) : message);

}

export function bold(text: string): string {

    return config.color ? colorize(text, colors.bold) : text;

}

export function cyan(text: string): string {

    return config.color ? colorize(text, colors.cyan) : text;

}

export function green(text: string): string {

    return config.color ? colorize(text, colors.green) : text;

}

export function red(text: string): string {

    return config.color ? colorize(text, colors.red) : text;

}

export function yellow(text: string): string {

    return config.color ? colorize(text, colors.yellow) : text;

}

export function gray(text: string): string {

    return config.color ? colorize(text, colors.gray) : text;

}

export function blue(text: string): string {

    return config.color ? colorize(text, colors.blue) : text;

}

export function magenta(text: string): string {

    return config.color ? colorize(text, colors.magenta) : text;

}

export const symbols = {
    check: '✓',
    cross: '✗',
    bullet: '●',
    arrow: '→',
    ellipsis: '…',
    info: 'ℹ',
    warning: '⚠',
    box: '▪',
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start a spinner on the current line (non-CI + TTY only). Returns a stop function.
 */
export function startSpinner(): () => void {

    if (config.ci || !process.stdout.isTTY) {

        return () => {};

    }

    let i = 0;

    spinnerInterval = setInterval(() => {

        const frame = SPINNER_FRAMES[i % SPINNER_FRAMES.length];
        const gray = config.color ? '\x1b[90m' : '';
        const reset = config.color ? '\x1b[0m' : '';

        process.stdout.write(`\r  ${gray}${frame}${reset} `);
        i++;

    }, 80);

    return () => {

        if (spinnerInterval) {

            clearInterval(spinnerInterval);
            spinnerInterval = null;
            process.stdout.write('\r  \r');

        }

    };

}
