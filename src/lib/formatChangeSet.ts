import type {Change, ResourceChange} from '@aws-sdk/client-cloudformation';
import {colorize, getOutputConfig, gray, green, red, yellow, cyan} from './output';

const colors = {
    dim: '\x1b[2m',
    gray: '\x1b[90m',
};

function pickActionStyle(action: string | undefined): (t: string) => string {

    if (action === 'Add') return green;
    if (action === 'Remove') return red;
    if (action === 'Modify') return yellow;
    if (action === 'Import') return cyan;

    return (t) => t;

}

function padRight(s: string, width: number): string {

    return s.length >= width ? s : s + ' '.repeat(width - s.length);

}

/** Entries such as hooks or future types that do not carry {@link ResourceChange}. */
function countNonResourceEntries(changes: Change[]): number {

    return changes.filter((c) => !c.ResourceChange).length;

}

function resourceRows(
    resourceChanges: ResourceChange[],
    maxLogical: number,
    maxType: number,
    configColor: boolean,
): string[] {

    const out: string[] = [];

    for (const r of resourceChanges) {

        const logical = padRight(r.LogicalResourceId ?? '—', maxLogical);
        const resType = padRight(r.ResourceType ?? '—', maxType);
        const replacement = r.Replacement ?? '—';
        const style = pickActionStyle(r.Action);
        const rawAction = r.Action ?? '—';
        const actionCell = configColor
            ? style(rawAction) + ' '.repeat(Math.max(0, 10 - rawAction.length))
            : rawAction.padEnd(10);

        out.push(`  ${actionCell}  ${logical}  ${resType}  ${replacement}`);

    }

    return out;

}

function sortedResourceChanges(changes: Change[]): ResourceChange[] {

    const resourceChanges = changes
        .map((c) => c.ResourceChange)
        .filter((rc): rc is ResourceChange => Boolean(rc));

    resourceChanges.sort((a, b) =>
        (a.LogicalResourceId ?? '').localeCompare(b.LogicalResourceId ?? ''));

    return resourceChanges;

}

/**
 * Printable rows for a CloudFormation change set's {@link Change} list (resource-level rows).
 * Sorts by logical resource id for stable output.
 * Non-resource entries (e.g. hooks) are counted but not tabulated.
 */
export function formatChangeSetPreviewLines(
    changes: Change[],
    opts?: {color?: boolean},
): string[] {

    const configColor = opts?.color ?? getOutputConfig().color;
    const resourceChanges = sortedResourceChanges(changes);
    const nonResourceCount = countNonResourceEntries(changes);

    if (resourceChanges.length === 0) {

        if (nonResourceCount > 0) {

            const msg = `  (no resource-level rows — ${nonResourceCount} other change entr${nonResourceCount === 1 ? 'y' : 'ies'}, e.g. hooks)`;

            return [configColor ? gray(msg) : msg];

        }

        return ['  (no resource-level changes in this change set)'];

    }

    const maxLogical = Math.max(14, ...resourceChanges.map((r) => (r.LogicalResourceId ?? '').length));
    const maxType = Math.max(12, ...resourceChanges.map((r) => (r.ResourceType ?? '').length));
    const headerLine = `${padRight('ACTION', 10)}  ${padRight('LOGICAL ID', maxLogical)}  `
        + `${padRight('RESOURCE TYPE', maxType)}  REPLACE`;

    const divider = '-'.repeat(headerLine.length);

    const lines: string[] = [
        configColor ? colorize(headerLine, colors.dim) : headerLine,
        configColor ? colorize(divider, colors.gray) : divider,
        ...resourceRows(resourceChanges, maxLogical, maxType, configColor),
    ];

    if (nonResourceCount > 0) {

        const note = `  (${nonResourceCount} non-resource change${nonResourceCount === 1 ? '' : 's'} omitted from table — e.g. hooks)`;

        lines.push(configColor ? gray(note) : note);

    }

    return lines;

}
