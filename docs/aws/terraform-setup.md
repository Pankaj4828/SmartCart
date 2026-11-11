# AWS Terraform Setup

## Layout
- `terraform/bootstrap/` creates the S3 bucket used for remote state.
- `terraform/environments/dev/` composes the development environment.
- `terraform/modules/eks/` defines EKS, its managed node group and add-ons.
- `terraform/modules/iam/` defines GitHub Actions OIDC trust and role permissions.

## Prerequisites
- AWS CLI credentials for the intended account.
- Terraform.
- A unique S3 state bucket name.
- The current public IP in `/32` format for the EKS public API allowlist.
- Permission to create the resources shown in the plan.

Verify identity:
```bash
aws sts get-caller-identity
```

## Bootstrap and backend
Bootstrap initially uses local state; protect that state file. The remote backend is configured for S3 versioning, server-side encryption, public access blocking and native S3 state locking with `use_lockfile = true`.

Create local files from the examples and edit them:
```bash
cp terraform/environments/dev/backend.hcl.example terraform/environments/dev/backend.hcl
cp terraform/environments/dev/terraform.tfvars.example terraform/environments/dev/terraform.tfvars
```

Do not commit these local files.

Validate and review bootstrap:
```bash
terraform -chdir=terraform/bootstrap init
terraform -chdir=terraform/bootstrap validate
terraform -chdir=terraform/bootstrap plan
```

After reviewing and approving the bootstrap plan, create the bucket. Then initialize and validate the dev environment:
```bash
terraform -chdir=terraform/environments/dev init -backend-config=backend.hcl
terraform -chdir=terraform/environments/dev validate
terraform -chdir=terraform/environments/dev plan -var-file=terraform.tfvars
```

Review the entire plan before applying.

## Development environment
The dev configuration discovers the default VPC and default subnets. It passes the subnet IDs, Kubernetes version, worker instance type and EKS public endpoint CIDRs to the EKS module. The intended cluster name is `smartcart-dev`; the selected worker instance type is `t3.medium`. Confirm the actual variable values and region in the current environment configuration before deployment.

The EKS API endpoint has private and public access enabled; public access is restricted by the configured CIDR list.

## GitHub Actions OIDC
The IAM module creates an OIDC provider for `https://token.actions.githubusercontent.com`. The dev environment configures trust for repository `Pankaj4828/SmartCart` branches `main` and `terra-aws`.

An EKS access entry and `AmazonEKSEditPolicy` association are configured with namespace scope `smartcart-gitops`. The role also receives `eks:DescribeCluster` for the configured cluster.

After deployment, retrieve the role ARN:
```bash
terraform -chdir=terraform/environments/dev output -raw github_actions_role_arn
```

Configure the required GitHub repository variables before testing the workflow. Verify actual workflow permissions before considering automated deployment complete.

## Protect local files
Do not commit Terraform state, state backups, local `.tfvars`, `backend.hcl` or saved plan files.

## Cost and cleanup
EKS control planes, EC2 worker nodes and EBS volumes can incur charges. After approved testing, review the destroy plan and run:
```bash
terraform -chdir=terraform/environments/dev destroy -var-file=terraform.tfvars
```

Keep the S3 state bucket while remote state is still needed. Check the AWS account for remaining billable resources after cleanup. Never apply or destroy without checking identity, region, variables and plan.
