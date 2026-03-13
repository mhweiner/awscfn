const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID ?? '';

/**
 * Log a stack action; include params only when non-empty.
 */
export function logStackAction(
    stackName: string,
    action: 'creating' | 'updating' | 'deleting',
    params?: Record<string, unknown>,
): void {

    const hasParams = params && Object.keys(params).length > 0;
    const base = `${action} stack "${stackName}" on account ${AWS_ACCOUNT_ID}`;

    if (hasParams) {

        console.log(`${base} with the following params:`, params);

    } else {

        console.log(`${base}`);

    }

}
