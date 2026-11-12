# SmartCart AWS Phase 3 — Deployment, Verification, and Teardown Runbook

**Project:** SmartCart
**AWS account:** `633160613422`
**AWS region:** `us-west-2`
**EKS cluster:** `smartcart-dev`
**Kubernetes version:** `1.34`
**Terraform environment:** `terraform/environments/dev`
**Git branch used:** `terra-aws`

> **Accuracy note:** This runbook is based on the SmartCart Phase 3 conversation and command output available in the project history. Commands explicitly visible in the history are marked as recorded or confirmed. Where the conversation confirms an operation but does not preserve the exact command line, that limitation is stated rather than inventing a command history.

## 1. Phase 3 scope

Terraform-managed AWS resources:
- EKS cluster `smartcart-dev`
- EKS managed node group `smartcart-dev-workers` with four `t3.small` nodes
- EKS Pod Identity Agent and EBS CSI Driver add-ons
- EKS cluster/node IAM roles and EBS CSI IAM role/policy
- GitHub Actions OIDC provider and deployment role
- EKS access entry and namespace-scoped access policy for GitHub Actions

Kubernetes/Helm/Argo CD workloads:
- Argo CD (installed manually using Helm)
- `metrics-server`
- Monitoring: Prometheus, Grafana, kube-state-metrics and Node Exporter
- Tempo
- Vault and Vault Secrets Operator (VSO)
- SmartCart frontend, backend, PostgreSQL and Ollama in `smartcart-gitops`

The AWS Helm values had `ingress.enabled: false`. The frontend was verified through port-forwarding; no public ALB/Ingress endpoint was part of the confirmed test.

## 2. Repository and directories

```bash
cd ~/projects/SmartCart
cd ~/projects/SmartCart/terraform/environments/dev
```

Bootstrap is separate:

```bash
cd ~/projects/SmartCart/terraform/bootstrap
```

**Do not destroy `terraform/bootstrap` or the remote-state S3 bucket.** The observed bucket was:

```text
smartcart-terraform-state-633160613422-us-west-2
```

The local `backend.hcl` was environment-specific and kept out of Git. Terraform state/plan files and secrets were also excluded from Git.

## 3. AWS identity and region

```bash
aws sts get-caller-identity
aws configure get region
```

Account: `633160613422`
Region: `us-west-2`

The GitHub Actions validation job also used `aws sts get-caller-identity` before attempting `aws eks describe-cluster`.

## 4. Terraform pre-deployment checks

Run from `terraform/environments/dev`:

```bash
terraform init -backend-config=backend.hcl
terraform fmt -recursive
terraform validate
terraform plan
```

A reviewed plan at one point reported:

```text
No changes. Your infrastructure matches the configuration.
```

That was the result against the state at that time; a fresh environment's plan will differ.

Review the EKS cluster/node group, endpoint CIDRs, EBS CSI/Pod Identity, GitHub OIDC trust, EKS access entry/policy, and backend configuration before applying.

## 5. EKS kubeconfig and access checks

The cluster was `smartcart-dev` in `us-west-2`, Kubernetes 1.34.

Repeatable command for a recreated cluster:

```bash
aws eks update-kubeconfig --region us-west-2 --name smartcart-dev
kubectl cluster-info
kubectl get nodes -o wide
kubectl get namespaces
```

The managed node group had four `t3.small` nodes. A scheduling limitation was observed: maximum pod capacity was 11 per node in this setup. This contributed to one Node Exporter pod remaining Pending while three were healthy.

## 6. EKS public endpoint IP-change issue

### What happened

The EKS public API endpoint was restricted to the user's public IP with a `/32` CIDR. When the ISP/public IP changed, the old allow-list entry no longer matched. `kubectl` and Helm could then lose access even though EKS itself was healthy.

### Inspect current endpoint settings

```bash
aws eks describe-cluster \
  --name smartcart-dev \
  --region us-west-2 \
  --query 'cluster.resourcesVpcConfig.{Public:endpointPublicAccess,Private:endpointPrivateAccess,AllowedCIDRs:publicAccessCidrs}' \
  --output table
```

