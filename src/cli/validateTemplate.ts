import * as cfn from '../lib/cfn';

/**
 * Validate template; log error and exit(1) on failure.
 */
export async function validateTemplateOrExit(template: string): Promise<void> {

    const result = await cfn.validateTemplate(template);

    if (result instanceof Error) {

        console.error('template validation failed:', result);
        process.exit(1);

    }

}
