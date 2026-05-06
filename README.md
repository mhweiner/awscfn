<picture>
    <source srcset="docs/awscfn-logo-light.svg" media="(prefers-color-scheme: light)">
    <source srcset="docs/awscfn-logo-dark.svg" media="(prefers-color-scheme: dark)">
    <img src="docs/awscfn-logo-light.svg" alt="awscfn" width="200">
</picture>

[![build status](https://github.com/mhweiner/awscfn/actions/workflows/release.yml/badge.svg)](https://github.com/mhweiner/awscfn/actions)
[![SemVer](https://img.shields.io/badge/SemVer-2.0.0-blue)]()
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![AutoRel](https://img.shields.io/badge/%F0%9F%9A%80%20AutoRel-2D4DDE)](https://github.com/mhweiner/autorel)

Deploy CloudFormation stacks without the usual suffering.

## Why awscfn?

If you've deployed CloudFormation stacks, you know the pain:

- You run `aws cloudformation create-stack` and get... nothing. Is it working? Who knows.
- You open the AWS console, hit refresh, scroll through events, trying to find the one that matters.
- It fails. The error says "Resource creation cancelled." The *actual* reason is buried somewhere in the event log.
- The stack is stuck in `ROLLBACK_COMPLETE`. Now you have to delete it manually before you can try again.
- Your CI job times out or exits 0 even though the deploy failed.
- You write a parameter file and remember: oh right, CloudFormation wants *that* JSON format.

**awscfn fixes this.**

- **Watch deploys happen** — Stack events stream to your terminal in real time. No refreshing. No second window.
- **See why it failed** — When a deploy fails, you get the actual failure reason, not "Resource creation cancelled."
- **Recover automatically** — Stuck in `ROLLBACK_COMPLETE`? awscfn detects it and re-creates the stack for you.
- **YAML params** — Simple YAML parameter files. No more verbose JSON.
- **CI that works** — Auto-detects CI environments. Exits non-zero when deploys fail. Compact output mode.
- **CLI + TypeScript SDK** — Use from the command line or import directly into Node.js/TypeScript projects.

It's not a CDK. It's not a framework. It's just a better way to deploy raw CloudFormation.

## Installation

**Global install** (recommended for CLI use):

```bash
npm i -g awscfn
```

Then run commands directly: `awscfn create-stack ...`

**Project dependency** (for SDK/library use):

```bash
npm i awscfn
```

**npx** (no install):

```bash
npx awscfn create-stack ...
```

## CLI commands

> ⚠️ Requires AWS credentials to be configured in your shell or environment. [Start here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if you haven't already.

### Global Options

| Flag | Description |
|------|-------------|
| `--ci`, `-C` | CI mode (compact output). Auto-detected when `CI=true` or `GITHUB_ACTIONS=true`. |
| `--no-color`, `-N` | Disable colored output |
| `--verbose`, `-V` | Show full error details on failure |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version |

Run `awscfn --help` or `awscfn <command> --help` for full CLI usage.

### Shell Completion

```bash
source <(awscfn completion)
```

Add to your shell config (e.g. `~/.zshrc`) for command and file-path completion.

### Event Streaming

During stack operations, awscfn streams CloudFormation stack events in real-time (resource create/update/delete progress):

```
→ Updating stack my-stack
  ● Creating changeset (update)
  … Waiting for changeset to be ready...
  ● Executing changeset...
    ● SomeResource / MyResource — update in progress
    ✓ SomeResource / MyResource — update complete
  ✓ Stack reached update complete (45s)
✓ Stack my-stack updated successfully
```

When a failure occurs, the error message includes the actual reason from CloudFormation events.

### 📋 list-stacks

List all CloudFormation stacks in the current region (name, status, creation date).

```bash
awscfn list-stacks
```

### 🚀 create-stack

```bash
awscfn create-stack -n <STACK_NAME> -t <TEMPLATE_FILE> -p <PARAMS_FILE>
```

| Flag | Description |
|------|-------------|
| `--name`, `-n` | Stack name |
| `--template`, `-t` | CloudFormation template file |
| `--params`, `-p` | Parameters file (YAML) |
| `--set`, `-s` | Override one or more parameters (repeatable `Key=Value`) |

### ⬆️ update-stack

```bash
awscfn update-stack -n <STACK_NAME> -t <TEMPLATE_FILE> -p <PARAMS_FILE>
```

| Flag | Description |
|------|-------------|
| `--name`, `-n` | Stack name |
| `--template`, `-t` | CloudFormation template file |
| `--params`, `-p` | Parameters file (YAML) |
| `--set`, `-s` | Override one or more parameters (repeatable `Key=Value`). You can omit `--params` to override only specific values on an existing stack. |
| `--create` | If the stack doesn't exist, create it (instead of erroring) |
| `-m` | Shorthand for `--create` |

If there are no changes to apply, the command succeeds gracefully:
```
✓ Stack my-stack is up to date (no changes)
```

### 👁️ preview-stack

Builds a change set (same capabilities as deploy), prints a **table of planned resource-level changes**, then **deletes** the change set without executing it. If the stack exists, uses an **UPDATE** change set; otherwise **CREATE**.

```bash
awscfn preview-stack -n <STACK_NAME> -t <TEMPLATE_FILE> -p <PARAMS_FILE>
```

| Flag | Description |
|------|-------------|
| `--name`, `-n` | Stack name |
| `--template`, `-t` | CloudFormation template file |
| `--params`, `-p` | Parameters file (YAML) |
| `--set`, `-s` | Override one or more parameters (repeatable `Key=Value`) |

Use this to review Add / Modify / Remove actions (and replacement hints) before running **`create-stack`** or **`update-stack`**.

If the stack is **`ROLLBACK_COMPLETE`**, **`update-stack`** would delete and recreate it — **`preview-stack` cannot model that path** and exits with an error (delete the stack or run **`update-stack`** first).

Non-resource change-set entries (for example hooks) are counted and noted when they are not shown as table rows.

### ♻️ redeploy-stack

```bash
awscfn redeploy-stack -n <STACK_NAME> -t <TEMPLATE_FILE>
```

| Flag | Description |
|------|-------------|
| `--name`, `-n` | Stack name |
| `--template`, `-t` | CloudFormation template file |

Redeploys using the existing stack's parameters. Useful for updating a stack with a new template without re-specifying params, or re-deploying after a failed create.

### 🗑️ delete-stack

Deletes a CloudFormation stack with a confirmation safeguard.

```bash
awscfn delete-stack -n <STACK_NAME> -c <STACK_NAME>
```

| Flag | Description |
|------|-------------|
| `--name`, `-n` | Stack name |
| `--confirm`, `-c` | Repeat stack name to confirm |

`--confirm` must match `--name` exactly to prevent accidental deletion.

**Example:**

```bash
awscfn delete-stack -n my-app-prod -c my-app-prod
```

If the stack doesn't exist, the command will exit with an error.  
If the names don't match, the deletion will be aborted.

> ⚠️ This is a destructive operation and cannot be undone.

## API Reference

> ⚠️ Requires AWS credentials to be configured in your shell or environment. [Start here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) if you haven't already.

### Nested stacks and IAM

Change sets request **`CAPABILITY_NAMED_IAM`** and **`CAPABILITY_AUTO_EXPAND`**, so stacks that define named IAM resources or **nested stacks** (including templates from [`aws cloudformation package`](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/package.html)) work with **`create-stack`** / **`update-stack`** / **`preview-stack`** and the SDK `createStack` / `updateStack` / `previewChangeSet` helpers.

### 📋 `listStacks(): Promise<StackSummary[]>`

Returns all CloudFormation stacks in the current region (paginated). Excludes deleted stacks (`DELETE_COMPLETE`, `DELETE_IN_PROGRESS`) via `StackStatusFilter`. Each item is an AWS SDK `StackSummary` (e.g. `StackName`, `StackStatus`, `CreationTime`).

```ts
import { listStacks } from 'awscfn';

const stacks = await listStacks();
for (const s of stacks) {
  console.log(s.StackName, s.StackStatus);
}
```

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

### 👁️ `previewChangeSet(stackName, template, operation)` / `previewStack(...)`

**SDK:** Build a change set, print a colored table of planned resource changes (Add / Modify / Remove, replacement hints), then delete the change set — **without** executing it. Same capabilities as deploy (`CAPABILITY_NAMED_IAM`, `CAPABILITY_AUTO_EXPAND`).

```ts
import { initCloudFormationClient, previewChangeSet } from 'awscfn';

initCloudFormationClient();

await previewChangeSet('my-stack', {
  body: templateString,
  params: { Env: 'prod' },
}, 'UPDATE');
```

**CLI:** Prefer `awscfn preview-stack -n … -t … -p …`, which picks **CREATE** vs **UPDATE** from whether the stack exists (same idea as deploy). Refuses **`ROLLBACK_COMPLETE`** stacks (same recovery path as **`update-stack`**: delete + create).

Table output lives in **`lib/formatChangeSet`** (shared formatting, not CLI-only).

## Contributing

- Open an [issue](https://github.com/mhweiner/awscfn/issues) for bugs or suggestions
- Submit a PR to `main` — all tests must pass

## License

MIT