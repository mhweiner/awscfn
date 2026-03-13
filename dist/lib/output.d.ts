export interface OutputConfig {
    ci: boolean;
    color: boolean;
    verbose: boolean;
}
export declare function setOutputConfig(newConfig: Partial<OutputConfig>): void;
export declare function getOutputConfig(): OutputConfig;
export declare function log(message: string): void;
export declare function success(message: string): void;
export declare function error(message: string): void;
export declare function warn(message: string): void;
export declare function dim(message: string): void;
