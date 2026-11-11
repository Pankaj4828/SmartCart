# AWS EKS Documentation

This directory documents the AWS extension. Local KIND setup remains in the existing guides under `docs/`.

## Guides
1. [Terraform setup](terraform-setup.md) — bootstrap, remote state, modules, OIDC and cleanup.
2. [EKS deployment](eks-deployment.md) — cluster, managed nodes, Pod Identity, EBS CSI and storage.
3. [AWS Helm configuration](helm-configuration.md) — AWS-specific SmartCart chart values.
4. [AWS observability](observability.md) — Metrics Server, Prometheus, Grafana and Tempo.
5. [GitOps and secrets](gitops-and-secrets.md) — Argo CD, Vault and Vault Secrets Operator.

## Repository locations
- Terraform: `terraform/`
- AWS Kubernetes configuration: `kubernetes/aws/`
- SmartCart chart: `helm/smartcart/`
- Argo CD Applications: `argocd/`

## Current status
The AWS configuration exists in the repository, but the previous EKS environment was destroyed after testing. Treat deployment as pending until infrastructure is recreated and runtime checks pass.

## Suggested deployment order
1. Review and apply Terraform only after explicit approval.
2. Verify EKS, Pod Identity Agent and EBS CSI.
3. Apply and verify the `gp3` StorageClass.
4. Ensure Argo CD is installed.
5. Deploy Metrics Server and observability components.
6. Deploy Vault, initialize/configure it, then deploy VSO.
7. Deploy SmartCart after storage and secret prerequisites are ready.
8. Verify application health, metrics, traces and secret synchronization.
