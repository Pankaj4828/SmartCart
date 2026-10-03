# SmartCart Helm Deployment Guide

This document explains how the SmartCart application was converted from working Kubernetes manifests into a Helm chart and how the chart was validated and deployed on the local KIND cluster.

The goal is reproducibility: another developer should be able to follow this guide and reproduce the Helm deployment used for the SmartCart project.

---

## 1. Prerequisites

The following tools were used:

```bash
docker --version
docker compose version
kubectl version --client
kind version
helm version
```

The project was developed on WSL2 Ubuntu.

The Kubernetes cluster used for this project is KIND.

---

## 2. Existing Kubernetes Deployment

Before Helm was introduced, SmartCart was already running using normal Kubernetes YAML manifests under:

```text
kubernetes/
├── backend/
├── frontend/
├── kind/
├── ollama/
├── postgres/
├── configmap.yaml
├── ingress.yaml
├── namespace.yaml
└── secret.yaml
```

The working Kubernetes deployment included:

- React frontend
- FastAPI backend
- PostgreSQL StatefulSet
- Ollama Deployment
- Persistent storage
- Services
- Ingress
- ConfigMap
- Secret
- Backend HPA
- Alembic migration Job

Helm was added after this working Kubernetes setup.

This allowed the Helm chart to reuse the already-tested Kubernetes configuration rather than redesigning the application deployment.

---

## 3. Helm Chart Structure

The Helm chart was created under:

```text
helm/
└── smartcart/
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── backend-deployment.yaml
        ├── backend-hpa.yaml
        ├── backend-service.yaml
        ├── configmap.yaml
        ├── frontend-deployment.yaml
        ├── frontend-service.yaml
        ├── ingress.yaml
        ├── migration-job.yaml
        ├── ollama-deployment.yaml
        ├── ollama-pvc.yaml
        ├── ollama-service.yaml
        ├── postgres-service.yaml
        ├── postgres-statefulset.yaml
        └── secret.yaml
```

The chart currently renders 16 Kubernetes resources/templates, including the migration Job and configuration resources.

---

## 4. Chart.yaml

The chart metadata is stored in:

```text
helm/smartcart/Chart.yaml
```

Current configuration:

```yaml
apiVersion: v2
name: smartcart
description: Helm chart for the SmartCart application
type: application
version: 0.1.0
appVersion: "1.0.0"
```

The important values are:

- `apiVersion: v2` - Helm 3 chart format.
- `name: smartcart` - chart name.
- `type: application` - this is an application chart.
- `version: 0.1.0` - chart version.
- `appVersion: "1.0.0"` - application version represented by the chart.

---

## 5. values.yaml

The configurable values are kept in:

```text
helm/smartcart/values.yaml
```

Current values:

```yaml
namespace: smartcart

backend:
  image:
    repository: smartcart-backend
    tag: "1.2"
  replicas: 1

frontend:
  image:
    repository: smartcart-frontend
    tag: "1.2"
  replicas: 1

ollama:
  image:
    repository: ollama/ollama
    tag: latest
  replicas: 1

postgres:
  image:
    repository: postgres
    tag: "17-alpine"
  storage: 2Gi

hpa:
  minReplicas: 1
  maxReplicas: 3
  cpuTarget: 70

ollamaStorage: 5Gi
```

The main purpose of `values.yaml` in this project is to avoid hard-coding values that are useful to change between environments.

For example:

```yaml
backend:
  image:
    repository: smartcart-backend
    tag: "1.2"
```

is used by the backend Deployment and migration Job.

Changing the tag in one place changes both rendered resources.

---

## 6. Reusing the Kubernetes Configuration

The Helm templates were created from the already-working Kubernetes manifests.

For example, the Kubernetes backend Deployment originally used:

```yaml
image: smartcart-backend:1.2
replicas: 1
```

The Helm template changes these into values:

```yaml
replicas: {{ .Values.backend.replicas }}

image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}"
```

The rest of the tested configuration was preserved, including:

- ConfigMap references
- Secret references
- resource requests and limits
- startup probe
- liveness probe
- readiness probe
- container port
- image pull policy

This approach reduced the risk of introducing a new deployment configuration while learning Helm.

---

## 7. Helm Templates

### 7.1 Backend

The chart contains:

```text
backend-deployment.yaml
backend-service.yaml
backend-hpa.yaml
migration-job.yaml
```

