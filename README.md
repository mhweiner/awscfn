# awscfn

**awscfn** is a lightweight CLI and TypeScript SDK for managing AWS CloudFormation stacks. It simplifies common actions like create, update, redeploy, and delete, and makes working with parameters painless by supporting clean, readable YAML files. Use it in your shell scripts or directly from Node.js projects to streamline CloudFormation workflows.

## CLI commands

You must first authenticate via aws cli or export keys into shell.

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

## Contributing

- ⭐ Star this repo if you like it!
- 🐛 Open an [issue](https://github.com/mhweiner/idkitx/issues) for bugs or suggestions.
- 🤝 Submit a PR to `main` — all tests must pass.

## Related Projects

- [autorel](https://github.com/mhweiner/autorel): Automate semantic releases based on conventional commits.
- [hoare](https://github.com/mhweiner/hoare): A fast, defensive test runner for JS/TS.
- [jsout](https://github.com/mhweiner/jsout): A minimal logger for JS/TS, syslog-style.
- [brek](https://github.com/mhweiner/brek): Typed config loader for dynamic, secret-based configs.
- [pgsmith](https://github.com/mhweiner/pgsmith): A SQL builder for parameterized queries in PostgreSQL.