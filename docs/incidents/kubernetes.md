# SmartCart Kubernetes Deployment

> This document records the Kubernetes implementation that was actually built and verified for the SmartCart project.
>
> The goal is reproducibility: another engineer should be able to understand the setup, deploy it locally with KIND, verify each layer, and troubleshoot the main failures we encountered.
>
> **Platform:** KIND (local Kubernetes)
>
> **Namespace:** `smartcart`
>
> **Application:** React + TypeScript frontend, FastAPI backend, PostgreSQL, Ollama AI
>
> **Deployment style:** Kubernetes YAML manifests
>
> **Current stage:** Manual Kubernetes deployment completed and verified. Helm is the next phase.

---

## None.1 1. Why Kubernetes in SmartCart?

SmartCart was first containerized with Docker and Docker Compose.

Kubernetes is the next platform layer because we want to demonstrate how the same containers are deployed and operated as workloads:

- Frontend runs as a stateless Deployment.
- FastAPI backend runs as a stateless Deployment.
- PostgreSQL runs as a StatefulSet because it owns persistent database state.
- Ollama runs as a Deployment with persistent model storage.
- Services provide internal Kubernetes networking.
- ConfigMap provides non-sensitive configuration.
- Secret provides sensitive configuration.
- Ingress provides HTTP entry routing.
- Probes allow Kubernetes to determine application health.
- Resource requests/limits define resource expectations.
- HPA scales the backend based on CPU usage.
- A Kubernetes Job runs Alembic database migrations.

The local platform is **KIND**, so this stage does not require AWS.

---

# 1. Architecture

```text
                         Browser
                            |
                            | HTTP
                            v
                +------------------------+
                |   Ingress Controller   |
                |     ingress-nginx      |
                +-----------+------------+
                            |
                            v
                    +---------------+
                    |   Frontend    |
                    |   Service     |
                    |  ClusterIP    |
                    +-------+-------+
                            |
                            v
                    +---------------+
                    |   Frontend    |
                    |   Deployment  |
                    |   Nginx       |
                    +-------+-------+
                            |
                     /api requests
                            |
                            v
                    +---------------+
                    |    Backend    |
                    |    Service    |
                    |   ClusterIP   |
                    +-------+-------+
                            |
                            v
                    +---------------+
                    |    Backend    |
                    |  Deployment   |
                    |   FastAPI     |
                    +---+-------+---+
                        |       |
                        |       |
                        v       v
                 +----------+  +----------+
                 | Postgres |  |  Ollama  |
                 | Service  |  | Service  |
                 +----+-----+  +----+-----+
                      |              |
                      v              v
                PostgreSQL       Ollama Pod
                StatefulSet      + PVC
                    |
                    v
                 PVC 2Gi
```

---

# 2. Kubernetes Project Structure

Current application manifests:

```text
kubernetes/
├── kind/
│   └── cluster.yaml
│
├── postgres/
│   ├── statefulset.yaml
│   ├── service.yaml
│   ├── pvc.yaml          # obsolete; cleanup pending
│   └── secret.yaml       # obsolete/unused; cleanup pending
│
├── backend/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── migration-job.yaml
│
├── ollama/
│   ├── deployment.yaml
│   ├── pvc.yaml
│   └── service.yaml
│
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
│
├── namespace.yaml
├── configmap.yaml
├── secret.yaml
└── ingress.yaml
```

### Important

PostgreSQL uses the StatefulSet's `volumeClaimTemplates`.

Therefore:

```text
kubernetes/postgres/pvc.yaml
```

is obsolete and is not part of the active PostgreSQL storage configuration.

The active application Secret is:

```text
kubernetes/secret.yaml
```

The old:

```text
kubernetes/postgres/secret.yaml
```

is unused.

These files are intentionally documented as cleanup items rather than silently deleting them.

---

# 3. Kubernetes Prerequisites and Installation

This section records the Kubernetes tooling that was checked before deploying SmartCart.

