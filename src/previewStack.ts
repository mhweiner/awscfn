import * as cfn from './lib/cfn';
import {loadTemplateAndParams} from './cli/loadTemplateAndParams';
import {validateTemplateOrExit} from './cli/validateTemplate';
import {cyan, info, symbols} from './lib/output';

/**
 * CLI: preview stack changes without executing (build change set, print table, delete change set).
 * CREATE vs UPDATE matches whether the stack already exists.
 */
export async function previewStack(
    stackName: string,
    templatePath: string,
    paramsPath?: string,
): Promise<void> {

    cfn.initCloudFormationClient();

    const {template, params} = await loadTemplateAndParams(templatePath, paramsPath);
    const existing = await cfn.getStackByName(stackName);

    console.log('validating template...');
    await validateTemplateOrExit(template);

    const operation = existing ? 'UPDATE' : 'CREATE';

    info(`${symbols.arrow} Preview ${cyan(operation)} for stack ${cyan(stackName)}`);

    await cfn.previewChangeSet(stackName, {body: template, params}, operation);

}
