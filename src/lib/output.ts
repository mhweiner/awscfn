export interface OutputConfig {
    ci: boolean
    color: boolean
    verbose: boolean
}

let config: OutputConfig = {
    ci: process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true',
    color: !process.env.NO_COLOR && process.stdout.isTTY === true,
    verbose: false,
};

export function setOutputConfig(newConfig: Partial<OutputConfig>): void {

    config = {...config, ...newConfig};

}

export function getOutputConfig(): OutputConfig {

    return config;

}

export function log(message: string): void {

    console.log(message);

}

export function success(message: string): void {

    if (config.color) {

        console.log(`\x1b[32m${message}\x1b[0m`);

    } else {

        console.log(message);

    }

}

export function error(message: string): void {

    if (config.color) {

        console.error(`\x1b[31m${message}\x1b[0m`);

    } else {

        console.error(message);

    }

}

export function warn(message: string): void {

    if (config.color) {

        console.log(`\x1b[33m${message}\x1b[0m`);

    } else {

        console.log(message);

    }

}

export function dim(message: string): void {

    if (config.color) {

        console.log(`\x1b[90m${message}\x1b[0m`);

    } else {

        console.log(message);

    }

}
