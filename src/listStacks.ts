import * as cfn from './lib/cfn';
import {getOutputConfig, colorize} from './lib/output';

const colors = {
    dim: '\x1b[2m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
};

/**
 * CLI handler: list all CloudFormation stacks.
 */
export async function listStacks(): Promise<void> {

    cfn.initCloudFormationClient();

    const stacks = await cfn.listStacks();
    const config = getOutputConfig();

    if (stacks.length === 0) {

        console.log('No stacks found.');
        return;

    }

    const maxName = Math.max(20, ...stacks.map((s) => (s.StackName ?? '').length));
    const headerName = 'STACK NAME'.padEnd(maxName);
    const headerStatus = 'STATUS';
    const headerCreated = 'CREATED';

    console.log(config.color ? colorize(`${headerName}  ${headerStatus}  ${headerCreated}`, colors.dim) : `${headerName}  ${headerStatus}  ${headerCreated}`);
    console.log(config.color ? colorize('-'.repeat(headerName.length + 2 + headerStatus.length + 2 + 10), colors.gray) : '-'.repeat(headerName.length + 2 + headerStatus.length + 2 + 10));

    for (const s of stacks) {

        const name = (s.StackName ?? '—').padEnd(maxName);
        const status = s.StackStatus ?? '—';
        const created = s.CreationTime
            ? s.CreationTime.toISOString().slice(0, 10)
            : '—';

        console.log(`${name}  ${status}  ${created}`);

    }

}