The local Kubernetes environment uses:

| Tool | Purpose | Verified version |
|---|---|---|
| Docker | Container runtime used by KIND | Docker 29.8.0 |
| Docker Compose | Local multi-container application environment | Compose v5.5.1 |
| kubectl | Kubernetes command-line client | v1.36.1 |
| KIND | Local Kubernetes cluster | v0.31.0 |
| Helm | Kubernetes package manager; used in the next phase | v4.3.0 |

The host environment used for this project is:

```text
WSL2
Ubuntu 24.04.4 LTS
```

## 3.1 Check Docker

KIND uses Docker to create its Kubernetes nodes.

Check:

```bash
docker --version
```

Expected format:

```text
Docker version 29.8.0
```

Also verify Docker is running:

```bash
docker ps
```

If Docker is working, the command should return the Docker container list without a daemon connection error.

## 3.2 Check kubectl

`kubectl` is the Kubernetes CLI used to communicate with the cluster.

Check:

```bash
kubectl version --client
```

Verified in this project:

```text
Client Version: v1.36.1
```

After the KIND cluster exists, verify that `kubectl` can communicate with Kubernetes:

```bash
kubectl cluster-info
```

Then:

```bash
kubectl get nodes
```

## 3.3 Check KIND

Check:

```bash
kind version
```

Verified:

```text
kind v0.31.0
```

KIND is used because SmartCart's Kubernetes environment is intentionally local-first.

## 3.4 Check Helm

Helm is installed and will be used after the manual Kubernetes deployment is documented and stable.

Check:

```bash
helm version
```

Verified:

```text
v4.3.0
```

Helm is **not** used to deploy the current manual Kubernetes manifests. It is the next phase.

## 3.5 Install kubectl

If `kubectl` is not installed, install it using the official Kubernetes installation method appropriate for the operating system.

After installation, always verify:

```bash
kubectl version --client
```

## 3.6 Install KIND

If KIND is not installed, install it using the official KIND release/install method.

After installation:

```bash
kind version
```

## 3.7 Install Helm

If Helm is not installed, install it using the official Helm installation method.

After installation:

```bash
helm version
```

## 3.8 Verify Kubernetes access after cluster creation

After creating the cluster:

```bash
kubectl cluster-info
```

```bash
kubectl get nodes
```

```bash
kubectl get namespaces
```

The important check is that the KIND nodes are `Ready`.

---

# 4. KIND Cluster

## 4.1 Why KIND?

KIND runs Kubernetes nodes as Docker containers.

For SmartCart it gives us a real Kubernetes environment locally without paying for cloud infrastructure.

## 4.2 Cluster configuration

`kubernetes/kind/cluster.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4

name: smartcart

nodes:
  - role: control-plane
  - role: worker
  - role: worker
```

The cluster contains:

```text
smartcart-control-plane
smartcart-worker
smartcart-worker2
```

## 4.3 Create the cluster

```bash
kind create cluster --config kubernetes/kind/cluster.yaml
```

Verify:

```bash
kubectl get nodes
```

Expected:

```text
smartcart-control-plane   Ready
smartcart-worker           Ready
smartcart-worker2          Ready
```

---

# 5. Namespace

SmartCart uses a dedicated namespace:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smartcart
```

Apply:

```bash
kubectl apply -f kubernetes/namespace.yaml
```

Verify:

```bash
kubectl get namespace smartcart
```

The namespace gives the application its own logical Kubernetes boundary.

---

# 6. Configuration

## 6.1 ConfigMap

`kubernetes/configmap.yaml` contains non-sensitive configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: smartcart-config
  namespace: smartcart
data:
  POSTGRES_DB: "smartcart"
  POSTGRES_HOST: "postgres"
  POSTGRES_PORT: "5432"
  JWT_ALGORITHM: "HS256"
  JWT_ACCESS_TOKEN_EXPIRE_MINUTES: "60"
  OLLAMA_URL: "http://ollama:11434"
  OLLAMA_MODEL: "tinyllama"
```

