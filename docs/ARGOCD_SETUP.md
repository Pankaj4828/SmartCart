# Argo CD + Helm Setup Runbook — SmartCart

**Purpose:** Help a teammate set up the local SmartCart Kubernetes environment, install Argo CD with Helm, register the SmartCart GitOps application, and verify deployment.

> **Scope:** Local development with Docker, KIND, Helm, and Argo CD. This runbook does not deploy SmartCart to a public domain or cloud provider. Commands assume a Linux/WSL terminal from the repository root unless stated otherwise.
>
> **Important:** The repository configuration shown below is the source of truth for SmartCart. The exact method originally used to install the currently running Argo CD instance was not confirmed. The Helm installation section is a repeatable installation path for a fresh local environment.

---

## 1. Architecture and repository paths

SmartCart uses two different Helm-related concepts:

1. **Helm chart for SmartCart:** `helm/smartcart/` contains the application chart. Argo CD reads this chart from the Git repository and renders/deploys its Kubernetes resources.
2. **Helm chart for Argo CD:** the official Argo CD Helm chart installs Argo CD itself into the `argocd` namespace. This is platform tooling, separate from the SmartCart application chart.

Relevant repository paths:

| Path | Purpose |
|---|---|
| `kubernetes/kind/cluster.yaml` | Defines the local KIND cluster named `smartcart` with one control-plane and two worker nodes |
| `argocd/smartcart-application.yaml` | Defines the Argo CD `Application` named `smartcart-gitops` |
| `helm/smartcart/` | SmartCart Helm chart consumed by Argo CD |
| `helm/smartcart/templates/ingress.yaml` | SmartCart Ingress template |
| `docs/ARGOCD_SETUP.md` | This runbook |

The current Argo CD Application configuration uses:

- Git repository: `https://github.com/Pankaj4828/SmartCart.git`
- Branch: `main`
- Chart path: `helm/smartcart`
- Application namespace: `smartcart-gitops`
- Argo CD namespace: `argocd`
- Helm parameter `vault.role=smartcart-gitops`
- Helm parameter `ingress.host=smartcart-gitops.local`
- Automated sync, pruning, and self-healing enabled
- `CreateNamespace=true`

---

## 2. Prerequisites

Install or verify these tools in the Linux/WSL environment:

```bash
docker --version
kind --version
kubectl version --client
helm version
git --version
```

Docker must be running and usable from this terminal:

```bash
docker info
```

Clone the repository if it is not already present:

```bash
git clone https://github.com/Pankaj4828/SmartCart.git
cd SmartCart
```

If the repository is already cloned, go to its directory instead:

```bash
cd ~/projects/SmartCart
```

---

## 3. Create or select the KIND cluster

The repository's `kubernetes/kind/cluster.yaml` defines:

- Cluster name: `smartcart`
- One control-plane node
- Two worker nodes

Create the cluster:

```bash
kind create cluster --config kubernetes/kind/cluster.yaml
```

If the cluster already exists, do not create it again. Check it first:

```bash
kind get clusters
kubectl cluster-info --context kind-smartcart
kubectl get nodes
```

The expected context is `kind-smartcart`.

> If you already have a working cluster, do not delete it just to follow this runbook. Deleting a KIND cluster removes its local Kubernetes resources and data.

---

## 4. Install Argo CD with Helm (fresh local installation)

This section installs Argo CD itself. It is different from deploying SmartCart through `helm/smartcart`.

Check whether Argo CD is already installed:

```bash
kubectl get namespace argocd
kubectl get pods -n argocd
helm list -n argocd
```

If the `argocd` namespace and Argo CD pods already exist and are healthy, skip the installation commands below.

### 4.1 Add the Argo Helm repository

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

### 4.2 Create the namespace

```bash
kubectl create namespace argocd
```

If it already exists, Kubernetes will report that; do not delete it.

### 4.3 Install Argo CD

For a fresh installation, install the official `argo/argo-cd` chart:

```bash
helm install argocd argo/argo-cd \
  --namespace argocd
```

Wait for the main components to become ready:

```bash
kubectl get pods -n argocd
kubectl rollout status deployment/argocd-server -n argocd --timeout=180s
kubectl get deployment argocd-repo-server -n argocd
```

**Versioning note:** For a repeatable team setup, choose and pin a chart version after reviewing the chart's available versions and compatibility. Do not assume the latest chart will install the same Argo CD version as an existing cluster. The environment checked while writing this runbook was running Argo CD image `quay.io/argoproj/argocd:v3.5.4`; that does not establish which Helm chart version originally installed it.

