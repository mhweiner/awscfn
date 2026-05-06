export interface ParamOverrideParseResult {
    overrides: Record<string, string>;
}

/**
 * Parse repeatable CLI overrides like:
 *   ["Foo=bar", "Env=prod"]
 */
export function parseParamOverrides(values: unknown[] | undefined): ParamOverrideParseResult {

    const overrides: Record<string, string> = {};

    if (!values) return {overrides};

    for (const raw of values) {

        if (typeof raw !== 'string') throw new Error(`Invalid --set value: ${String(raw)}`);

        const idx = raw.indexOf('=');

        if (idx <= 0) throw new Error(`Invalid --set value (expected Key=Value): ${raw}`);

        const key = raw.slice(0, idx).trim();
        const value = raw.slice(idx + 1);

        if (!key) throw new Error(`Invalid --set value (empty key): ${raw}`);

        overrides[key] = value;

    }

    return {overrides};

}

