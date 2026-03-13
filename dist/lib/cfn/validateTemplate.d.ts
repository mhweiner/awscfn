import { Template, TemplateParams } from '.';
type ValidationResult = true | Error;
export declare function validateTemplate<T extends TemplateParams>(tpl: Template<T>): Promise<ValidationResult>;
export {};
//# sourceMappingURL=validateTemplate.d.ts.map