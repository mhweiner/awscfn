<picture>
    <source srcset="docs/awscfn-logo-light.svg" media="(prefers-color-scheme: light)">
    <source srcset="docs/awscfn-logo-dark.svg" media="(prefers-color-scheme: dark)">
    <img src="docs/awscfn-logo-light.svg" alt="awscfn" width="200">
</picture>

[![build status](https://github.com/mhweiner/awscfn/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/awscfn/actions)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![AutoRel](https://img.shields.io/badge/%F0%9F%9A%80%20AutoRel-2D4DDE)](https://github.com/mhweiner/autorel)

CLI and TypeScript SDK for managing AWS CloudFormation stacks.

## Why awscfn?

- **Simple YAML parameters** — No more wrestling with verbose JSON. Just clean, readable YAML files.
- **See what's happening** — Real-time event streaming shows you exactly what CloudFormation is doing instead of waiting blindly.
- **Errors that make sense** — When deploys fail, you get the actual error message from CloudFormation, not a cryptic timeout.
- **CI/CD friendly** — Works great in GitHub Actions with auto-detected CI mode.
- **CLI & SDK** — Use from command line or import directly in Node.js/TypeScript projects.

## CLI commands

> ⚠️ Requires AWS credentials to be configured in your shell or environment. [Start here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if you haven't already.

### Global Options

| Flag | Short | Description |
|------|-------|-------------|
| `--ci` | — | Run in CI mode (minimal output, no colors). Auto-detected when `CI=true` or `GITHUB_ACTIONS=true`. |
| `--no-color` | `-N` | Disable colored output |
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |

### Shell Completion

**zsh (recommended):**

```bash
# Add to ~/.zshrc — path to package (e.g. after npm link or global install):
source $(dirname $(which awscfn))/../completions/zsh
```

**All shells** — built-in (file paths; may add a space after directories):

```bash
source <(awscfn completion)
```

### Event Streaming

During stack operations, awscfn streams CloudFormation events in real-time:

```
→ Updating stack my-service-stack
  ● Creating changeset (update)
  … Waiting for changeset to be ready...
  ● Executing changeset...
    ● ECS/TaskDefinition / TaskDef — update in progress
    ✓ ECS/TaskDefinition / TaskDef — update complete
    ● ECS/Service / MyService — update in progress
    ✓ ECS/Service / MyService — update complete
  ✓ Stack reached update complete (45s)
✓ Stack my-service-stack updated successfully
```

When a failure occurs, the error message includes the actual reason from CloudFormation events.

### 🚀 create-stack

```bash
npx awscfn create-stack -n <STACK_NAME> -t <TEMPLATE_FILE> -p <PARAMS_FILE>
```

| Flag | Short | Description |
|------|-------|-------------|
| `--name` | `-n` | Stack name |
| `--template` | `-t` | CloudFormation template file |
| `--params` | `-p` | Parameters file (YAML) |

### ⬆️ update-stack

```bash
npx awscfn update-stack -n <STACK_NAME> -t <TEMPLATE_FILE> -p <PARAMS_FILE>
```

| Flag | Short | Description |
|------|-------|-------------|
| `--name` | `-n` | Stack name |
| `--template` | `-t` | CloudFormation template file |
| `--params` | `-p` | Parameters file (YAML) |

If there are no changes to apply, the command succeeds gracefully:
```
✓ Stack my-stack is up to date (no changes)
```

### ♻️ redeploy-stack

```bash
npx awscfn redeploy-stack -n <STACK_NAME> -t <TEMPLATE_FILE>
```

| Flag | Short | Description |
|------|-------|-------------|
| `--name` | `-n` | Stack name |
| `--template` | `-t` | CloudFormation template file |

Redeploys using the existing stack's parameters. Useful for updating a stack with a new template without re-specifying params, or re-deploying after a failed create.

### 🗑️ delete-stack

Deletes a CloudFormation stack with a confirmation safeguard.

```bash
npx awscfn delete-stack -n <STACK_NAME> -c <STACK_NAME>
```

| Flag | Short | Description |
|------|-------|-------------|
| `--name` | `-n` | Stack name |
| `--confirm` | `-c` | Repeat stack name to confirm |

`-c` must match `-n` exactly to prevent accidental deletion.

**Example:**

```bash
npx awscfn delete-stack -n my-app-prod -c my-app-prod
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
  failureReason?: string;  // The actual error from CloudFormation events
}
```

The error message itself includes the failure reason when available:

```
💥 Failed to create stack my-stack

Reason: CannotPullContainerError: repository does not exist
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
- If there are **no changes** to apply:
  - Returns the existing stack immediately (no error)
  - Outputs: `✓ Stack my-stack is up to date (no changes)`
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
  failureReason?: string;  // The actual error from CloudFormation events
}
```

The error message itself includes the failure reason when available:

```
💥 Failed to update stack my-stack

Reason: Resource handler returned message: "CannotPullContainerError: image not found"
```

> ℹ️ Requires AWS credentials in your environment (`AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, etc.).

> ✅ This function ensures safety by skipping updates for in-progress stacks and gracefully recovering from `ROLLBACK_COMPLETE` states.

## Contributing

- Open an [issue](https://github.com/mhweiner/awscfn/issues) for bugs or suggestions
- Submit a PR to `main` — all tests must pass

## License

MIT