### Get the current public IPv4

```bash
curl -4 https://checkip.amazonaws.com
```

Use the returned address followed by `/32`. Do not use a sample IP from documentation.

### Update the allow-list

First inspect whether `endpointPrivateAccess` is `true` or `false` using the describe command. Then replace `CURRENT_PUBLIC_IP` below and preserve the inspected private-endpoint setting:

```bash
aws eks update-cluster-config \
  --name smartcart-dev \
  --region us-west-2 \
  --resources-vpc-config endpointPublicAccess=true,endpointPrivateAccess=true,publicAccessCidrs=CURRENT_PUBLIC_IP/32
```

If the inspected private endpoint setting is `false`, use `endpointPrivateAccess=false` instead. Do not use `0.0.0.0/0` as a workaround.

Check the resulting configuration:

```bash
aws eks describe-cluster \
  --name smartcart-dev \
  --region us-west-2 \
  --query 'cluster.{Status:status,Access:resourcesVpcConfig}' \
  --output json
kubectl get nodes
```

AWS may take time to apply the endpoint configuration before `kubectl` works again.

### Repeatable improvement discussed

A local helper script such as `scripts/update-eks-access.sh` was discussed to fetch the current public IPv4, append `/32`, and update the EKS allow-list while preserving the private endpoint setting. The available conversation does **not** establish that this script was implemented or committed.

If implementing it later, it must:
1. Fetch the current public IPv4.
2. Add `/32`.
3. Read current EKS endpoint access settings.
4. Preserve the current private endpoint setting.
5. Update only the intended CIDR allow-list.
6. Never open the endpoint to `0.0.0.0/0`.

The exact Terraform variable name for the CIDR list was not preserved in the available history; inspect the current module variables before changing Terraform.

## 7. Install Argo CD using Helm

Argo CD was installed manually using Helm in namespace `argocd`.

**Recorded commands:**

```bash
kubectl create namespace argocd
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd \
  --namespace argocd \
  --version 10.17.1 \
  --wait \
  --timeout 10m
```

Repeatable verification:

```bash
helm list -n argocd
kubectl get pods -n argocd -o wide
kubectl get svc -n argocd
```

### Argo CD port-forward

Local port `8080` was already occupied, so port `8081` was used.

```bash
kubectl port-forward -n argocd svc/argocd-server 8081:443
```

Run the port-forward in a separate terminal and browse to `https://localhost:8081`. The exact browser/login command is not retained in the available history.

## 8. Argo CD Applications and status

Applications deployed:
- `metrics-server`
- `monitoring`
- `tempo`
- `vault`
- `vault-secrets-operator`
- `smartcart-eks`

Repeatable checks:

```bash
kubectl get applications -n argocd
kubectl get applications -n argocd -o wide
kubectl get application smartcart-eks -n argocd -o yaml
kubectl describe application smartcart-eks -n argocd
```

Namespace workload checks:

```bash
kubectl get all -n smartcart-gitops
kubectl get all -n monitoring
kubectl get all -n tempo
kubectl get all -n vault
kubectl get all -n vault-secrets-operator
```

Recorded outcomes:
- `smartcart-eks`: Synced and Healthy.
- `tempo`: Synced and Healthy.
- `metrics-server`: Synced and Healthy.
- `vault`: deployed and unsealed.
- `vault-secrets-operator`: Running and healthy.
- Monitoring: Prometheus, Grafana and kube-state-metrics were healthy; one Node Exporter pod remained Pending due to pod-capacity pressure on a `t3.small` node. Three Node Exporter pods were healthy.

## 9. SmartCart Kubernetes / Helm verification

The AWS SmartCart workloads ran in namespace `smartcart-gitops`.

```bash
kubectl get pods -n smartcart-gitops -o wide
kubectl get deployments -n smartcart-gitops
kubectl get statefulsets -n smartcart-gitops
kubectl get services -n smartcart-gitops
kubectl get jobs -n smartcart-gitops
kubectl get hpa -n smartcart-gitops
```