The backend image and replica count come from `values.yaml`.

The HPA uses:

```yaml
minReplicas: {{ .Values.hpa.minReplicas }}
maxReplicas: {{ .Values.hpa.maxReplicas }}
averageUtilization: {{ .Values.hpa.cpuTarget }}
```

The migration Job uses the same backend image as the backend Deployment.

Its command is:

```text
alembic upgrade head
```

---

### 7.2 Frontend

The chart contains:

```text
frontend-deployment.yaml
frontend-service.yaml
```

The image and replica count are configurable through:

```yaml
frontend:
  image:
    repository: smartcart-frontend
    tag: "1.2"
  replicas: 1
```

The frontend continues to use the existing Nginx configuration and probes from the working Kubernetes deployment.

---

### 7.3 PostgreSQL

The chart contains:

```text
postgres-statefulset.yaml
postgres-service.yaml
```

PostgreSQL remains a StatefulSet rather than being changed to a Deployment.

The StatefulSet uses:

```yaml
volumeClaimTemplates:
```

with:

```yaml
storage: {{ .Values.postgres.storage }}
storageClassName: standard
```

The tested configuration uses:

```text
2Gi
ReadWriteOnce
standard
```

---

### 7.4 Ollama

The chart contains:

```text
ollama-deployment.yaml
ollama-service.yaml
ollama-pvc.yaml
```

Ollama stores its models at:

```text
/root/.ollama
```

The Helm chart mounts:

```text
ollama-pvc
```

to that location.

The current PVC size is:

```text
5Gi
```

The TinyLlama model was pulled into the Helm-managed Ollama instance and was visible with:

```bash
kubectl exec deployment/ollama -n smartcart-helm -- ollama list
```

The model appeared as:

```text
tinyllama:latest
637 MB
```

---

### 7.5 ConfigMap and Secret

The chart also contains:

```text
configmap.yaml
secret.yaml
```

The ConfigMap contains non-sensitive configuration such as:

```text
POSTGRES_DB
POSTGRES_HOST
POSTGRES_PORT
JWT_ALGORITHM
JWT_ACCESS_TOKEN_EXPIRE_MINUTES
OLLAMA_URL
OLLAMA_MODEL
```

The Secret contains the development credentials required by the application.

The project Secret uses Kubernetes `data`, where values are Base64 encoded.

Base64 is encoding, not encryption.

These credentials are development credentials for the local portfolio environment and should not be reused as production secrets.

---

### 7.6 Ingress

The chart contains:

```text
ingress.yaml
```

The Ingress sends HTTP traffic to the frontend Service.

The Nginx timeout configuration is preserved:

```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "180"
nginx.ingress.kubernetes.io/proxy-send-timeout: "180"
```

These settings are needed because the local Ollama AI generation can take significantly longer than normal HTTP requests.

During Helm testing, the Helm release uses the host:

```text
smartcart-helm.local
```

This is important because the original `smartcart` namespace already had an Ingress using the default host/path.

---

## 8. Helm Namespace Handling

The Helm chart does not require a separate `namespace.yaml` template.

The release namespace is supplied when Helm is installed:

```bash
helm install smartcart ./helm/smartcart \
  --namespace smartcart-helm \
  --create-namespace
```

The option:

```text
--create-namespace
```

creates the namespace if it does not already exist.

This is why Helm can manage the application inside:

```text
smartcart-helm
```

without adding a separate namespace manifest to the chart.

---

## 9. Validate the Chart Before Installing

Before touching the cluster, run:

```bash
helm lint ./helm/smartcart
```

The chart was successfully linted:

```text
1 chart(s) linted, 0 chart(s) failed
```

There was only the informational recommendation that `Chart.yaml` could contain an icon.

That did not prevent the chart from being valid.

---

## 10. Render the Templates

Next:

```bash
helm template smartcart ./helm/smartcart
```

This renders the Helm templates into normal Kubernetes YAML without installing anything.

The rendered output was checked for:

- backend Deployment
- backend Service
- backend HPA
- migration Job
- frontend Deployment
- frontend Service
- PostgreSQL StatefulSet
- PostgreSQL Service
- Ollama Deployment
- Ollama Service
- Ollama PVC
- ConfigMap
- Secret
- Ingress

The rendered configuration showed the expected images, probes, resources, storage, Services and configuration.

---

## 11. First Helm Installation Attempt

The first installation attempt was:

```bash
helm install smartcart ./helm/smartcart \
  --namespace smartcart-helm \
  --create-namespace
```

The installation initially failed because the existing raw Kubernetes Ingress already defined the same default host/path:

```text
host "_" and path "/" 
```

The Nginx admission webhook rejected the duplicate route.

The existing raw Kubernetes application was still running in:

```text
smartcart
```

while Helm was being tested in:

```text
smartcart-helm
```

The problem was specifically the shared Ingress host/path, not the Helm chart resources themselves.

---

## 12. Helm Ingress Fix

The Helm Ingress was changed to use a separate host:

```text
smartcart-helm.local
```

This allowed both deployments to coexist:

```text
smartcart
    └── raw Kubernetes deployment

smartcart-helm
    └── Helm deployment
```

After the change, the Helm installation succeeded.

---

## 13. Install the Helm Chart

Use:

```bash
helm install smartcart ./helm/smartcart \
  --namespace smartcart-helm \
  --create-namespace
```

Successful installation returned:

```text
NAME: smartcart
NAMESPACE: smartcart-helm
STATUS: deployed
REVISION: 1
```

Verify the release:

```bash
helm list -n smartcart-helm
```

Expected status:

```text
STATUS: deployed
```

---

## 14. Verify Helm-Managed Pods

Run:

```bash
kubectl get pods -n smartcart-helm
```

The tested deployment produced:

```text
backend     1/1 Running
frontend    1/1 Running
ollama      1/1 Running
postgres-0  1/1 Running
migration   Completed
```

---

## 15. Verify All Helm Resources

Run:

```bash
kubectl get all -n smartcart-helm
```

The tested Helm deployment contained:

- Backend Deployment
- Frontend Deployment
- Ollama Deployment
- PostgreSQL StatefulSet
- Backend Service
- Frontend Service
- Ollama Service
- PostgreSQL Service
- Backend HPA
- Database migration Job

The HPA showed:

```text
cpu: 5%/70%
min: 1
max: 3
replicas: 1
```

---

## 16. Verify Persistent Volumes

Run:

```bash
kubectl get pvc -n smartcart-helm
```

The tested Helm release created:

```text
ollama-pvc
postgres-data-postgres-0
```

with:

```text
ollama-pvc                 Bound    5Gi
postgres-data-postgres-0   Bound    2Gi
```

Both used:

```text
StorageClass: standard
Access Mode: RWO
```

---

## 17. Verify the Helm Ingress

Run:

```bash
kubectl get ingress -n smartcart-helm
```

The tested result used:

```text
NAME        CLASS   HOSTS
smartcart   nginx   smartcart-helm.local
```

The existing Ingress controller is exposed locally through:

```bash
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8082:80
```

---

## 18. Test the Helm Frontend

With the port-forward running:

```bash
curl -H "Host: smartcart-helm.local" \
  http://localhost:8082/
```

The Helm deployment returned the React application's HTML.

---

## 19. Test the Helm Backend

Run:

```bash
curl -i -H "Host: smartcart-helm.local" \
  http://localhost:8082/api/health
```

The tested result was:

```text
HTTP/1.1 200 OK
```

with:

```json
{"status":"healthy","service":"smartcart-backend"}
```

This verifies:

```text
Browser/curl
    ↓
Ingress
    ↓
Frontend Nginx
    ↓
Backend Service
    ↓
FastAPI backend
```

---

## 20. Test the Helm Product API

Run:

```bash
curl -H "Host: smartcart-helm.local" \
  http://localhost:8082/api/products
```

The endpoint was reachable successfully.

The Helm deployment initially had an empty database, so the product list returned:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 12,
  "total_pages": 0
}
```

This confirmed that the API was reachable and the Helm PostgreSQL instance was being used.

---

## 21. Database Migration Job

The Helm chart includes:

```text
migration-job.yaml
```

The Job runs:

```text
alembic upgrade head
```

After Helm installation:

```bash
kubectl get jobs -n smartcart-helm
```

showed:

```text
smartcart-db-migration   Complete
```

The Pod associated with the Job also reached:

```text
Completed
```

This verifies that the Helm deployment can initialize/update the PostgreSQL schema using the same backend image.

---

## 22. Verify Backend → Ollama Connectivity

The backend container does not contain `curl`, so the following was not used:

```bash
kubectl exec deployment/backend -n smartcart-helm -- curl ...
```

Instead, Python/httpx inside the backend container was used:

```bash
kubectl exec deployment/backend -n smartcart-helm -- \
  python -c "import httpx; print(httpx.get('http://ollama:11434/api/tags').json())"
