/**
 * True if the template declares a Parameters section.
 * Uses regex to avoid parsing with js-yaml (which doesn't handle CFN intrinsics like !Sub, !Ref).
 */
export function templateHasParameters(templateBody: string): boolean {

    return /^\s*Parameters\s*:/m.test(templateBody);

}
