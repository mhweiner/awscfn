import {test} from 'kizu';
import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadTemplateAndParams} from './loadTemplateAndParams';

test('loadTemplateAndParams throws when template has no Parameters but overrides provided', async (assert) => {

    const dir = mkdtempSync(join(tmpdir(), 'awscfn-'));
    const templatePath = join(dir, 'template.yaml');

    writeFileSync(templatePath, 'Resources: {}', 'utf-8');

    await assert.throws(
        () => loadTemplateAndParams(templatePath, undefined, {Foo: 'bar'}),
        /does not declare Parameters/i,
    );

});

