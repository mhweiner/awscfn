/**
 * Returns true if the CloudFormation template body declares a Parameters section.
 * Uses a simple pattern match to avoid parsing the full template with js-yaml,
 * which does not understand CloudFormation intrinsics (!Sub, !Ref, etc.).
 */
export function templateHasParameters(templateBody: string): boolean {

    return /^\s*Parameters\s*:/m.test(templateBody);

}