Components verified:
- Frontend
- Backend
- PostgreSQL StatefulSet
- Ollama
- Database migration Job
- Backend HPA
- Services

The pods were confirmed Running, the migration Job was Complete, and `smartcart-eks` was Synced/Healthy.

### Logs and pod diagnosis

These are repeatable diagnostic commands; replace deployment/pod names if the chart changes:

```bash
kubectl describe pods -n smartcart-gitops
kubectl logs -n smartcart-gitops deployment/backend
kubectl logs -n smartcart-gitops deployment/frontend
kubectl logs -n smartcart-gitops POD_NAME
kubectl describe pod -n smartcart-gitops POD_NAME
```

### PostgreSQL and storage

```bash
kubectl get statefulset postgres -n smartcart-gitops
kubectl get pods -n smartcart-gitops
kubectl get pvc -n smartcart-gitops
kubectl get pv
```

A PostgreSQL EBS mount issue was fixed by adding this mount setting in `helm/smartcart/templates/postgres-statefulset.yaml`:

```yaml
subPath: postgres
```

The fix was committed as `bf077f6`. The PostgreSQL pod was recreated and subsequently reached Running.

### Database migration Job

```bash
kubectl get jobs -n smartcart-gitops
kubectl describe job -n smartcart-gitops smartcart-db-migration
kubectl logs -n smartcart-gitops job/smartcart-db-migration
```

The migration Job was observed Complete and Alembic migrations completed.

## 10. Vault and Vault Secrets Operator

Namespaces:
- `vault`
- `vault-secrets-operator`

Repeatable checks:

```bash
kubectl get pods -n vault -o wide
kubectl get pods -n vault-secrets-operator -o wide
kubectl get services -n vault
```

Configuration completed during the deployment:
- KV v2 mounted at `secret/`
- Kubernetes auth enabled/configured
- Token-review RBAC binding configured for service account `vault:vault`
- KV path `secret/smartcart`
- Vault policy `smartcart-policy`
- Vault role `smartcart-eks`
- Role bound to service account `smartcart-vault` in namespace `smartcart-gitops`
- VSO synchronized values into Kubernetes Secret `smartcart-secrets`

The secret included PostgreSQL credentials and a JWT signing key. Do not put secret values, root tokens, or unseal keys in this document, Git, or chat.

Verify the Kubernetes Secret without decoding its values:

```bash
kubectl get secret smartcart-secrets -n smartcart-gitops
kubectl describe secret smartcart-secrets -n smartcart-gitops
```

The conversation confirms the Vault configuration and successful secret synchronization, but does not preserve every exact Vault CLI command used to configure the auth method, policy, role, and KV data. Those commands are not fabricated here.

**Security:** Unseal keys and an initial/root token were pasted into the project conversation during troubleshooting. Treat those values as compromised and do not reuse them for production. Never commit or paste replacement keys/tokens into Git or documentation.

## 11. Monitoring / Tempo / Metrics Server

```bash
kubectl get pods -n monitoring -o wide
kubectl get services -n monitoring
kubectl get pods -n tempo -o wide
kubectl get services -n tempo
kubectl get pods -n kube-system | grep metrics-server
kubectl top nodes
kubectl top pods -A
```

`kubectl top` requires Metrics Server to be ready.

Known limitation: one Node Exporter pod remained Pending because a `t3.small` node had reached its pod-capacity limit (11 pods in this deployment). The other three Node Exporter pods were healthy.

## 12. End-to-end SmartCart test

The frontend was tested through Kubernetes port-forwarding. Local port `8082` was used:

```bash
kubectl port-forward -n smartcart-gitops svc/frontend 8082:80
```

Open:

```text
http://localhost:8082
```

The user confirmed the frontend loaded and worked.

During earlier local backend testing, the health endpoint returned:

```json
{"status":"healthy","service":"smartcart-backend"}
```

The root endpoint returned a welcome message. Products endpoints were tested with pagination and search, and PostgreSQL data was checked in the local Docker-based environment.

