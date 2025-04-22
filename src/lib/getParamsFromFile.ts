import {isError} from './isError';
import {readYaml} from './readYaml';
import {toResultAsync} from './toResult';

export async function getParamsFromFile(filePath: string): Promise<Record<string, any>> {

    const [error, obj] = await toResultAsync(readYaml(filePath));

    if (error && isError(error)) {

        throw new Error(`Error parsing YAML file at ${filePath}: ${error.message}`);

    } else if (error) {

        throw new Error(`Error parsing YAML file at ${filePath}: ${error}`);

    } else {

        return obj as Record<string, any>;

    }

}