Apply:

```bash
kubectl apply -f kubernetes/configmap.yaml
```

Verify:

```bash
kubectl get configmap smartcart-config -n smartcart
```

## 6.2 Secret

`kubernetes/secret.yaml` stores sensitive values such as:

- PostgreSQL username
- PostgreSQL password
- JWT secret

The values are stored in Kubernetes Secret `data` using base64 encoding.

Apply:

```bash
kubectl apply -f kubernetes/secret.yaml
```

Verify:

```bash
kubectl get secret smartcart-secrets -n smartcart
```

Do not print secret values during normal verification.

---

# 7. PostgreSQL

## 7.1 Why StatefulSet?

PostgreSQL owns persistent application data.

A Deployment is normally used for stateless workloads.

For this project PostgreSQL is implemented as a StatefulSet because:

- it has persistent state;
- it needs stable storage;
- the database data should survive Pod recreation;
- `volumeClaimTemplates` provides the PVC automatically.

## 7.2 PostgreSQL configuration

Image:

```text
postgres:17-alpine
```

Internal port:

```text
5432
```

Database:

```text
smartcart
```

Storage:

```text
2Gi
```

Storage class:

```text
standard
```

The KIND cluster's `standard` StorageClass uses local-path dynamic provisioning.

## 7.3 Apply

```bash
kubectl apply -f kubernetes/postgres/statefulset.yaml -n smartcart
kubectl apply -f kubernetes/postgres/service.yaml -n smartcart
```

Verify:

```bash
kubectl get statefulset -n smartcart
kubectl get pods -n smartcart
kubectl get pvc -n smartcart
```

Expected PostgreSQL Pod:

```text
postgres-0   1/1   Running
```

Expected PVC:

```text
postgres-data-postgres-0   Bound   2Gi   ReadWriteOnce
```

## 7.4 PostgreSQL health

The StatefulSet uses:

```yaml
livenessProbe:
  exec:
    command:
      - pg_isready
      - -U
      - smartcart
      - -d
      - smartcart
```

This checks whether PostgreSQL is accepting connections.

---

# 8. Backend

## 8.1 Backend container

The backend image currently used by Kubernetes is:

```text
smartcart-backend:1.2
```

The image contains:

```text
/app/
├── alembic.ini
└── backend/
    ├── app/
    └── alembic/
```

This structure was intentionally preserved because the Alembic configuration and Python imports depend on the repository structure.

## 8.2 Backend Deployment

The backend runs as a Deployment.

Current resources:

```yaml
requests:
  cpu: "100m"
  memory: "128Mi"

limits:
  cpu: "500m"
  memory: "512Mi"
```

The backend exposes:

```text
8000
```

## 8.3 Backend configuration

The Deployment receives:

From ConfigMap:

```text
POSTGRES_DB
POSTGRES_HOST
POSTGRES_PORT
JWT_ALGORITHM
JWT_ACCESS_TOKEN_EXPIRE_MINUTES
OLLAMA_URL
OLLAMA_MODEL
```

From Secret:

```text
POSTGRES_USER
POSTGRES_PASSWORD
JWT_SECRET_KEY
```

## 8.4 Backend probes

The backend exposes:

```text
/health
```

Three probe types are used:

### Startup probe

Allows the application time to start before Kubernetes evaluates ongoing health.

### Liveness probe

Checks:

```text
GET /health
```

If the application becomes unhealthy, Kubernetes can restart the container.

### Readiness probe

Checks:

```text
GET /health
```

If readiness fails, Kubernetes removes the Pod from Service traffic while leaving the container running.

We intentionally tested readiness by temporarily changing the path to an invalid path.

The result was:

```text
Ready: False
State: Running
Restart Count: 0
```

This demonstrated that readiness failure does not automatically restart the container.

The readiness path was restored to:

```text
/health
```

## 8.5 Apply