To inspect the installed release/chart version:

```bash
helm list -n argocd
helm status argocd -n argocd
```

If Argo CD was installed by a different method, `helm list -n argocd` may not show a release. Do not install a second copy over an existing installation.

---

## 5. Open the Argo CD UI locally

Start a port-forward in a dedicated terminal and leave it running:

```bash
kubectl port-forward -n argocd svc/argocd-server 8081:443
```

If local port `8081` is already in use, choose another local port, for example:

```bash
kubectl port-forward -n argocd svc/argocd-server 8082:443
```

Open the matching URL in your browser:

- Port 8081: `https://localhost:8081`
- Port 8082: `https://localhost:8082`

The local TLS certificate may be self-signed, so the browser can show a security warning in a local development setup.

**Keep the port-forward terminal open.** Closing the terminal or restarting VS Code stops the port-forward; start it again when needed.

---

## 6. Find the Argo CD admin username and password

Default initial username:

```text
admin
```

Try retrieving the initial admin password from Kubernetes:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d
echo
```

If the secret exists, use the printed password to log in.

If Kubernetes reports that `argocd-initial-admin-secret` was not found, the secret may have been removed after the initial setup or the installation may manage credentials differently. Do not assume a password. Follow your team's approved admin-password recovery procedure; do not reset credentials casually on a shared cluster.

Security rules:

- Never commit the password to Git.
- Do not paste passwords into issue trackers or project documentation.
- Do not put credentials in shell scripts or the Application YAML.
- Treat terminal output containing credentials as sensitive.

---

## 7. Register SmartCart with Argo CD

The repository already contains the Application manifest at:

```text
argocd/smartcart-application.yaml
```

Review it before applying:

```bash
cat argocd/smartcart-application.yaml
```

Apply it:

```bash
kubectl apply -f argocd/smartcart-application.yaml
```

This manifest tells Argo CD to fetch `main` from the SmartCart repository and render the Helm chart in `helm/smartcart`. It sets the destination namespace to `smartcart-gitops` and enables automated sync, pruning, and self-healing.

Check the Application:

```bash
kubectl get application smartcart-gitops -n argocd
kubectl describe application smartcart-gitops -n argocd
```

Check deployed resources:

```bash
kubectl get pods,deploy,sts,job,hpa,svc,ingress -n smartcart-gitops
```

Check that the Application references the expected source:

```bash
kubectl get application smartcart-gitops -n argocd \
  -o jsonpath='Repo: {.spec.source.repoURL}{"\n"}Branch: {.spec.source.targetRevision}{"\n"}Path: {.spec.source.path}{"\n"}Destination namespace: {.spec.destination.namespace}{"\n"}'
```

---

## 8. How Helm fits into the SmartCart deployment

There are two distinct workflows.

### Workflow A — Argo CD deploys SmartCart from the Helm chart

This is the GitOps workflow used by `argocd/smartcart-application.yaml`:

1. A developer updates the SmartCart source or Helm chart and pushes a commit to GitHub.
2. CI validates/tests the code and, when configured, builds and publishes images and updates image tags in Helm values.
3. Argo CD checks the Git repository and detects the desired-state changes.
4. Argo CD renders `helm/smartcart` using Helm and the parameters in the Application manifest.
5. Argo CD compares desired resources with live Kubernetes resources and syncs changes.
6. Kubernetes starts or updates the workloads.
7. Argo CD reports sync status and health.

### Workflow B — Render or validate the chart locally

Use these commands for inspection and validation; they do not deploy resources:

```bash
helm lint helm/smartcart
helm template smartcart helm/smartcart \
  --namespace smartcart-gitops
```

To inspect the chart's configured defaults:

```bash
grep -n -A8 -B2 'ingress:\|repository:\|tag:' helm/smartcart/values.yaml
```

To apply the chart directly with Helm, you would use a command such as `helm upgrade --install`. **Do not do that for the Argo CD-managed `smartcart-gitops` application unless the team intentionally changes the deployment owner.** Managing the same resources independently with Helm and Argo CD can create ownership and drift confusion. In this project, use Argo CD as the deployment controller and use Helm CLI primarily to lint/render/debug the chart.

---

## 9. Local KIND Ingress behavior and the temporary health test

The SmartCart Ingress uses:

- Class: `nginx`
- Host: `smartcart-gitops.local`
- Path: `/`
- Backend: Service `frontend`, port `80`

Inspect it:

```bash
kubectl get ingress smartcart -n smartcart-gitops -o wide
kubectl get ingress smartcart -n smartcart-gitops -o yaml
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

