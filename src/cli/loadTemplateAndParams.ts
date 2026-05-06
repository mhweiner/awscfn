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
    overrides?: Record<string, string>,
): Promise<TemplateAndParams> {

    const template = readFileSync(templatePath, 'utf-8');
    const fileParams = (paramsPath && templateHasParameters(template))
        ? ((await getParamsFromFile(paramsPath)) as Record<string, unknown>)
        : {};

    const params = {
        ...fileParams,
        ...(overrides ?? {}),
    };

    return {template, params};

}
