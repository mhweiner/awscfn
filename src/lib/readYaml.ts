import fs from 'fs/promises';
import yaml from 'js-yaml';

export async function readYaml<T extends object>(filePath: string): Promise<T> {

    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsedTemplate = yaml.load(fileContent);

    return parsedTemplate as T;

}
