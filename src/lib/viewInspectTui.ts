import {stdin, stdout} from 'node:process';

export interface InspectTuiSection {
    title: string
    body: string
}

export interface InspectTuiOptions {
    title: string
    subtitle: string
}

type FocusMode = 'sections'|'content';
type KeyAction = 'noop'|'rerender'|'quit';

interface InspectTuiState {
    sections: InspectTuiSection[]
    activeSectionIndex: number
    scrollOffset: number
    focusMode: FocusMode
    options: InspectTuiOptions
    useColor: boolean
}

interface TuiLayout {
    width: number
    height: number
    sidebarWidth: number
    contentWidth: number
    bodyHeight: number
}

const MIN_WIDTH = 70;
const MIN_HEIGHT = 16;
const KEY_PAGE_UP = '\u001b[5~';
const KEY_PAGE_DOWN = '\u001b[6~';
const KEY_ARROW_UP = '\u001b[A';
const KEY_ARROW_DOWN = '\u001b[B';
const KEY_ARROW_LEFT = '\u001b[D';
const KEY_ARROW_RIGHT = '\u001b[C';

function supportsInteractiveTui(): boolean {

    return stdin.isTTY === true
        && stdout.isTTY === true
        && process.env.CI !== 'true'
        && process.env.GITHUB_ACTIONS !== 'true';

}

function colorize(text: string, ansiCode: string, enabled: boolean): string {

    if (!enabled) return text;

    return `${ansiCode}${text}\x1b[0m`;

}

function highlightStatusToken(token: string, useColor: boolean): string {

    if (/FAILED|ROLLBACK/.test(token)) {

        return colorize(token, '\x1b[31m', useColor);

    }
    if (/COMPLETE|SUCCEEDED/.test(token)) {

        return colorize(token, '\x1b[32m', useColor);

    }
    if (/IN_PROGRESS|PENDING/.test(token)) {

        return colorize(token, '\x1b[33m', useColor);

    }

    return token;

}

function highlightStatusTerms(line: string, useColor: boolean): string {

    return line.replace(/\b[A-Z]+(?:_[A-Z]+)+\b/g, (token) => highlightStatusToken(token, useColor));

}

function highlightTimestamp(line: string, useColor: boolean): string {

    return line.replace(
        /\[(\d{4}-\d{2}-\d{2}T[^\]]+)\]/g,
        (_match, timestamp) => colorize(`[${timestamp}]`, '\x1b[90m', useColor),
    );

}

function highlightKeyValueLine(line: string, useColor: boolean): string {

    const jsonMatch = line.match(/^(\s*)"([^"]+)"(\s*:.*)$/);

    if (jsonMatch) {

        const [, indent, key, suffix] = jsonMatch;

        return `${indent}${colorize(`"${key}"`, '\x1b[36m', useColor)}${suffix}`;

    }

    const kvMatch = line.match(/^(\s*)([A-Za-z][A-Za-z0-9_\-. ()/]*)(:\s*.*)$/);

    if (!kvMatch) return line;

    const [, indent, key, suffix] = kvMatch;

    return `${indent}${colorize(key, '\x1b[36m', useColor)}${suffix}`;

}

function highlightLabels(line: string, useColor: boolean): string {

    return line.replace(/\bReason:/g, () => colorize('Reason:', '\x1b[33m', useColor));

}

function styleContentLine(line: string, sectionTitle: string, useColor: boolean): string {

    let styled = line;

    if (sectionTitle.includes('Raw JSON') || sectionTitle.includes('Template') || line.includes(':')) {

        styled = highlightKeyValueLine(styled, useColor);

    }

    styled = highlightTimestamp(styled, useColor);
    styled = highlightStatusTerms(styled, useColor);
    styled = highlightLabels(styled, useColor);

    return styled;

}

function truncateText(text: string, width: number): string {

    if (width <= 0) return '';
    if (text.length <= width) return text;
    if (width <= 3) return text.slice(0, width);

    return `${text.slice(0, width - 3)}...`;

}

function padText(text: string, width: number): string {

    if (text.length >= width) return text;

    return `${text}${' '.repeat(width - text.length)}`;

}

function fitLine(text: string, width: number): string {

    return padText(truncateText(text, width), width);

}

function wrapLine(line: string, width: number): string[] {

    if (line.length === 0) return [''];

    const out: string[] = [];
    let offset = 0;

    while (offset < line.length) {

        out.push(line.slice(offset, offset + width));
        offset += width;

    }

    return out;

}

function wrapBody(body: string, width: number): string[] {

    const lines = body.replace(/\r\n/g, '\n').split('\n');
    const wrapped: string[] = [];

    for (const line of lines) {

        wrapped.push(...wrapLine(line, width));

    }

    return wrapped;

}

function getLayout(): TuiLayout {

    const width = Math.max(40, stdout.columns ?? 80);
    const height = Math.max(10, stdout.rows ?? 24);
    const sidebarWidth = Math.max(18, Math.min(30, Math.floor(width * 0.28)));
    const contentWidth = Math.max(20, width - sidebarWidth - 3);
    const bodyHeight = Math.max(3, height - 5);

    return {width, height, sidebarWidth, contentWidth, bodyHeight};

}

