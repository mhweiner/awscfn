# Manual Setup Items

The following is an inexhaustive list of manually managed items. These items are either created via the Console, CLI, using the helper scripts, or are managed by the `aws` package via CloudFormation templates.

    🐭 Click-ops: These items are created via the Console.
    🤖 Created via the `aws` package and managed by CloudFormation.

### VPC & Subnets 🐭

- Default, public subnets in `us-east-2a`, `us-east-2b`, and `us-east-2c`

### Domain, DNS, & TLS Certs 🐭

- *.public.equls.com -> "public" load balancer and "public" ECS Cluster

### EC2 Instance Keypairs 🐭

This allows SSH access to EC2 instances via the default `ec2-user`. These users will need to be in the SSH security group to have access.

- Keypair: `public-ec2-keypair`, pem stored in Secrets Manager `public-ec2-keypair.pem`

### SSH Security Groups 🐭

An SSH group that permits inbound SSH access on certain IP addresses.

- `sg-0f6457b63fcfa4e8c`

### SNS Topics 🐭

- `arn:aws:sns:us-east-2:905418324674:alarms` An SNS topic for infrastructure alarms to be published on.

### GitHub Actions Integration 🐭

- OIDC Identity Provider: `arn:aws:iam::905418324674:oidc-provider/token.actions.githubusercontent.com`
- Role: `arn:aws:iam::905418324674:role/github-actions`

### Load Balancers 🤖

The listener rule priorities 1000-1999 are reserved for ECS services deployed via `aws` package and are automatically assigned during initial deployment.

| Stack Template | Stack Name | Resource Name |
| --- | --- | --- |
| public-alb | iac-alb-public | public |

### ECS Clusters 🤖

| Stack Template | Stack Name | Resource Name |
| --- | --- | --- |
| cluster | iac-cluster-public | public |