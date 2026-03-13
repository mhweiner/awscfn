"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStack = updateStack;
const getParamsFromFile_1 = require("./lib/getParamsFromFile");
const fs_1 = require("fs");
const cfn = __importStar(require("./lib/cfn"));
// The following must be exported
const { 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
AWS_REGION, AWS_ACCOUNT_ID, } = process.env;
/**
 * Only used by the CLI
 */
async function updateStack(stackName, templateFile, paramsFile) {
    cfn.initCloudFormationClient();
    const params = await (0, getParamsFromFile_1.getParamsFromFile)(paramsFile);
    const template = (0, fs_1.readFileSync)(templateFile, 'utf-8');
    const existingStack = await cfn.getStackByName(stackName);
    if (!existingStack)
        throw new Error('stack not found, try create command');
    console.log('validating template...');
    const validationResult = await cfn.validateTemplate(template);
    if (validationResult instanceof Error) {
        console.error('template validation failed:', validationResult);
        process.exit(1);
    }
    console.log(`updating stack "${stackName}" on account ${AWS_ACCOUNT_ID} with the following params:`, params);
    await cfn.updateStack(existingStack, { body: template, params });
}
//# sourceMappingURL=updateStack.js.map