```bash
kubectl apply -f kubernetes/backend/deployment.yaml -n smartcart
kubectl apply -f kubernetes/backend/service.yaml -n smartcart
```

Verify:

```bash
kubectl get deployment backend -n smartcart
kubectl get pods -n smartcart -l app=backend
```

Expected:

```text
backend   1/1
```

The Deployment may temporarily have more replicas when HPA is under load.

---

# 9. Frontend

## 9.1 Frontend container

The Kubernetes frontend image is:

```text
smartcart-frontend:1.2
```

It uses Nginx to serve the production React build.

## 9.2 Frontend Deployment

Current resources:

```yaml
requests:
  cpu: "50m"
  memory: "32Mi"

limits:
  cpu: "200m"
  memory: "128Mi"
```

Container port:

```text
80
```

## 9.3 Frontend probes

Liveness:

```text
/
```

Readiness:

```text
/
```

If Nginx is not serving the application, these checks fail.

## 9.4 Apply

```bash
kubectl apply -f kubernetes/frontend/deployment.yaml -n smartcart
kubectl apply -f kubernetes/frontend/service.yaml -n smartcart
```

Verify:

```bash
kubectl get deployment frontend -n smartcart
kubectl get pods -n smartcart -l app=frontend
```

---

# 10. Ollama

Ollama provides the local SmartCart AI capability.

Model:

```text
tinyllama
```

Service port:

```text
11434
```

The model data is stored on:

```text
ollama-pvc
```

Storage:

```text
5Gi
```

## 10.1 Why persistent storage?

The Ollama model should not need to be downloaded again whenever the Pod is recreated.

Therefore the model directory:

```text
/root/.ollama
```

is mounted on the PVC.

## 10.2 Resources

```yaml
requests:
  cpu: "250m"
  memory: "512Mi"

limits:
  cpu: "1000m"
  memory: "1Gi"
```

## 10.3 Probes

The Ollama Deployment checks:

```text
/api/tags
```

for startup, liveness, and readiness.

## 10.4 Apply

```bash
kubectl apply -f kubernetes/ollama/pvc.yaml -n smartcart
kubectl apply -f kubernetes/ollama/deployment.yaml -n smartcart
kubectl apply -f kubernetes/ollama/service.yaml -n smartcart
```

Verify:

```bash
kubectl get pods -n smartcart -l app=ollama
kubectl get pvc -n smartcart
```

The TinyLlama model was verified after the Ollama rollout.

---

# 11. Kubernetes Services

SmartCart uses ClusterIP Services for internal communication.

Current services:

```text
frontend
backend
postgres
ollama
```

Check:

```bash
kubectl get services -n smartcart
```

Important service names used by the application:

```text
postgres:5432
ollama:11434
backend:8000
```

Kubernetes DNS allows Pods to use the Service names rather than Pod IP addresses.

For example:

```text
POSTGRES_HOST=postgres
OLLAMA_URL=http://ollama:11434
```

---

# 12. Ingress

Ingress provides the HTTP entry point for SmartCart.

The Ingress uses:

```text
ingressClassName: nginx
```

and routes:

```text
/
```

to:

```text
frontend:80
```

The frontend Nginx configuration handles:

```text
/api/
```

and proxies those requests to:

```text
backend:8000
```

Therefore the browser sees one application endpoint:

```text
Browser
   |
   v
Ingress
   |
   v
Frontend/Nginx
   |
   +---- /api/ ----> Backend
```

## 12.1 AI timeout configuration

Ollama can take longer to generate a response when running on CPU.

The Ingress therefore uses:

```yaml
nginx.ingress.kubernetes.io/proxy-read-timeout: "180"
nginx.ingress.kubernetes.io/proxy-send-timeout: "180"
```

The frontend Nginx configuration also uses:

```nginx
proxy_connect_timeout 10s;
proxy_send_timeout 180s;
proxy_read_timeout 180s;
```

This was required because AI requests were initially returning `504 Gateway Timeout` even though Ollama was successfully generating the response.

