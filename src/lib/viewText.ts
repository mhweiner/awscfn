import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export interface ViewTextOptions {
    usePager: boolean
}

function runViewerCommand(command: string, args: string[]): boolean {

    const result = spawnSync(command, args, {stdio: 'inherit'});

    return !result.error && result.status === 0;

}

function runPagerExpression(pagerExpression: string, filePath: string): boolean {

    const result = spawnSync(`${pagerExpression} "${filePath}"`, {
        shell: true,
        stdio: 'inherit',
    });

    return !result.error && result.status === 0;

}

function openWithPager(filePath: string): boolean {

    const pagerExpression = process.env.GIT_PAGER ?? process.env.PAGER;

    if (pagerExpression && runPagerExpression(pagerExpression, filePath)) {

        return true;

    }

    return runViewerCommand('less', ['-R', filePath]) || runViewerCommand('more', [filePath]);

}

function writeTempReport(reportName: string, content: string): string {

    const tempDir = mkdtempSync(path.join(tmpdir(), 'awscfn-'));
    const safeName = reportName.replace(/[^a-zA-Z0-9-]/g, '-');
    const filePath = path.join(tempDir, `${safeName}.txt`);

    writeFileSync(filePath, content, 'utf8');

    return filePath;

}

function readAndPrint(filePath: string): void {

    console.log(readFileSync(filePath, 'utf8'));

}

function shouldPrintInline(usePager: boolean): boolean {

    return !usePager || !process.stdout.isTTY || process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

}

export function viewText(reportName: string, content: string, options: ViewTextOptions): void {

    if (shouldPrintInline(options.usePager)) {

        console.log(content);
        return;

    }

    const filePath = writeTempReport(reportName, content);

    try {

        if (!openWithPager(filePath)) {

            readAndPrint(filePath);

        }

    } finally {

        rmSync(path.dirname(filePath), {recursive: true, force: true});

    }

}
