import {readFileSync} from 'node:fs';
import {getParamsFromFile} from '../lib/getParamsFromFile';
import {templateHasParameters} from '../lib/templateHasParameters';

export interface TemplateAndParams {
    template: string;
    params: Record<string, unknown>;
}

/**
 * Load template from file and optional params. If no params file is given, uses {}.
 * CloudFormation will error if a required parameter has no default.
 */
export async function loadTemplateAndParams(
    templatePath: string,
    paramsPath: string | undefined,
): Promise<TemplateAndParams> {

    const template = readFileSync(templatePath, 'utf-8');
    const params = (paramsPath && templateHasParameters(template))
        ? ((await getParamsFromFile(paramsPath)) as Record<string, unknown>)
        : {};

    return {template, params};

}
