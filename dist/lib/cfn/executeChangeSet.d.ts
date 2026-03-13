import { Template, TemplateParams } from './index';
type ChangeSetOperation = 'UPDATE' | 'CREATE';
export declare function createAndExecChangeSet<P extends TemplateParams>(stackName: string, template: Template<P>, operation: ChangeSetOperation): Promise<string>;
export {};
//# sourceMappingURL=executeChangeSet.d.ts.map