```

The result was:

```json
{"models":[]}
```

at that point.

This confirmed that:

```text
Backend Pod
    ↓
ollama Service
    ↓
Ollama Pod
```

was reachable.

---

## 23. Pull TinyLlama into the Helm Ollama

The Helm Ollama instance initially had no model:

```bash
kubectl exec deployment/ollama -n smartcart-helm -- ollama list
```

returned no models.

TinyLlama was then pulled:

```bash
kubectl exec -it deployment/ollama -n smartcart-helm -- \
  ollama pull tinyllama
```

The pull completed successfully.

Verification:

```bash
kubectl exec deployment/ollama -n smartcart-helm -- \
  ollama list
```

returned:

```text
NAME              SIZE
tinyllama:latest  637 MB
```

The model is stored on the Helm-managed Ollama PVC.

---

## 24. Ollama Runtime Test

The Helm Ollama deployment was compared with the existing raw Kubernetes Ollama deployment.

Both had the same resource configuration:

```text
CPU request:     250m
CPU limit:       1
Memory request:  512Mi
Memory limit:    1Gi
```

The existing raw Kubernetes deployment was running:

```text
Ollama 0.35.0
```

The Helm deployment was running:

```text
Ollama 0.35.1
```

The direct TinyLlama generation test through the Helm deployment exceeded the 180-second client timeout.

Ollama logs showed:

```text
llama-server started in 122.55 seconds
```

and the generation request eventually reached:

```text
500 | 3m0s | POST "/api/generate"
```

The Helm deployment was otherwise healthy.

This runtime behavior was recorded as an AI/Ollama investigation rather than treated as a Helm installation failure.

The Helm chart currently uses:

```yaml
ollama:
  image:
    repository: ollama/ollama
    tag: latest
```

The image version should be revisited later if reproducible Ollama inference performance becomes a requirement.

---

## 25. Helm Upgrade

Once a value or template is changed, use:

```bash
helm upgrade smartcart ./helm/smartcart \
  --namespace smartcart-helm
```

Then verify:

```bash
helm list -n smartcart-helm
```

and:

```bash
kubectl get pods -n smartcart-helm
```

For a specific deployment:

```bash
kubectl rollout status deployment/backend -n smartcart-helm
```

---

## 26. Helm History

Helm stores release history.

Check it with:

```bash
helm history smartcart -n smartcart-helm
```

This shows revisions of the release.

For example:

```text
REVISION
1
```

represents the initial successful installation.

---

## 27. Helm Rollback

If a later upgrade introduces a problem, first inspect history:

```bash
helm history smartcart -n smartcart-helm
```

Then rollback to a previous revision:

```bash
helm rollback smartcart 1 -n smartcart-helm
```

Verify:

```bash
helm list -n smartcart-helm
kubectl get pods -n smartcart-helm
```

Rollback should be used only after identifying the revision that contains the desired configuration.

---

## 28. Uninstall the Helm Release

To remove the Helm-managed application:

```bash
helm uninstall smartcart -n smartcart-helm
```

Verify:

```bash
kubectl get all -n smartcart-helm
```

The release resources should be removed.

Persistent volume behavior should be checked separately because PVC lifecycle depends on the resource and storage configuration.

---

## 29. Useful Helm Commands

### Check chart

```bash
helm lint ./helm/smartcart
```

### Render without installing

```bash
helm template smartcart ./helm/smartcart
```

### Install

```bash
helm install smartcart ./helm/smartcart \
  --namespace smartcart-helm \
  --create-namespace
```

### List releases

```bash
helm list -n smartcart-helm
```

### Show release status

```bash
helm status smartcart -n smartcart-helm
```

### Show release history

```bash
helm history smartcart -n smartcart-helm
```

### Upgrade

```bash
helm upgrade smartcart ./helm/smartcart \
  --namespace smartcart-helm
