# SmartCart — Argo CD and Observability Setup

**Environment recorded:** Windows/WSL2 Ubuntu 24.04, KIND  
**Repository:** `https://github.com/Pankaj4828/SmartCart.git`  
**Working directory:** `~/projects/SmartCart`

> This runbook documents what was recorded as configured or tested. It explicitly marks gaps where the conversation did not preserve a clean-install command or end-to-end verification. Do not treat planned features as completed.

## 1. Namespaces and isolation

| Namespace | Purpose |
|---|---|
| `smartcart` | Raw Kubernetes deployment |
| `smartcart-helm` | Helm deployment |
| `smartcart-gitops` | Argo CD-managed application |
| `argocd` | Argo CD |
| `vault` | Vault |
| `vault-secrets-operator` | Vault Secrets Operator |
| `monitoring` | Prometheus/Grafana |
| `tempo` | Tempo |
| `observability` | OpenTelemetry Collector |

Keep the three SmartCart application namespaces separate. The Argo CD fix described below belongs in the Helm chart, not the raw Kubernetes manifests.

Initial checks:

```bash
cd ~/projects/SmartCart
git status --short
git log -5 --oneline
kubectl config current-context
kubectl get nodes
helm version
kubectl get namespaces
```

The original KIND context name was not captured; inspect the current context instead of assuming its name.

# Part A — Argo CD / GitOps

## 2. Application configuration

The Application is `smartcart-gitops`. Its manifest is stored at `argocd/smartcart-application.yaml`.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: smartcart-gitops
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Pankaj4828/SmartCart.git
    targetRevision: main
    path: helm/smartcart
    helm:
      parameters:
        - name: vault.role
          value: smartcart-gitops
        - name: ingress.host
          value: smartcart-gitops.local
  destination:
    server: https://kubernetes.default.svc
    namespace: smartcart-gitops
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

This manifest was applied using:

```bash
kubectl apply -f argocd/smartcart-application.yaml
```

The record confirms that Argo CD was installed and the Application was working. It does **not** preserve the original clean-cluster Argo CD installation command/version procedure. On a new cluster, install and verify Argo CD before applying the Application manifest; do not assume this YAML installs Argo CD itself.

## 3. Open the UI

Run and leave this command running:

```bash
kubectl port-forward -n argocd svc/argocd-server 8081:443
```

Open `https://localhost:8081`. The existing setup used the Argo CD admin login; credentials are intentionally not included.

## 4. Validate GitOps

```bash
kubectl get application smartcart-gitops -n argocd
kubectl describe application smartcart-gitops -n argocd
kubectl get pods,deploy,sts,job,hpa -n smartcart-gitops
kubectl get events -n smartcart-gitops --sort-by=.lastTimestamp | tail -30
```

Validate and render the chart before changing it:

```bash
helm lint helm/smartcart

helm template smartcart-gitops helm/smartcart \
  --namespace smartcart-gitops \
  --set vault.role=smartcart-gitops \
  --set ingress.host=smartcart-gitops.local \
  > /tmp/smartcart-gitops.yaml
```

Inspect the rendered migration Job:

```bash
grep -n -A12 -B3 'name: smartcart-db-migration' /tmp/smartcart-gitops.yaml
grep -n -E 'Force=true,Replace=true|wait-for-postgres|pg_isready' /tmp/smartcart-gitops.yaml
```

## 5. Vault/VSO dependency

The GitOps deployment was configured to use:

- Vault KV v2 path: `secret/smartcart`
- Keys: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET_KEY`
- Service account: `smartcart-vault`
- Vault role: `smartcart-gitops`
- Vault policy: `smartcart`
- VSO resources: `VaultAuth`, `VaultConnection`, `VaultStaticSecret`

Secret synchronization was reported working in `smartcart-gitops`. Do not place actual secret values in this document or Git. The complete original Vault bootstrap commands are not preserved in the available record, so a new cluster still needs the Vault server, KV data, policy, role, service account, and VSO resources configured before this app can consume its secret.

## 6. Migration Job issue and fix

### Root cause

PostgreSQL and the migration Job started together. Alembic tried connecting before PostgreSQL was ready and failed with connection refused. When the Job template was later changed, Kubernetes rejected the patch because Job pod templates are immutable.

### Helm template fix

File: `helm/smartcart/templates/migration-job.yaml`

The Job has this annotation under **top-level Job metadata**:

```yaml
metadata:
  name: smartcart-db-migration
  annotations:
    argocd.argoproj.io/sync-options: Force=true,Replace=true
