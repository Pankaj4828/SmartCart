# AWS Terraform Setup

## 1. Bootstrap

The `terraform/bootstrap` directory creates the S3 bucket used to store
Terraform state files.

We run bootstrap first because the S3 bucket must exist before other
Terraform configurations can use it as a remote backend.

## 2. Remote Backend

The development environment will store its Terraform state in S3.

We will enable:
- S3 bucket versioning to help recover previous state versions.
- Server-side encryption to protect stored state.
- Public access blocking to prevent public access to the bucket.
- Native S3 state locking using `use_lockfile = true`.

## 3. State Management

Bootstrap initially uses local state. Keep its state file safe.

The development environment will use a separate S3 state key.
Staging and production will have separate state keys if we use them later.

## 4. Deployment Rules

- Create AWS infrastructure using Terraform.
- Do not create AWS infrastructure manually in the console.
- Test the development environment first.
- Destroy temporary infrastructure after testing.
- Keep the Terraform state bucket so the remote state remains available.

## 5. Cost Awareness

EKS and its worker nodes can incur charges while running.
Review the Terraform plan before applying it, and destroy temporary
infrastructure when testing is complete.

## 6. Prerequisites

- AWS CLI configured with valid credentials.
- Terraform installed.
- A unique S3 bucket name for Terraform state.
- A public IP address to restrict access to the EKS API.

Verify AWS credentials before creating resources:

    aws sts get-caller-identity

Do not proceed with AWS deployment if this command fails.

## 7. Development Environment

1. Create the state bucket using `terraform/bootstrap`.
2. Copy `terraform/environments/dev/backend.hcl.example` to `backend.hcl`.
3. Replace the example bucket name with the actual state bucket name.
4. Copy `terraform/environments/dev/terraform.tfvars.example` to `terraform.tfvars`.
5. Replace the example API access CIDR with your public IP in `/32` format.
6. Initialize, validate, and review the Terraform plan before applying.

Example commands:

    terraform -chdir=terraform/bootstrap init
    terraform -chdir=terraform/bootstrap validate
    terraform -chdir=terraform/bootstrap plan

After reviewing the bootstrap plan, apply it to create the state bucket.

Initialize the development environment with the S3 backend:

    terraform -chdir=terraform/environments/dev init \
      -backend-config=backend.hcl

Validate and review the development plan before applying:

    terraform -chdir=terraform/environments/dev validate
    terraform -chdir=terraform/environments/dev plan \
      -var-file=terraform.tfvars

The current configuration uses the default VPC and default subnets.
Confirm that suitable subnets exist in at least two Availability Zones and
that the selected Kubernetes version is supported by AWS.

## 8. GitHub Actions OIDC

The IAM module configures a GitHub Actions role trusted by the
`Pankaj4828/SmartCart` repository's `main` branch.

The development environment connects the role to EKS and associates
`AmazonEKSEditPolicy` with the `smartcart` namespace.

After applying Terraform, retrieve the role ARN with:

    terraform -chdir=terraform/environments/dev output \
      -raw github_actions_role_arn

Use this ARN when configuring the GitHub Actions deployment workflow.
The OIDC role must be tested against the actual Helm chart and its required
Kubernetes permissions before automated deployment is considered complete.

## 9. Cost and Cleanup

EKS control planes, worker nodes, load balancers, and storage can incur
charges. Review every plan before applying it.

After temporary testing, destroy the development resources:

    terraform -chdir=terraform/environments/dev destroy \
      -var-file=terraform.tfvars

Keep the S3 state bucket while remote state is needed. Check for remaining
billable resources after cleanup.

## 10. Current Status

- Terraform configurations have passed local formatting and validation.
- AWS deployment is pending working AWS credentials.
- Live EKS provisioning and GitHub Actions OIDC deployment have not yet
  been confirmed.
- Staging and production Terraform environments are not implemented.
