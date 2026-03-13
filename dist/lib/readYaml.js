"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readYaml = readYaml;
const promises_1 = __importDefault(require("fs/promises"));
const js_yaml_1 = __importDefault(require("js-yaml"));
async function readYaml(filePath) {
    const fileContent = await promises_1.default.readFile(filePath, 'utf8');
    const parsedTemplate = js_yaml_1.default.load(fileContent);
    return parsedTemplate;
}
//# sourceMappingURL=readYaml.js.map