## 12.2 Apply

```bash
kubectl apply -f kubernetes/ingress.yaml -n smartcart
```

---

# 13. KIND Ingress Access

The KIND cluster does not use host port mappings for this setup.

The ingress controller is accessed locally using port-forwarding:

```bash
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8082:80
```

Then:

```text
http://localhost:8082
```

is used to access SmartCart.

---

# 14. Application Verification

With the ingress port-forward running:

## 14.1 Backend health

```bash
curl http://localhost:8082/api/health
```

Expected:

```json
{"status":"healthy","service":"smartcart-backend"}
```

## 14.2 Products

```bash
curl http://localhost:8082/api/products
```

The current Kubernetes database contains the SmartCart catalog used during verification.

Current seeded products include:

```text
Smart Laptop
Wireless Headphones
Smart Watch
```

## 14.3 Frontend

Open:

```text
http://localhost:8082
```

The React application should load.

---

# 15. Resource Requests and Limits

Resource management was added to the application workloads.

| Workload | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---|---:|---:|---:|---:|
| Backend | 100m | 500m | 128Mi | 512Mi |
| Frontend | 50m | 200m | 32Mi | 128Mi |
| PostgreSQL | 100m | 500m | 128Mi | 512Mi |
| Ollama | 250m | 1000m | 512Mi | 1Gi |

All workloads were verified as:

```text
1/1 Running
```

with zero restarts during the final verification.

---

# 16. Metrics Server

HPA requires resource metrics.

Initially:

```bash
kubectl top pods -n smartcart
```

returned:

```text
error: Metrics API not available
```

Metrics Server was installed.

The initial Metrics Server deployment was not ready because KIND kubelet certificates did not contain the node IPs as IP SANs.

The logs showed:

```text
tls: failed to verify certificate
x509: cannot validate certificate ... because it doesn't contain any IP SANs
```

For this local KIND environment, Metrics Server was configured with:

```text
--kubelet-insecure-tls
```

After the change:

```bash
kubectl get deployment metrics-server -n kube-system
```

showed:

```text
READY   UP-TO-DATE   AVAILABLE
1/1     1            1
```

Then:

```bash
kubectl top pods -n smartcart
```

returned CPU and memory metrics.

Example observed values:

```text
backend      5m    62Mi
frontend     1m    13Mi
ollama       1m    40Mi
postgres     3m    25Mi
```

---

# 17. HPA

The backend uses a HorizontalPodAutoscaler.

File:

```text
kubernetes/backend/hpa.yaml
```

Configuration:

```yaml
minReplicas: 1
maxReplicas: 3
```

CPU target:

```text
70%
```

The HPA targets:

```text
Deployment/backend
```

## 17.1 Apply

```bash
kubectl apply -f kubernetes/backend/hpa.yaml -n smartcart
```

Verify:

```bash
kubectl get hpa -n smartcart
```

Normal idle state:

```text
cpu: 4%/70%
replicas: 1
```

## 17.2 HPA load test

A temporary BusyBox Pod was used to repeatedly call:

```text
http://backend:8000/health
```

Under load, HPA observed:

```text
cpu: 274%/70%
```

and scaled:

```text
1 replica → 3 replicas
```

The backend Deployment showed:

```text
3/3
```

with three running Pods.

After deleting the temporary load generator:

```bash
kubectl delete pod load-generator -n smartcart
```

CPU dropped to approximately:

```text
3–4%
```

After the HPA stabilization period, replicas returned:

```text
3 → 1
```

Therefore HPA was verified end-to-end.

---

# 18. Database Migration Job

Database migrations are handled by a Kubernetes Job instead of making the backend Deployment responsible for migrations.

File:

```text
kubernetes/backend/migration-job.yaml
```

The Job uses:

```text
smartcart-backend:1.2
```

and runs:

```text
alembic upgrade head
```

## 18.1 Apply

```bash
kubectl apply -f kubernetes/backend/migration-job.yaml -n smartcart
```

