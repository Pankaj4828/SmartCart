# AWS GitOps and Secrets

## Argo CD Applications
AWS Applications are separate manifests:
- `argocd/smartcart-eks-application.yaml`
- `argocd/metrics-server-application.yaml`
- `argocd/monitoring-application.yaml`
- `argocd/tempo-application.yaml`
- `argocd/vault-application.yaml`
- `argocd/vault-secrets-operator-application.yaml`

The AWS Applications read repository values from branch `terra-aws`; upstream chart versions are pinned in each Application. The SmartCart EKS Application uses `helm/smartcart` and `values-aws.yaml`.

Keep the local `smartcart-application.yaml` separate. The current project uses individual Applications, not an App-of-Apps structure.

## Deployment dependencies
Use a controlled sequence:
1. EKS, Pod Identity and EBS CSI are healthy.
2. gp3 StorageClass exists.
3. Argo CD is installed and has Git/chart access.
4. Metrics Server and observability components are deployed.
5. Vault is deployed and initialized/configured.
6. Vault Secrets Operator is deployed and its CRDs are established.
7. SmartCart is deployed and its Vault resources are verified.

Automated Argo CD sync does not guarantee that dependent CRDs or manual Vault bootstrap steps are complete.

## Vault configuration
The Vault Application pins HashiCorp chart `0.34.1`. Current values disable the injector and enable persistent data storage using a 10Gi gp3 volume.

The SmartCart AWS values point to `http://vault.vault.svc:8200` and use role `smartcart-eks`.

The described setup is demo-oriented, not a production Vault design: it uses internal HTTP and does not configure HA or KMS auto-unseal. Vault must be initialized and unsealed according to its configured seal/storage setup.

## Vault Secrets Operator
The VSO Application pins HashiCorp chart `1.6.2`. The SmartCart chart defines VaultConnection, VaultAuth using Kubernetes authentication, VaultStaticSecret and service account `smartcart-vault`.

## Manual Vault bootstrap
After Vault is deployed, an authorized operator must:
1. Initialize Vault and securely store recovery/unseal material.
2. Unseal Vault as required.
3. Enable/configure Kubernetes authentication for the EKS cluster.
4. Create role `smartcart-eks`, bound to service account `smartcart-vault` in namespace `smartcart-gitops`.
5. Grant only the required access to the SmartCart KV v2 secret path.
6. Create/verify the secret expected by the application.
7. Verify VaultAuth and VaultStaticSecret synchronization.

The exact commands depend on the live cluster endpoint, CA, token reviewer identity and KV mount. Do not use placeholders as live configuration.

## Security
Never commit Vault tokens, unseal/recovery keys or application secret values. Do not expose Vault publicly. Use least-privilege policies and verify namespace/service-account bindings. Internal HTTP is not production-grade transport security.