In the local environment investigated for this runbook, the Ingress status had an empty `status.loadBalancer` and the ingress-nginx LoadBalancer Service had no external IP. That can occur in a local KIND environment and is not, by itself, proof that request routing is broken.

### Temporary Argo CD health customization used for validation

A temporary custom health script was added directly to the `argocd-cm` ConfigMap:

```yaml
resource.customizations.health.networking.k8s.io_Ingress: |
  hs = {}
  hs.status = "Healthy"
  hs.message = "Ingress routing is configured; external load balancer address is optional in local KIND"
  return hs
```

Then the Application was hard-refreshed:

```bash
kubectl annotate application smartcart-gitops -n argocd \
  argocd.argoproj.io/refresh=hard --overwrite
```

The overall Application health changed to `Healthy` after this temporary rule was added. This supports the hypothesis that the default Ingress health assessment was contributing to the `Progressing` status. The test script is deliberately simple: it reports every Ingress as healthy, so it should **not** be treated as a production-ready health check or committed unchanged as a general-purpose policy.

Before making a permanent change, design a more selective health check that validates the relevant Ingress spec and document why a missing external address is acceptable for local KIND. Prefer managing the customization declaratively so a teammate can reproduce it, rather than relying on a manual ConfigMap edit.

A backup of the original ConfigMap was created during the validation:

```text
/tmp/argocd-cm-before-ingress-health-test.yaml
```

That backup is local to the machine where the test was run. It is not in Git and will not be available to another teammate.

### Restore the local ConfigMap backup (rollback)

Only use this if you intend to discard the temporary test and restore the saved ConfigMap:

```bash
kubectl apply -f /tmp/argocd-cm-before-ingress-health-test.yaml
```

This replaces the live ConfigMap with the saved copy. Confirm the contents first and be aware that it restores the snapshot from the time of backup, not any changes made afterward.

After a ConfigMap change, check the Application health again:

```bash
kubectl get application smartcart-gitops -n argocd \
  -o jsonpath='Health: {.status.health.status}{"\n"}'
```

---

## 10. Troubleshooting quick reference

### Port-forward says `address already in use`

Use a different local port:

```bash
kubectl port-forward -n argocd svc/argocd-server 8082:443
```

Then browse to `https://localhost:8082`.

### UI says “no session information”

The Argo CD API request needs an authenticated session. Log in through the UI first. Do not use unauthenticated `curl` requests as proof that the Application API is broken.

### Application is `Synced` but `Progressing`

Sync and health are different:

- **Synced** means the live resources match the desired manifests according to Argo CD's comparison.
- **Progressing** means at least one resource's health assessment has not reached a healthy state.

Check the resource tree and inspect the resource that is actually marked `Progressing`. Do not repeatedly re-check image tags or all pods if those have already been verified.

### Check current events

```bash
kubectl get events -n smartcart-gitops --sort-by='.lastTimestamp'
```

### Inspect Application health and sync status

```bash
kubectl get application smartcart-gitops -n argocd \
  -o jsonpath='Sync: {.status.sync.status}{"\n"}Health: {.status.health.status}{"\n"}'
```

### Check the Argo CD version

```bash
kubectl get deployment argocd-server -n argocd \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

---

## 11. Operational notes

- Keep `argocd/smartcart-application.yaml` in Git as the definition of the SmartCart Argo CD Application.
- Keep the SmartCart application manifests in `helm/smartcart/`.
- Do not commit passwords, Kubernetes Secrets, local backup files, or generated credentials.
- Make one change at a time and verify the resulting sync and health status.
- Avoid managing the same application resources through independent `helm upgrade --install` commands and Argo CD at the same time.
- This runbook describes local KIND setup. Public DNS, cloud infrastructure, and production ingress are intentionally out of scope.
- After changing a setup step, update this runbook so the next teammate can reproduce it.

## 12. Quick start summary

For an existing, working KIND cluster with Argo CD already installed:

```bash
kubectl get nodes
kubectl get pods -n argocd
kubectl port-forward -n argocd svc/argocd-server 8081:443
```

In another terminal, from the repository root:

```bash
kubectl apply -f argocd/smartcart-application.yaml
kubectl get application smartcart-gitops -n argocd
kubectl get pods -n smartcart-gitops
```

For a fresh cluster, follow Sections 2–7 in order. Do not recreate a working cluster or install a second Argo CD instance just to rerun the quick start.
