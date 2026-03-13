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
exports.redeployStack = redeployStack;
const node_fs_1 = require("node:fs");
const cfn = __importStar(require("./lib/cfn"));
const getParamsFromStack_1 = require("./lib/cfn/getParamsFromStack");
const validateTemplate_1 = require("./cli/validateTemplate");
const log_1 = require("./cli/log");
/**
 * CLI handler: redeploy stack with existing params (template only).
 */
async function redeployStack(stackName, templatePath) {
    cfn.initCloudFormationClient();
    const template = (0, node_fs_1.readFileSync)(templatePath, 'utf-8');
    const existing = await cfn.getStackByName(stackName);
    if (!existing) {
        throw new Error('stack not found, try create command');
    }
    const params = (0, getParamsFromStack_1.getParamsFromStack)(existing);
    console.log('stack found, validating template...');
    await (0, validateTemplate_1.validateTemplateOrExit)(template);
    (0, log_1.logStackAction)(stackName, 'updating', params);
    await cfn.updateStack(existing, { body: template, params });
}
//# sourceMappingURL=redeployStack.js.map