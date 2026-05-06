import {test} from 'kizu';
import {parseParamOverrides} from './parseParamOverrides';

test('parseParamOverrides parses repeated Key=Value pairs', (assert) => {

    const {overrides} = parseParamOverrides(['Foo=bar', 'Env=prod']);

    assert.equal(overrides, {Foo: 'bar', Env: 'prod'});

});

test('parseParamOverrides last value wins for duplicate keys', (assert) => {

    const {overrides} = parseParamOverrides(['Foo=bar', 'Foo=baz']);

    assert.equal(overrides, {Foo: 'baz'});

});

test('parseParamOverrides throws on invalid format', (assert) => {

    assert.throws(() => parseParamOverrides(['NoEquals'] as any), /expected Key=Value/);

});

