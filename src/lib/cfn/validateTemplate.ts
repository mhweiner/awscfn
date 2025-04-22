import {
    ValidateTemplateCommand,
} from '@aws-sdk/client-cloudformation';
import {Template, TemplateParams, getCfClient} from '.';
import {toResultAsync} from '../toResult';

type ValidationResult = true | Error;

export async function validateTemplate<T extends TemplateParams>(tpl: Template<T>): Promise<ValidationResult> {

    const cf = getCfClient();
    const [err] = await toResultAsync(cf.send(new ValidateTemplateCommand({
        TemplateBody: typeof tpl === 'string' ? tpl : tpl.template,
    })));

    if (err) {

        return err;

    } else {

        return true;

    }

}
