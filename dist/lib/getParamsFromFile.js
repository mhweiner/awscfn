"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParamsFromFile = getParamsFromFile;
const isError_1 = require("./isError");
const readYaml_1 = require("./readYaml");
const toResult_1 = require("./toResult");
async function getParamsFromFile(filePath) {
    const [error, obj] = await (0, toResult_1.toResultAsync)((0, readYaml_1.readYaml)(filePath));
    if (error && (0, isError_1.isError)(error)) {
        throw new Error(`Error parsing YAML file at ${filePath}: ${error.message}`);
    }
    else if (error) {
        throw new Error(`Error parsing YAML file at ${filePath}: ${error}`);
    }
    else {
        return obj;
    }
}
//# sourceMappingURL=getParamsFromFile.js.map