Check:

```bash
kubectl get jobs -n smartcart
```

Successful result:

```text
smartcart-db-migration   Complete   1/1
```

The Job Pod ends in:

```text
Completed
```

This is expected. A Job is supposed to finish.

## 18.2 Check migration logs

```bash
kubectl logs job/smartcart-db-migration -n smartcart
```

Observed:

```text
Context impl PostgresqlImpl.
Will assume transactional DDL.
```

## 18.3 Verify Alembic revision

```bash
kubectl exec deployment/backend -n smartcart -- alembic current
```

Verified revision:

```text
adc253b1d1b9 (head)
```

Therefore the database is at the expected migration head.

---

# 19. Kubernetes Verification Checklist

Run these checks after deployment.

## 19.1 Nodes

```bash
kubectl get nodes
```

All KIND nodes should be `Ready`.

## 19.2 Namespace

```bash
kubectl get namespace smartcart
```

## 19.3 Pods

```bash
kubectl get pods -n smartcart
```

Application Pods should normally show:

```text
1/1 Running
```

The migration Job Pod is expected to show:

```text
Completed
```

## 19.4 Deployments

```bash
kubectl get deployments -n smartcart
```

## 19.5 Services

```bash
kubectl get services -n smartcart
```

## 19.6 PVCs

```bash
kubectl get pvc -n smartcart
```

Expected active PVCs:

```text
ollama-pvc
postgres-data-postgres-0
```

## 19.7 HPA

```bash
kubectl get hpa -n smartcart
```

## 19.8 Metrics

```bash
kubectl top pods -n smartcart
```

## 19.9 Ingress

```bash
kubectl get ingress -n smartcart
```

## 19.10 Application

```bash
curl http://localhost:8082/api/health
```

```bash
curl http://localhost:8082/api/products
```

---

# 20. Troubleshooting

## 20.1 Pod is not Running

First check:

```bash
kubectl get pods -n smartcart
```

Then inspect the Pod:

```bash
kubectl describe pod <pod-name> -n smartcart
```

Check logs:

```bash
kubectl logs <pod-name> -n smartcart
```

The goal is to identify whether the failure is:

```text
image
configuration
secret
dependency
probe
resource
application
```

Do not blindly restart the Pod before checking the evidence.

---

## 20.2 Readiness probe fails

Check:

```bash
kubectl describe pod <pod-name> -n smartcart
```

Look for:

```text
Readiness probe failed
```

Remember:

```text
Readiness failure
    ↓
Pod stays running
    ↓
Pod is removed from Service traffic
```

It does not automatically mean the container should restart.

---

## 20.3 Backend cannot connect to PostgreSQL

Check the Services:

```bash
kubectl get services -n smartcart
```

The backend should use:

```text
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
```

Then check PostgreSQL:

```bash
kubectl get pods -n smartcart -l app=postgres
```

and:

```bash
kubectl logs postgres-0 -n smartcart
```

---

## 20.4 Metrics Server is not ready

Check:

```bash
kubectl get deployment metrics-server -n kube-system
```

Then:

```bash
kubectl logs -n kube-system deployment/metrics-server
```

If the local KIND environment reports kubelet certificate/IP SAN errors, check that the Metrics Server deployment includes:

```text
--kubelet-insecure-tls
```

Then verify:

```bash
kubectl top pods -n smartcart
```

---

## 20.5 HPA shows `<unknown>`

Check Metrics Server first:

```bash
kubectl top pods -n smartcart
```

If Metrics Server is not returning metrics, HPA cannot calculate CPU utilization.

Then:

```bash
kubectl get hpa -n smartcart
```

Once metrics are available, the target should become something like:

```text
cpu: 4%/70%
```

---

## 20.6 HPA does not scale down immediately

This is expected.

HPA uses a stabilization period to avoid rapidly changing replica counts.

Check:

```bash
kubectl get hpa -n smartcart
```

and wait after removing the load.

---

## 20.7 AI request returns 504

