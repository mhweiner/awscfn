"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTemplate = validateTemplate;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const _1 = require(".");
const toResult_1 = require("../toResult");
async function validateTemplate(tpl) {
    const cf = (0, _1.getCfClient)();
    const [err] = await (0, toResult_1.toResultAsync)(cf.send(new client_cloudformation_1.ValidateTemplateCommand({
        TemplateBody: typeof tpl === 'string' ? tpl : tpl.body,
    })));
    if (err) {
        return err;
    }
    else {
        return true;
    }
}
//# sourceMappingURL=validateTemplate.js.map