**Scope:** The confirmed AWS browser test was the frontend through port-forwarding. The AWS Helm values had ingress disabled; do not describe this as a public URL/ALB/Ingress test.

## 13. GitHub Actions OIDC validation

Role name:

```text
smartcart-dev-github-actions-deploy
```

Repository:

```text
Pankaj4828/SmartCart
```

The workflow used `aws-actions/configure-aws-credentials@v4`, `id-token: write`, account `633160613422`, region `us-west-2`, and role:

```text
arn:aws:iam::633160613422:role/smartcart-dev-github-actions-deploy
```

The workflow job was gated by repository variable `AWS_EKS_VALIDATION_ENABLED`. It was initially `false`, then enabled for a test.

The job failed at credential configuration:

```text
Could not assume role with OIDC: Not authorized to perform sts:AssumeRoleWithWebIdentity
```

The actual IAM trust policy was inspected. Its `sub` conditions included branches `main` and `terra-aws` for `Pankaj4828/SmartCart`, and audience `sts.amazonaws.com`. The failure was not resolved before teardown.

This OIDC failure was separate from the successful EKS deployment and application verification. Terraform destroy removed the GitHub OIDC provider and deployment role. The workflow remains in the repository, but AWS OIDC validation cannot work until those resources are recreated and the trust issue is fixed. Keep `AWS_EKS_VALIDATION_ENABLED` disabled until then.

## 14. Terraform destroy — complete sequence

The user intentionally chose to destroy the AWS Phase 3 environment, including persistent application data, with the intention of recreating it later.

### 14.1 Delete Argo CD Application objects

**Recorded command:**

```bash
kubectl delete applications --all -n argocd
```

### 14.2 Delete application/platform namespaces

**Recorded command:**

```bash
kubectl delete namespace \
  smartcart-gitops \
  tempo \
  vault \
  vault-secrets-operator \
  monitoring
```

The `argocd` namespace was not separately deleted in the recorded command. The EKS cluster deletion removed the remaining cluster resources.

### 14.3 Verify PVC/PV cleanup

**Recorded commands:**

```bash
kubectl get pvc -A
kubectl get pv
```

Both returned:

```text
No resources found
```

Four persistent data volumes were intentionally deleted:

| PVC | Purpose | Size |
|---|---|---:|
| `data-vault-0` | Vault data | 10 GiB |
| `postgres-data-postgres-0` | SmartCart PostgreSQL data | 2 GiB |
| `storage-tempo-0` | Tempo data | 5 GiB |
| `ollama-pvc` | Ollama data | 5 GiB |

Before namespace deletion, their PV reclaim policy was `Delete`. The EBS volumes had `KubernetesCluster=smartcart-dev` tags. After namespace deletion, the query for EBS volumes with that tag returned no output.

**Data-loss warning:** Vault, PostgreSQL, Tempo and Ollama persistent data were deleted intentionally.

### 14.4 Create and inspect the destroy plan

Run from the dev environment:

```bash
cd ~/projects/SmartCart/terraform/environments/dev
terraform plan -destroy -out=destroy.tfplan
terraform show destroy.tfplan
```

The reviewed plan contained **18 resources to destroy**, including the EKS cluster/node group, EKS add-ons, IAM roles/policies, GitHub OIDC resources and EKS access permissions.

The reviewed plan did not include the default VPC, subnets or Terraform remote-state S3 backend.

### 14.5 Apply the reviewed plan

**Recorded command:**

```bash
terraform apply destroy.tfplan
```

Terraform requested confirmation; the user approved.

### 14.6 Actual destroy result

**Recorded output:**

```text
Apply complete! Resources: 0 added, 0 changed, 18 destroyed.
```

Observed deletion times:
- EKS managed node group: 8 minutes 13 seconds
- EKS cluster: 3 minutes
- Terraform released the state lock successfully

The GitHub Actions access policy/entry, IAM role and policy, GitHub OIDC provider, EBS CSI add-on/association/role, Pod Identity Agent, node group, worker-node IAM role/policies and EKS cluster/cluster role were destroyed.