```

Do not place the annotation under `spec.template.metadata`. It allows Argo CD to replace the Job when its immutable pod template changes.

The Job also has an init container named `wait-for-postgres` that waits with `pg_isready` before the migration container starts:

```yaml
initContainers:
  - name: wait-for-postgres
    image: "{{ .Values.postgres.image.repository }}:{{ .Values.postgres.image.tag }}"
    command:
      - sh
      - -c
      - |
        until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
          echo "Waiting for PostgreSQL..."
          sleep 2
        done
        echo "PostgreSQL is ready."
    envFrom:
      - configMapRef:
          name: smartcart-config
    env:
      - name: POSTGRES_USER
        valueFrom:
          secretKeyRef:
            name: smartcart-secrets
            key: POSTGRES_USER
```

The migration container still runs:

```yaml
command:
  - alembic
  - upgrade
  - head
```

The PostgreSQL StatefulSet template also has a `pg_isready` readiness probe. In the tested template, the probe checks user/database `smartcart`.

### Verified result

These checks passed:

```bash
helm lint helm/smartcart
git diff --check
```

`helm lint` only warned that a chart icon is recommended; it reported no failures. The rendered chart contained the annotation and the PostgreSQL wait logic. Argo CD reported the migration Job deleted/replaced, and the new Job later showed `Complete 1/1`. Backend, frontend, Ollama, and PostgreSQL pods were reported Running.

The raw file `kubernetes/backend/migration-job.yaml` is a separate deployment manifest. It accidentally received the annotation during troubleshooting and was restored. Keep the fix in the Helm template.

## 7. Image update flow

The recorded workflow is:

1. Push code to GitHub.
2. GitHub Actions tests/scans, builds, and publishes frontend/backend images.
3. CI updates `helm/smartcart/values.yaml` image tags to a commit SHA and pushes that values-file change.
4. Argo CD reads Git and reconciles the Helm release.

Argo CD does not build images. A local `git pull` is only needed to update the local checkout with CI-generated commits; it is not needed for Argo CD to read the remote repository.

Check local image tags:

```bash
grep -n -A3 -B2 'repository:\|tag:' helm/smartcart/values.yaml
```

Compare deployed images:

```bash
kubectl get deployments -n smartcart-gitops \
  -o custom-columns='NAME:.metadata.name,IMAGES:.spec.template.spec.containers[*].image'