```

### Rollback

```bash
helm rollback smartcart 1 -n smartcart-helm
```

### Uninstall

```bash
helm uninstall smartcart -n smartcart-helm
```

---

## 30. Troubleshooting

### Helm lint fails

Run:

```bash
helm lint ./helm/smartcart
```

Read the reported template and values errors before installing.

---

### Rendered YAML is unexpected

Run:

```bash
helm template smartcart ./helm/smartcart
```

Search the rendered output for the affected resource.

For example:

```bash
helm template smartcart ./helm/smartcart | grep -A20 "kind: Deployment"
```

---

### Helm installation fails because an Ingress already exists

Check:

```bash
kubectl get ingress -A
```

If two namespaces define the same Nginx host/path, the ingress admission webhook may reject the second resource.

For local testing with two SmartCart deployments, use a different host such as:

```text
smartcart-helm.local
```

---

### Pod is not starting

Run:

```bash
kubectl get pods -n smartcart-helm
```

Then:

```bash
kubectl describe pod <pod-name> -n smartcart-helm
```

and:

```bash
kubectl logs <pod-name> -n smartcart-helm
```

---

### Helm release is failed

Run:

```bash
helm list -n smartcart-helm
```

and:

```bash
helm status smartcart -n smartcart-helm
```

If the release needs to be removed:

```bash
helm uninstall smartcart -n smartcart-helm
```

---

### Backend cannot reach Ollama

Check the Service:

```bash
kubectl get service ollama -n smartcart-helm
```

Check the Pod:

```bash
kubectl get pods -n smartcart-helm -l app=ollama
```

Test from the backend:

```bash
kubectl exec deployment/backend -n smartcart-helm -- \
  python -c "import httpx; print(httpx.get('http://ollama:11434/api/tags').json())"
```

---

### Ollama model is missing

Run:

```bash
kubectl exec deployment/ollama -n smartcart-helm -- ollama list
```

If TinyLlama is missing:

```bash
kubectl exec -it deployment/ollama -n smartcart-helm -- \
  ollama pull tinyllama
```

---

## 31. Reproduction Flow

A new developer can reproduce the Helm deployment using this sequence:

### Step 1 — Verify the chart

```bash
helm lint ./helm/smartcart
```

### Step 2 — Render it

```bash
helm template smartcart ./helm/smartcart
```

### Step 3 — Install it in a separate namespace

```bash
helm install smartcart ./helm/smartcart \
  --namespace smartcart-helm \
  --create-namespace
```

### Step 4 — Check the release

```bash
helm list -n smartcart-helm
```

### Step 5 — Check Pods

```bash
kubectl get pods -n smartcart-helm
```

### Step 6 — Check all resources

```bash
kubectl get all -n smartcart-helm
```

### Step 7 — Check storage

```bash
kubectl get pvc -n smartcart-helm
```

### Step 8 — Check Ingress

```bash
kubectl get ingress -n smartcart-helm
```

### Step 9 — Start local Ingress access

```bash
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8082:80
```

### Step 10 — Test frontend

```bash
curl -H "Host: smartcart-helm.local" \
  http://localhost:8082/
```

### Step 11 — Test backend

```bash
curl -i -H "Host: smartcart-helm.local" \
  http://localhost:8082/api/health
```

### Step 12 — Check migration

```bash
kubectl get jobs -n smartcart-helm
```

### Step 13 — Check Ollama model

```bash
kubectl exec deployment/ollama -n smartcart-helm -- \
  ollama list
```

---

## 32. Current Helm Deployment State

The tested Helm release is:

```text
Release:       smartcart
Namespace:     smartcart-helm
Chart:         smartcart-0.1.0
App Version:   1.0.0
Status:        deployed
Revision:      1
```

The deployment contains:

```text
                    Helm Release
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
    Frontend           Backend           Ollama
       │                 │                 │
    Service             Service           Service
       │                 │                 │
    Ingress             HPA              PVC
                         │
                    Migration Job
                         │
                    PostgreSQL
                         │
                       PVC
```

The Helm chart has been linted, rendered, installed successfully in a separate namespace, and its Kubernetes resources have been verified.

---

## 33. Relationship to the Raw Kubernetes Deployment

The project intentionally keeps both forms:

```text
kubernetes/
    Raw Kubernetes manifests

helm/smartcart/
    Helm chart
```

The raw Kubernetes manifests show the explicit Kubernetes resources.

The Helm chart packages the same working deployment into a reusable release.

The Helm deployment was tested in:

```text
smartcart-helm
```

while the original Kubernetes deployment remained in:

```text
smartcart
```

This allowed Helm to be introduced without replacing or destroying the already-working Kubernetes deployment.