## 15. Post-destroy verification

### Terraform state

```bash
terraform state list
```

Observed: no output; the dev state had no remaining managed resources.

### EKS cluster

```bash
aws eks list-clusters --region us-west-2
```

Observed:

```json
{
    "clusters": []
}
```

### EC2 instances matching the EKS cluster tag

```bash
aws ec2 describe-instances \
  --region us-west-2 \
  --filters "Name=tag:eks:cluster-name,Values=smartcart-dev" \
            "Name=instance-state-name,Values=pending,running,stopping,stopped" \
  --query 'Reservations[].Instances[].{ID:InstanceId,State:State.Name,Type:InstanceType}' \
  --output table
```

Observed: no output.

### Available EBS volumes

```bash
aws ec2 describe-volumes \
  --region us-west-2 \
  --filters "Name=status,Values=available" \
  --query 'Volumes[].{ID:VolumeId,Size:Size,Created:CreateTime}' \
  --output table
```

Observed: no output.

### Load balancers

```bash
aws elbv2 describe-load-balancers \
  --region us-west-2 \
  --query 'LoadBalancers[].{Name:LoadBalancerName,State:State.Code,Type:Type}' \
  --output table
```

Observed: no output.

### NAT gateways

```bash
aws ec2 describe-nat-gateways \
  --region us-west-2 \
  --filter "Name=state,Values=pending,available,deleting" \
  --query 'NatGateways[].{ID:NatGatewayId,State:State}' \
  --output table
```

Observed: no output.

### S3 remote-state bucket

```bash
aws s3 ls
```

Observed bucket:

```text
smartcart-terraform-state-633160613422-us-west-2
```

The remote-state bucket was preserved; Terraform bootstrap was not destroyed.

> The EC2/EBS/ELB/NAT commands returned no rows in the user's terminal. These checks were limited to the specified filters/queries; they are not a full audit of every AWS service in the account.

## 16. Future recreation sequence

When recreating Phase 3, follow this order. Do not run it during teardown.

1. Check AWS identity, region and current public IP.
2. Confirm the Terraform bootstrap S3 backend still exists.
3. Initialize and validate `terraform/environments/dev`.
4. Review EKS endpoint CIDR restrictions and GitHub OIDC trust conditions.
5. Run `terraform plan` and inspect the complete plan.
6. Apply Terraform to create EKS and supporting IAM/add-on resources.
7. Update kubeconfig and verify nodes.
8. Install Argo CD using the recorded Helm chart/version.
9. Apply/sync the Argo CD Applications.
10. Verify Metrics Server, monitoring, Tempo, Vault and VSO.
11. Configure Vault/VSO without exposing secrets.
12. Verify PostgreSQL, backend, frontend, Ollama and migration Job.
13. Test the frontend through port-forwarding and validate backend/database behavior.
14. Resolve and test GitHub Actions OIDC before enabling its workflow validation variable.
15. Review cost and teardown steps before leaving AWS resources running.

## 17. Final Phase 3 status

| Area | Final status |
|---|---|
| EKS cluster and managed node group | Destroyed |
| EKS add-ons and supporting IAM | Destroyed |
| GitHub Actions OIDC role/provider | Destroyed; role-assumption issue remained unresolved before teardown |
| Argo CD / application namespaces | Removed with cluster teardown |
| Vault/PostgreSQL/Tempo/Ollama PVC data | Intentionally deleted |
| Terraform dev state | Empty |
| EKS cluster list | Empty |
| Filtered EC2/EBS/ELB/NAT checks | No output |
| Terraform remote-state S3 bucket | Preserved |
| Terraform bootstrap | Preserved |
| Local KIND setup | Not changed by AWS teardown |

**Phase 3 was deployed and demonstrated, then intentionally destroyed.** The environment can be recreated from the repository and retained Terraform remote-state backend. Known follow-ups for a future deployment: automate the changing public-IP allow-list update, resolve GitHub Actions OIDC role assumption, and address the Node Exporter pod-capacity limitation on four `t3.small` workers.
