import {ValidateTemplateCommand} from '@aws-sdk/client-cloudformation';
import {Template, TemplateParams, getCfClient} from '.';
import {toResultAsync} from '../toResult';

type ValidationResult = true | Error;

export async function validateTemplate<T extends TemplateParams>(tpl: Template<T>): Promise<ValidationResult> {

    const cf = getCfClient();
    const body = typeof tpl === 'string' ? tpl : tpl.body;
    const [err] = await toResultAsync(cf.send(new ValidateTemplateCommand({TemplateBody: body})));

    if (err) return err;
    return true;

}
