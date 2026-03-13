import {readFileSync} from 'node:fs';
import {getParamsFromFile} from '../lib/getParamsFromFile';
import {templateHasParameters} from '../lib/templateHasParameters';

export interface TemplateAndParams {
    template: string;
    params: Record<string, unknown>;
}

/**
 * Load template from file and params (from file only if template declares Parameters).
 */
export async function loadTemplateAndParams(
    templatePath: string,
    paramsPath: string,
): Promise<TemplateAndParams> {

    const template = readFileSync(templatePath, 'utf-8');
    const params = templateHasParameters(template)
        ? ((await getParamsFromFile(paramsPath)) as Record<string, unknown>)
        : {};

    return {template, params};

}
