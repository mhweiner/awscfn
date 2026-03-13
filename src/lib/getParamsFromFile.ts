import {isError} from './isError';
import {readYaml} from './readYaml';
import {toResultAsync} from './toResult';

export async function getParamsFromFile(filePath: string): Promise<Record<string, unknown>> {

    const [err, obj] = await toResultAsync(readYaml(filePath));

    if (err) {

        const msg = isError(err) ? err.message : String(err);

        throw new Error(`Error parsing YAML file at ${filePath}: ${msg}`);

    }

    return obj as Record<string, unknown>;

}