Check the backend and Ollama Pods:

```bash
kubectl get pods -n smartcart
```

Then check Ollama logs:

```bash
kubectl logs deployment/ollama -n smartcart
```

If Ollama is generating successfully but takes longer on CPU, verify the Ingress and frontend Nginx timeouts.

Current timeout:

```text
180 seconds
```

---

## 20.8 Migration Job fails

Check:

```bash
kubectl get jobs -n smartcart
```

Then:

```bash
kubectl logs job/smartcart-db-migration -n smartcart
```

Check the backend image contains the expected layout:

```text
/app/alembic.ini
/app/backend/app
/app/backend/alembic
```

Do not relocate the application/Alembic source structure just to solve a container-path problem. The container layout should preserve the application's existing imports and Alembic configuration.

---

# 21. What We Intentionally Did Not Add

The Kubernetes implementation was kept focused.

We intentionally did not add unnecessary infrastructure just for resume keywords.

For this stage:

- Rolling update/rollback practical was skipped.
- No NetworkPolicy was added.
- No PDB was added.
- No unnecessary RBAC layer was added.
- No service mesh was added.
- No complex multi-cluster setup was added.

The objective is a smaller Kubernetes system that is actually understood and tested.

---

# 22. Current Kubernetes State

At the completion of this stage:

```text
KIND cluster                 ✅
Namespace                    ✅
ConfigMap                    ✅
Secret                       ✅
PostgreSQL StatefulSet       ✅
PostgreSQL PVC               ✅
Backend Deployment           ✅
Backend Service              ✅
Frontend Deployment          ✅
Frontend Service             ✅
Ollama Deployment            ✅
Ollama PVC                   ✅
Ollama Service               ✅
Ingress                      ✅
Probes                       ✅
Resource requests/limits     ✅
Metrics Server               ✅
HPA                          ✅
HPA load test 1 → 3 → 1      ✅
Alembic Migration Job        ✅
Database migration head      ✅
Application health           ✅
Product API                  ✅
AI through Kubernetes        ✅
```

---

# 23. Next Phase

The manual Kubernetes deployment is now complete.

The next phase is **Helm**.

The goal of Helm is not to change the SmartCart architecture. It will package the existing Kubernetes resources into a reusable chart so that we can manage configuration and deployments more cleanly.

We should first clean up the two obsolete PostgreSQL manifest files identified earlier, verify the application once more, and then create the SmartCart Helm chart.

---

## 23.1 Quick Reproduction Flow

For another engineer, the overall flow is:

```bash
kind create cluster --config kubernetes/kind/cluster.yaml

kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml

kind load docker-image smartcart-backend:1.2 --name smartcart
kind load docker-image smartcart-frontend:1.2 --name smartcart

kubectl apply -f kubernetes/postgres/statefulset.yaml -n smartcart
kubectl apply -f kubernetes/postgres/service.yaml -n smartcart

kubectl apply -f kubernetes/ollama/pvc.yaml -n smartcart
kubectl apply -f kubernetes/ollama/deployment.yaml -n smartcart
kubectl apply -f kubernetes/ollama/service.yaml -n smartcart

kubectl apply -f kubernetes/backend/deployment.yaml -n smartcart
kubectl apply -f kubernetes/backend/service.yaml -n smartcart

kubectl apply -f kubernetes/backend/migration-job.yaml -n smartcart

kubectl apply -f kubernetes/frontend/deployment.yaml -n smartcart
kubectl apply -f kubernetes/frontend/service.yaml -n smartcart

kubectl apply -f kubernetes/ingress.yaml -n smartcart

kubectl apply -f kubernetes/backend/hpa.yaml -n smartcart

kubectl get pods -n smartcart
kubectl get services -n smartcart
kubectl get pvc -n smartcart
kubectl get hpa -n smartcart
curl http://localhost:8082/api/health
```

> Image loading is required for the local KIND workflow because SmartCart images are currently built locally. Docker Hub publishing belongs to the later CI pipeline stage.

