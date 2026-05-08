import {GetTemplateCommand} from '@aws-sdk/client-cloudformation';
import {getCfClient} from '.';

function toTemplateString(templateBody: unknown): string {

    if (typeof templateBody === 'string') {

        return templateBody;

    }

    if (!templateBody) {

        return '';

    }

    return JSON.stringify(templateBody, null, 2);

}

async function fetchTemplate(stage: 'Original'|'Processed', stackName: string): Promise<string> {

    const cf = getCfClient();
    const response = await cf.send(new GetTemplateCommand({
        StackName: stackName,
        TemplateStage: stage,
    }));

    return toTemplateString(response.TemplateBody);

}

export async function getStackTemplateBody(stackName: string): Promise<string> {

    const original = await fetchTemplate('Original', stackName);

    if (original) {

        return original;

    }

    return fetchTemplate('Processed', stackName);

}
