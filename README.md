# awscfn

[![build status](https://github.com/mhweiner/awscfn/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/awscfn/actions)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![AutoRel](https://img.shields.io/badge/v2-AutoRel?label=AutoRel&labelColor=0ab5fc&color=grey&link=https%3A%2F%2Fgithub.com%2Fmhweiner%2Fautorel)](https://github.com/mhweiner/autorel)

**awscfn** is a lightweight CLI and TypeScript SDK for managing AWS CloudFormation stacks. It simplifies common actions like create, update, redeploy, and delete, and makes working with parameters painless by supporting clean, readable YAML files. Use it in your shell scripts or directly from Node.js projects to streamline CloudFormation workflows.

## CLI commands

> ⚠️ Requires AWS credentials to be configured in your shell or environment. [Start here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if you haven't already.

### 🚀 create-stack 

```bash
npx awscfn create-stack {STACK_NAME} {TEMPLATE_FILE} {PARAMS_FILE}
```

Stack name is the name of the stack in CloudFormation. Template file is the path to the CloudFormation template. Params file is the path to the parameters file.

### ⬆️ update-stack

```bash
npx awscfn update-stack {STACK_NAME} {TEMPLATE_FILE} {PARAMS_FILE}
```

Stack name is the name of the stack in CloudFormation. Template file is the path to the CloudFormation template. Params file is the path to the parameters file. There must be changes to the template in order for the stack to update.

### ♻️ redeploy-stack

```bash
npx awscfn redeploy-stack {STACK_NAME} {TEMPLATE_FILE} {PARAMS_FILE}
```

Redeploys a CloudFormation stack with the given name and template file, using the existing stack's parameters. Useful for updating a stack with a new template without having to specify all the parameters again, or for re-deploying a stack that failed to create for some reason.

### 🗑️ `delete-stack`

Deletes a CloudFormation stack by name, with a confirmation safeguard.

```bash
npx awscfn delete-stack {STACK_NAME} {CONFIRM_STACK_NAME}
```

- `STACK_NAME`: The name of the stack to delete.
- `CONFIRM_STACK_NAME`: Must match `STACK_NAME` exactly — used as a safety check to prevent accidental deletion.

**Example:**

```bash
npx awscfn delete-stack my-app-prod my-app-prod
```

If the stack doesn't exist, the command will exit with an error.  
If the names don't match, the deletion will be aborted.

> ⚠️ This is a destructive operation and cannot be undone.

## API Reference

> ⚠️ Requires AWS credentials to be configured in your shell or environment. [Start here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if you haven't already.

### 📦 `createStack(stackName: string, template: Template<P>): Promise<Stack>`

Creates a new CloudFormation stack using a change set and waits for it to complete or fail.

```ts
import { createStack } from 'awscfn';
import type { Template } from 'awscfn/sdk';

const template: Template<{ Env: string; AppName: string }> = {
  body: myTemplateString,
  params: {
    Env: 'prod',
    AppName: 'my-app',
  },
};

await createStack('my-stack', template);
```

#### Arguments

- `stackName`: The name of the CloudFormation stack.
- `template`: A `Template<P>`, where `P` is the shape of the parameters.
  - If a string is passed, it is treated as the raw CloudFormation template body.
  - If an object is passed, it must contain:
    - `body`: string (CloudFormation template)
    - `params`: a plain object of parameters matching your template.

#### Behavior

- Creates a **change set** and executes it.
- Waits for the stack to reach a terminal state (`CREATE_COMPLETE`, or an error).
- Returns the resulting `Stack` from the AWS SDK.

#### Error Handling

Throws a `StackCreateFailure` if:

- The change set fails to create or execute
- The stack enters a failure state (e.g. `ROLLBACK_COMPLETE`)

The error includes useful context:

```ts
{
  stackName: string;
  stackId?: string;
  status?: StackStatus;
  params?: TemplateParams;
  sdkError?: Error;
}
```

### 🔁 `updateStack(existingStack: Stack, template: Template<P>): Promise<Stack>`

Updates a CloudFormation stack using a change set and waits for it to complete.

```ts
import {updateStack, getStackByName} from 'awscfn';

const existing = await getStackByName('my-stack');

if (existing) {
  await updateStack(existing, {
    body: myTemplateString,
    params: {
      Env: 'prod',
      AppName: 'my-app',
    },
  });
}
```

#### Arguments

- `existingStack`: A `Stack` object returned from AWS (e.g. from `describeStacks`). The stack must already exist and be in a terminal state.
- `template`: A `Template<P>` object — either:
  - A raw template string
  - Or `{ body: string, params: P }`

#### Behavior

- Fails immediately if the stack is **not in a terminal state**
- If the stack is in `ROLLBACK_COMPLETE`, it:
  - Deletes the stack
  - Re-creates it using the same template (via `createStack`)
- Otherwise:
  - Creates and executes an **update-type change set**
  - Waits for the stack to reach a terminal state
  - Returns the resulting `Stack` object

#### Error Handling

If the update fails, a `StackUpdateFailure` is thrown with helpful context:

```ts
{
  stackName: string;
  originalStack: Stack;
  terminalStack: Stack;
  status?: StackStatus;
  sdkError?: Error;
}
```

> ℹ️ Requires AWS credentials in your environment (`AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, etc.).

> ✅ This function ensures safety by skipping updates for in-progress stacks and gracefully recovering from `ROLLBACK_COMPLETE` states.

## Contributing

- ⭐ Star this repo if you like it!
- 🐛 Open an [issue](https://github.com/mhweiner/awscfn/issues) for bugs or suggestions.
- 🤝 Submit a PR to `main` — all tests must pass.

## Related Projects

- [autorel](https://github.com/mhweiner/autorel): Automate semantic releases based on conventional commits.
- [hoare](https://github.com/mhweiner/hoare): A fast, defensive test runner for JS/TS.
- [jsout](https://github.com/mhweiner/jsout): A minimal logger for JS/TS, syslog-style.
- [brek](https://github.com/mhweiner/brek): Typed config loader for dynamic, secret-based configs.
- [pgsmith](https://github.com/mhweiner/pgsmith): A SQL builder for parameterized queries in PostgreSQL.