```

Verify the latest GitHub Actions run before assuming image build, scan, push, and tag update all succeeded.

## 8. Ingress health status — caveat

The Application was seen `Synced` but `Progressing`. A later troubleshooting note records a temporary Ingress health customization in `argocd-cm`; after a hard refresh, the Application showed `Synced/Healthy`.

A backup was saved locally as `/tmp/argocd-cm-before-ingress-health-test.yaml`. This is not a portable repo file. The record does not prove that the health customization was committed declaratively. Inspect current configuration and the specific unhealthy resource before applying a permanent change:

```bash
kubectl get application smartcart-gitops -n argocd
kubectl get ingress smartcart -n smartcart-gitops -o yaml
kubectl get configmap argocd-cm -n argocd -o yaml
kubectl get events -n smartcart-gitops --sort-by=.lastTimestamp | tail -30
```

Do not blindly copy a health override without checking the current resource state.

# Part B — Observability

## 9. Components recorded as installed/configured

| Component | Namespace | Role |
|---|---|---|
| Prometheus | `monitoring` | Metrics collection |
| Grafana | `monitoring` | Dashboards |
| Tempo | `tempo` | Trace backend |
| OpenTelemetry Collector | `observability` | Receives OTLP and exports traces to Tempo |
| FastAPI `/metrics` | SmartCart backend | Application metrics endpoint was integrated |
| OpenTelemetry instrumentation | SmartCart backend | Tracing instrumentation was integrated |

The Collector Helm release was named `otel-collector`, in namespace `observability`. Recorded install output showed chart `opentelemetry-collector` version `0.175.1` and image `otel/opentelemetry-collector-k8s:0.161.0`.

Recorded Collector configuration:
- OTLP gRPC receiver: `0.0.0.0:4317`
- OTLP HTTP receiver: `0.0.0.0:4318`
- Trace exporter endpoint: `tempo.tempo.svc.cluster.local:4317`
- TLS `insecure: true` for that in-cluster OTLP connection
- Batch processor
- Traces pipeline: OTLP receiver → batch processor → Tempo exporter

The Collector Service and Deployment were named `otel-collector-opentelemetry-collector`.

## 10. Inspect and troubleshoot observability

Check pods, deployments, and services:

```bash
kubectl get pods,deploy,svc -n monitoring
kubectl get pods,deploy,svc -n tempo
kubectl get pods,deploy,svc -n observability
```

Check Collector configuration and logs:

```bash
kubectl get configmap -n observability otel-collector-opentelemetry-collector -o yaml
kubectl logs -n observability deployment/otel-collector-opentelemetry-collector
helm list -n observability
helm get values otel-collector -n observability
```

Find the backend Service and configured ports before accessing `/metrics`:

```bash
kubectl get svc backend -n smartcart-gitops -o yaml
kubectl describe deployment backend -n smartcart-gitops
kubectl get pods -n smartcart-gitops
```

The exact original port-forward command for `/metrics` was not preserved, so inspect the current Service/Deployment rather than assuming a port.

## 11. End-to-end checks still needed

The handoff records components as present/configured, but does not prove that all telemetry paths were tested end-to-end after the final GitOps changes. Verify before claiming observability is complete:

- [ ] Prometheus is running and scraping the intended targets.
- [ ] Grafana opens and has a useful SmartCart/Kubernetes dashboard.
- [ ] FastAPI `/metrics` returns metrics.
- [ ] FastAPI emits traces to the Collector.
- [ ] Tempo receives traces and they can be viewed/queried.
- [ ] Useful alerts are configured and tested.

The plan mentioned alerts for high error rate, high latency, and pod restarts, but implementation and testing were not confirmed in the available record.

### Reproduction gap — do not invent missing commands

The available conversation preserves the Collector's installed values/rendered resources, but not a complete clean-cluster install sequence for Prometheus/Grafana and Tempo. It also does not preserve the full FastAPI OpenTelemetry code/configuration. Therefore this document intentionally does not invent Helm repository URLs, chart versions, dashboard IDs, installation commands, or application code.

For a fully reproducible fresh setup, keep the actual values files and instrumentation code in the repository and record their tested install commands. Inspect current files before reconstructing anything.

# Part C — Troubleshooting checklist

## 12. Argo CD OutOfSync / Progressing

Run:

```bash
kubectl get application smartcart-gitops -n argocd
kubectl get pods,deploy,sts,job,hpa -n smartcart-gitops
kubectl get events -n smartcart-gitops --sort-by=.lastTimestamp | tail -30
kubectl describe application smartcart-gitops -n argocd
```

Identify the specific unhealthy resource before changing anything.

If the migration Job has an immutable `spec.template` error:
1. Confirm the annotation is under top-level Job `metadata` in the Helm template.
2. Confirm the `wait-for-postgres` init container appears in the rendered chart.
3. Run `helm lint` and render the chart.
4. Commit and push the validated Helm change.
5. Let Argo CD reconcile it; do not manually delete the Job without a specific reason.

## 13. Collector receives no traces

Check the Collector pod and logs, receiver ports `4317`/`4318`, the traces pipeline, Tempo endpoint, and FastAPI exporter configuration. A Running Collector pod alone does not prove that traces reach Tempo.

## 14. Git discipline

Before editing:

```bash
git status --short
git diff
```

After editing:

```bash
helm lint helm/smartcart
git diff --check
git status --short
```

Inspect the full current file before changing it. Commit only the intended files. Do not include unrelated raw Kubernetes manifests or temporary files.

# Part D — Recorded status

## Confirmed in the project record

- Argo CD Application `smartcart-gitops` tracks `main` and deploys `helm/smartcart` into `smartcart-gitops`.
- Automated sync, prune, self-heal, and `CreateNamespace=true` are configured.
- Migration Job waits for PostgreSQL with `pg_isready`.
- The Helm Job has the top-level `Force=true,Replace=true` annotation.
- Helm lint and `git diff --check` passed.
- Argo CD replaced the migration Job and it completed.
- Backend, frontend, Ollama, and PostgreSQL pods were reported Running.
- Prometheus/Grafana, Tempo, and the OpenTelemetry Collector were present/configured in their recorded namespaces.
- FastAPI `/metrics` and OpenTelemetry tracing were reported integrated.

## Not confirmed complete

- A permanent, declarative Argo CD Ingress health customization.
- Full clean-cluster install commands for Prometheus/Grafana and Tempo.
- Final end-to-end metrics/traces validation.
- A completed SmartCart Grafana dashboard and tested alert rules.
- Syft SBOM generation and Cosign signing.
- AWS/Terraform/Ansible extension.

## Relevant repository files

```text
argocd/smartcart-application.yaml
helm/smartcart/values.yaml
helm/smartcart/templates/migration-job.yaml
helm/smartcart/templates/postgres-statefulset.yaml
kubernetes/backend/migration-job.yaml
```

The raw Kubernetes migration manifest and the Helm migration template are separate files.