function isLayoutTooSmall(layout: TuiLayout): boolean {

    return layout.width < MIN_WIDTH || layout.height < MIN_HEIGHT;

}

function currentContentLines(state: InspectTuiState, layout: TuiLayout): string[] {

    const section = state.sections[state.activeSectionIndex];

    return wrapBody(section.body, layout.contentWidth);

}

function maxScrollOffset(contentLines: string[], layout: TuiLayout): number {

    return Math.max(0, contentLines.length - layout.bodyHeight);

}

function sectionWindowStart(state: InspectTuiState, layout: TuiLayout): number {

    const maxStart = Math.max(0, state.sections.length - layout.bodyHeight);
    const preferred = Math.max(0, state.activeSectionIndex - Math.floor(layout.bodyHeight / 2));

    return Math.min(preferred, maxStart);

}

function renderSidebarLine(
    title: string,
    isActive: boolean,
    hasFocus: boolean,
    width: number,
    useColor: boolean,
): string {

    const marker = isActive ? '>' : ' ';
    const content = fitLine(`${marker} ${title}`, width);

    if (!isActive) return content;
    if (hasFocus) return colorize(content, '\x1b[1;36m', useColor);

    return colorize(content, '\x1b[36m', useColor);

}

function renderHeader(state: InspectTuiState, layout: TuiLayout): string[] {

    const title = colorize(fitLine(state.options.title, layout.width), '\x1b[1;37m', state.useColor);
    const subtitle = colorize(fitLine(state.options.subtitle, layout.width), '\x1b[90m', state.useColor);
    const divider = colorize('-'.repeat(layout.width), '\x1b[90m', state.useColor);

    return [title, subtitle, divider];

}

function renderBody(state: InspectTuiState, layout: TuiLayout, contentLines: string[]): string[] {

    const start = sectionWindowStart(state, layout);
    const visibleContent = contentLines.slice(state.scrollOffset, state.scrollOffset + layout.bodyHeight);
    const rows: string[] = [];
    const activeSection = state.sections[state.activeSectionIndex];
    const divider = colorize('|', '\x1b[90m', state.useColor);

    for (let row = 0; row < layout.bodyHeight; row++) {

        const section = state.sections[start + row];
        const left = section
            ? renderSidebarLine(
                section.title,
                start + row === state.activeSectionIndex,
                state.focusMode === 'sections',
                layout.sidebarWidth,
                state.useColor,
            )
            : fitLine('', layout.sidebarWidth);
        const rightPlain = fitLine(visibleContent[row] ?? '', layout.contentWidth);
        const right = styleContentLine(rightPlain, activeSection.title, state.useColor);

        rows.push(`${left} ${divider} ${right}`);

    }

    return rows;

}

function renderFooter(state: InspectTuiState, layout: TuiLayout, contentLines: string[]): string[] {

    const divider = colorize('-'.repeat(layout.width), '\x1b[90m', state.useColor);
    const maxScroll = maxScrollOffset(contentLines, layout);
    const startLine = contentLines.length === 0 ? 0 : state.scrollOffset + 1;
    const endLine = Math.min(contentLines.length, state.scrollOffset + layout.bodyHeight);
    const status = [
        `Section ${state.activeSectionIndex + 1}/${state.sections.length}`,
        `Lines ${startLine}-${endLine}/${Math.max(contentLines.length, 1)}`,
        `Focus ${state.focusMode}`,
        'Tab switch focus',
        'Arrows navigate',
        'PgUp/PgDn scroll',
        'q quit',
        maxScroll > 0 ? '' : 'No scroll',
    ].filter(Boolean).join(' | ');

    return [divider, colorize(fitLine(status, layout.width), '\x1b[90m', state.useColor)];

}

function smallTerminalFrame(layout: TuiLayout): string {

    const lines = [
        fitLine('awscfn inspect-stack', layout.width),
        fitLine('', layout.width),
        fitLine(`Terminal too small (${layout.width}x${layout.height}) for interactive mode.`, layout.width),
        fitLine(`Resize to at least ${MIN_WIDTH}x${MIN_HEIGHT}, or use --no-pager.`, layout.width),
        fitLine('', layout.width),
        fitLine('Press q to quit.', layout.width),
    ];

    return lines.join('\n');

}

function buildFrame(state: InspectTuiState): string {

    const layout = getLayout();

    if (isLayoutTooSmall(layout)) {

        return smallTerminalFrame(layout);

    }

    const contentLines = currentContentLines(state, layout);
    const lines = [
        ...renderHeader(state, layout),
        ...renderBody(state, layout, contentLines),
        ...renderFooter(state, layout, contentLines),
    ];

    return lines.join('\n');

}