## Quick Reproduction Flow

Follow these steps in order when setting up SmartCart Kubernetes from scratch.

### 1. Check prerequisites

```bash
docker --version
kubectl version --client
kind version
helm version
```

### 2. Create the KIND cluster

```bash
kind create cluster --config kubernetes/kind/cluster.yaml
```

Verify:

```bash
kubectl get nodes
kubectl cluster-info
```

### 3. Create the namespace and application configuration

```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml
```

### 4. Load the locally built application images

For the current local KIND workflow:

```bash
kind load docker-image smartcart-backend:1.2 --name smartcart
kind load docker-image smartcart-frontend:1.2 --name smartcart
```

### 5. Deploy PostgreSQL

```bash
kubectl apply -f kubernetes/postgres/statefulset.yaml -n smartcart
kubectl apply -f kubernetes/postgres/service.yaml -n smartcart
```

Verify:

```bash
kubectl get pods -n smartcart
kubectl get pvc -n smartcart
```

### 6. Deploy Ollama

```bash
kubectl apply -f kubernetes/ollama/pvc.yaml -n smartcart
kubectl apply -f kubernetes/ollama/deployment.yaml -n smartcart
kubectl apply -f kubernetes/ollama/service.yaml -n smartcart
```

Verify:

```bash
kubectl get pods -n smartcart
kubectl get pvc -n smartcart
```

### 7. Deploy the backend

```bash
kubectl apply -f kubernetes/backend/deployment.yaml -n smartcart
kubectl apply -f kubernetes/backend/service.yaml -n smartcart
```

### 8. Run the database migration

```bash
kubectl apply -f kubernetes/backend/migration-job.yaml -n smartcart
```

Verify:

```bash
kubectl get jobs -n smartcart
kubectl logs job/smartcart-db-migration -n smartcart
```

### 9. Deploy the frontend

```bash
kubectl apply -f kubernetes/frontend/deployment.yaml -n smartcart
kubectl apply -f kubernetes/frontend/service.yaml -n smartcart
```

### 10. Deploy Ingress

First install the ingress-nginx controller:

```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace
```

Then apply the SmartCart Ingress:

```bash
kubectl apply -f kubernetes/ingress.yaml -n smartcart
```

For local access:

```bash
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8082:80
```

### 11. Install and verify Metrics Server

Install:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

For KIND, if kubelet certificate/IP SAN verification fails, add:

```text
--kubelet-insecure-tls
```

to the Metrics Server container arguments.

Verify:

```bash
kubectl get deployment metrics-server -n kube-system
kubectl top nodes
kubectl top pods -n smartcart
```

### 12. Deploy HPA

```bash
kubectl apply -f kubernetes/backend/hpa.yaml -n smartcart
```

Verify:

```bash
kubectl get hpa -n smartcart
```

### 13. Verify the complete application

```bash
kubectl get pods -n smartcart
kubectl get deployments -n smartcart
kubectl get services -n smartcart
kubectl get pvc -n smartcart
kubectl get hpa -n smartcart
kubectl get ingress -n smartcart
```

Application checks:

```bash
curl http://localhost:8082/api/health
curl http://localhost:8082/api/products
```

Open the frontend:

```text
http://localhost:8082
```

### 14. Optional: repeat the HPA load test

Create the temporary load generator:

```bash
kubectl run load-generator \
  -n smartcart \
  --image=busybox \
  --restart=Never \
  -- /bin/sh -c "while true; do wget -q -O- http://backend:8000/health; done"
```

Check:

```bash
kubectl get hpa -n smartcart
```

Expected behavior from the completed project test:

```text
1 backend replica
      ↓
high CPU (~274% / 70%)
      ↓
3 backend replicas
      ↓
delete load-generator
      ↓
CPU returns to ~3–4%
      ↓
1 backend replica
```

Stop the test:

```bash
kubectl delete pod load-generator -n smartcart
```

