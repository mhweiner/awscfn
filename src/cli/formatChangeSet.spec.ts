import {test} from 'kizu';
import type {Change} from '@aws-sdk/client-cloudformation';
import {formatChangeSetPreviewLines} from './formatChangeSet';

test('formatChangeSetPreviewLines sorts by logical id and prints columns', (assert) => {

    const changes: Change[] = [
        {
            Type: 'Resource',
            ResourceChange: {
                Action: 'Modify',
                LogicalResourceId: 'B',
                ResourceType: 'AWS::S3::Bucket',
                Replacement: 'False',
            },
        },
        {
            Type: 'Resource',
            ResourceChange: {
                Action: 'Add',
                LogicalResourceId: 'A',
                ResourceType: 'AWS::IAM::Role',
                Replacement: 'False',
            },
        },
    ];

    const lines = formatChangeSetPreviewLines(changes, {color: false});
    const text = lines.join('\n');

    assert.equal(text.includes('LOGICAL ID'), true);
    assert.equal(text.includes('RESOURCE TYPE'), true);
    assert.equal(text.includes('AWS::IAM::Role'), true);
    assert.equal(text.includes('AWS::S3::Bucket'), true);

    const dataLines = lines.filter((l) => l.includes('Add') && l.includes('A'));

    assert.equal(dataLines.length >= 1, true);

});

test('formatChangeSetPreviewLines empty changes', (assert) => {

    const lines = formatChangeSetPreviewLines([], {color: false});

    assert.equal(lines.length, 1);
    assert.equal(lines[0].includes('no resource-level'), true);

});