function normalizeKey(input: string): string {

    if (input === '\u0003') return 'QUIT';
    if (input === '\u001b' || input === 'q') return 'QUIT';
    if (input === '\t') return 'TAB';
    if (input === KEY_ARROW_UP || input === 'k') return 'UP';
    if (input === KEY_ARROW_DOWN || input === 'j') return 'DOWN';
    if (input === KEY_ARROW_LEFT || input === 'h') return 'LEFT';
    if (input === KEY_ARROW_RIGHT || input === 'l') return 'RIGHT';
    if (input === KEY_PAGE_UP) return 'PGUP';
    if (input === KEY_PAGE_DOWN) return 'PGDN';
    if (input === 'g') return 'HOME';
    if (input === 'G') return 'END';

    return 'UNKNOWN';

}

function updateActiveSection(state: InspectTuiState, nextIndex: number): boolean {

    const clamped = Math.max(0, Math.min(state.sections.length - 1, nextIndex));

    if (clamped === state.activeSectionIndex) return false;

    state.activeSectionIndex = clamped;
    state.scrollOffset = 0;

    return true;

}

function updateScroll(state: InspectTuiState, delta: number): boolean {

    const layout = getLayout();
    const contentLines = currentContentLines(state, layout);
    const max = maxScrollOffset(contentLines, layout);
    const next = Math.max(0, Math.min(max, state.scrollOffset + delta));

    if (next === state.scrollOffset) return false;

    state.scrollOffset = next;

    return true;

}

function applyKey(state: InspectTuiState, key: string): KeyAction {

    if (key === 'QUIT') return 'quit';
    if (key === 'TAB') {

        state.focusMode = state.focusMode === 'sections' ? 'content' : 'sections';

        return 'rerender';

    }
    if (key === 'LEFT') return updateActiveSection(state, state.activeSectionIndex - 1) ? 'rerender' : 'noop';
    if (key === 'RIGHT') return updateActiveSection(state, state.activeSectionIndex + 1) ? 'rerender' : 'noop';
    if (key === 'HOME') return updateScroll(state, Number.MIN_SAFE_INTEGER) ? 'rerender' : 'noop';
    if (key === 'END') return updateScroll(state, Number.MAX_SAFE_INTEGER) ? 'rerender' : 'noop';
    if (key === 'PGUP') return updateScroll(state, -Math.max(1, getLayout().bodyHeight - 1)) ? 'rerender' : 'noop';
    if (key === 'PGDN') return updateScroll(state, Math.max(1, getLayout().bodyHeight - 1)) ? 'rerender' : 'noop';
    if (key === 'UP') {

        return state.focusMode === 'sections'
            ? (updateActiveSection(state, state.activeSectionIndex - 1) ? 'rerender' : 'noop')
            : (updateScroll(state, -1) ? 'rerender' : 'noop');

    }
    if (key === 'DOWN') {

        return state.focusMode === 'sections'
            ? (updateActiveSection(state, state.activeSectionIndex + 1) ? 'rerender' : 'noop')
            : (updateScroll(state, 1) ? 'rerender' : 'noop');

    }

    return 'noop';

}

function enterScreen(): void {

    stdout.write('\x1b[?1049h');
    stdout.write('\x1b[?25l');
    stdout.write('\x1b[2J\x1b[H');

}

function leaveScreen(): void {

    stdout.write('\x1b[?25h');
    stdout.write('\x1b[?1049l');

}

function render(state: InspectTuiState): void {

    stdout.write('\x1b[2J\x1b[H');
    stdout.write(buildFrame(state));

}

function createState(sections: InspectTuiSection[], options: InspectTuiOptions): InspectTuiState {

    return {
        sections,
        activeSectionIndex: 0,
        scrollOffset: 0,
        focusMode: 'sections',
        options,
        useColor: process.env.NO_COLOR === undefined,
    };

}

// eslint-disable-next-line max-lines-per-function
function startTuiSession(state: InspectTuiState, resolve: (value: boolean) => void): void {

    let finished = false;

    function finish(value: boolean): void {

        if (finished) return;
        finished = true;
        stdin.removeListener('data', onData);
        stdout.removeListener('resize', onResize);
        stdin.setRawMode(false);
        stdin.pause();
        leaveScreen();
        resolve(value);

    }

    function onData(chunk: Buffer|string): void {

        const key = normalizeKey(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
        const action = applyKey(state, key);

        if (action === 'quit') {

            finish(true);
            return;

        }

        if (action === 'rerender') render(state);

    }

    function onResize(): void {

        render(state);

    }

    try {

        enterScreen();
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding('utf8');
        stdin.on('data', onData);
        stdout.on('resize', onResize);
        render(state);

    } catch {

        finish(false);

    }

}

export async function viewInspectTui(
    sections: InspectTuiSection[],
    options: InspectTuiOptions,
): Promise<boolean> {

    if (!supportsInteractiveTui() || sections.length === 0 || typeof stdin.setRawMode !== 'function') {

        return false;

    }

    const state = createState(sections, options);

    return new Promise((resolve) => startTuiSession(state, resolve));

}
