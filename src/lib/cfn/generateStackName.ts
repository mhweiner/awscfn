export const generateStackName = (
    namespace: string,
    name: string,
): string => `iac-${namespace}-${name}`;
