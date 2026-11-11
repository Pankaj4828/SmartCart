# AWS Helm Configuration

## Separate local and AWS values
The chart is `helm/smartcart/`.
- `values.yaml` contains the chart defaults used by the existing local setup.
- `values-aws.yaml` contains AWS-specific overrides.

Keep the local KIND defaults unchanged.

## AWS overrides
Current `values-aws.yaml`:
```yaml
postgres:
  storageClassName: gp3

ollamaStorageClassName: gp3

ingress:
  enabled: false

vault:
  role: smartcart-eks
  address: http://vault.vault.svc:8200
```

PostgreSQL and Ollama request gp3 storage. Ingress is disabled. The Vault connection uses the in-cluster service address and role shown above.

The EBS CSI driver and gp3 StorageClass must be available before the persistent workloads can bind their PVCs.

## Argo CD
`argocd/smartcart-eks-application.yaml` defines Application `smartcart-eks`. It reads `helm/smartcart` from branch `terra-aws`, uses `values-aws.yaml`, deploys into `smartcart-gitops`, and enables automated sync, pruning, self-healing and namespace creation.

The local Argo CD Application remains separate.

## Local validation
```bash
helm lint helm/smartcart -f helm/smartcart/values-aws.yaml
helm template smartcart helm/smartcart -n smartcart-gitops -f helm/smartcart/values-aws.yaml
```

Review rendered storage classes, ingress settings and Vault configuration. These commands do not deploy resources.

The AWS values file inherits image settings from `values.yaml` unless overridden. Confirm the referenced image tags exist in the registry and in the branch tracked by Argo CD before syncing.
