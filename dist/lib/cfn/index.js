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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCloudFormationClient = initCloudFormationClient;
exports.getCfClient = getCfClient;
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
let cf;
function initCloudFormationClient() {
    cf = new client_cloudformation_1.CloudFormationClient();
}
function getCfClient() {
    if (!cf)
        throw new Error('CloudFormation client not initialized');
    return cf;
}
__exportStar(require("./createStack"), exports);
__exportStar(require("./getStackByName"), exports);
__exportStar(require("./updateStack"), exports);
__exportStar(require("./deleteStack"), exports);
__exportStar(require("./validateTemplate"), exports);
__exportStar(require("./generateStackName"), exports);
__exportStar(require("./isStackTerminal"), exports);
__exportStar(require("./waitUntilStackTerminal"), exports);
__exportStar(require("./getParamFromStack"), exports);
__exportStar(require("./streamStackEvents"), exports);
//# sourceMappingURL=index.js.map