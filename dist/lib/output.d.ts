export interface OutputConfig {
    ci: boolean;
    color: boolean;
    verbose: boolean;
}
export declare function setOutputConfig(newConfig: Partial<OutputConfig>): void;
export declare function getOutputConfig(): OutputConfig;
export declare function colorize(text: string, ...codes: string[]): string;
export declare function log(message: string): void;
export declare function success(message: string): void;
export declare function error(message: string): void;
export declare function warn(message: string): void;
export declare function info(message: string): void;
export declare function dim(message: string): void;
export declare function bold(text: string): string;
export declare function cyan(text: string): string;
export declare function green(text: string): string;
export declare function red(text: string): string;
export declare function yellow(text: string): string;
export declare function gray(text: string): string;
export declare function blue(text: string): string;
export declare function magenta(text: string): string;
export declare const symbols: {
    check: string;
    cross: string;
    bullet: string;
    arrow: string;
    ellipsis: string;
    info: string;
    warning: string;
    box: string;
};
//# sourceMappingURL=output.d.ts.map