# SmartCart

## AI-Powered E-Commerce Platform

SmartCart is an AI-powered e-commerce application built as a hands-on DevOps portfolio project. It combines a working application with containerization, local Kubernetes deployment, CI/CD, GitOps, security scanning and observability.

The repository is organized by implementation stage:

- **`main` branch:** The completed local implementation using Docker, KIND, Helm, GitHub Actions and Argo CD.
- **`terra-aws` branch:** The AWS extension, covering Terraform, Amazon EKS, AWS infrastructure, IAM, storage integration, Vault-based secrets management and AWS deployment verification.

The AWS Phase 3 environment was deployed and verified, then intentionally destroyed to avoid ongoing cloud costs. The Terraform bootstrap configuration and remote-state S3 bucket were retained. The `terra-aws` branch preserves the AWS implementation and its documentation.

---

## Application Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React + TypeScript | E-commerce user interface |
| Backend | Python + FastAPI | REST APIs and application logic |
| Database | PostgreSQL | Persistent relational data |
| Cache | Redis | In-memory application support |
| AI runtime | Ollama | Local model runtime for the AI assistant |

## DevOps Stack — `main`

- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes, KIND
- **Packaging:** Helm
- **CI/CD:** GitHub Actions
- **GitOps:** Argo CD
- **Security:** Gitleaks, Semgrep, dependency auditing, Trivy
- **Observability:** OpenTelemetry, Prometheus, Grafana, Tempo

## Architecture

The `main` branch focuses on the local Kubernetes and GitOps workflow. KIND (Kubernetes IN Docker) provides the local Kubernetes cluster used to deploy and validate SmartCart.

![SmartCart local KIND GitOps architecture](docs/screenshots/SmartCart_GitOps_Architecture_updated.gif)

### Application component flow

```text
                         User
                           |
                           v
                  React + TypeScript
                           |
                           v
                        FastAPI
                     /     |      \
                    v      v       v
              PostgreSQL  Redis  Ollama
```

### Local deployment flow

1. Developers push application and deployment changes to GitHub.
2. GitHub Actions validates the backend and frontend, runs security checks, builds container images and scans them.
3. Successful image builds are published with commit-SHA tags.
4. The workflow updates the image tags in the Helm values file.
5. Argo CD detects the Git change and reconciles the desired application state into the local KIND cluster.
6. SmartCart and its supporting services run in Kubernetes, with observability and secrets-management components configured in the cluster.

---

## Local Quick Start

### Prerequisites

Install the following tools before starting:

- Git
- Docker Engine or Docker Desktop with Docker Compose
- KIND
- kubectl
- Helm

Check that the tools are available:

```bash
git --version
docker --version
docker compose version
kind version
kubectl version --client
helm version
```

### 1. Clone the repository

```bash
git clone https://github.com/Pankaj4828/SmartCart.git
cd SmartCart
```

Make sure you are on the local implementation branch:

```bash
git checkout main
```

### 2. Start the application with Docker Compose

From the repository root:

```bash
docker compose up --build -d
docker compose ps
```

Follow the service logs:

```bash
docker compose logs -f
```

Stop the Compose services when finished:

```bash
docker compose down
```

### 3. Create the local KIND cluster

The project KIND configuration defines a local cluster with one control-plane node and two worker nodes.

```bash
kind create cluster --config kubernetes/kind/cluster.yaml
kubectl cluster-info --context kind-smartcart
kubectl get nodes -o wide
```

### 4. Deploy SmartCart through Argo CD

Install and configure Argo CD using the repository's setup guide:

[Argo CD setup guide](docs/ARGOCD_SETUP.md)

Apply the SmartCart Argo CD Application manifest:

```bash
kubectl apply -f argocd/smartcart-application.yaml
```

Check the application and workloads:

```bash
kubectl get applications -n argocd
kubectl get pods -n smartcart-gitops
kubectl get services -n smartcart-gitops
```

Argo CD uses the SmartCart Helm chart under `helm/smartcart` to manage the Kubernetes deployment.

### 5. Validate the Helm chart

```bash
helm lint helm/smartcart
helm template smartcart helm/smartcart \
  --namespace smartcart-helm \
  --set vault.role=smartcart-helm
```

The chart includes resources that depend on the relevant Vault and Vault Secrets Operator CRDs and configuration. Use the repository setup documentation for the complete installation order. Avoid managing the same release simultaneously through the Helm CLI and Argo CD.

### 6. Access the application

Use the service and port-forward configuration defined by the deployment. For example, the frontend was verified using:

```bash
kubectl port-forward -n smartcart-gitops svc/frontend 8082:80
```

Then open:

```text
http://localhost:8082
```

---

## CI/CD Pipeline

The GitHub Actions workflow is defined in `.github/workflows/ci.yml`. The configured workflow runs on pushes to the `main` branch.

The pipeline includes the following stages:

1. **Backend validation:** Installs dependencies, runs backend tests and migration checks, and performs dependency auditing.
2. **Frontend validation:** Installs dependencies, runs frontend tests, lints the source and builds the frontend.
3. **Secret scanning:** Runs Gitleaks against checked-out repository files.
4. **Static analysis:** Runs Semgrep against backend and frontend application source.
5. **Container build:** Builds backend and frontend images using Docker Buildx.
6. **Image scanning:** Uses Trivy to scan both images for HIGH and CRITICAL vulnerabilities.
7. **Image publishing:** Publishes images with commit-SHA tags after the required validation and security jobs succeed.
8. **GitOps update:** Updates image tags in `helm/smartcart/values.yaml` and commits the updated values for Argo CD to reconcile.

---

## GitOps, Security and Observability

### Argo CD and Helm

Helm packages the SmartCart Kubernetes resources under `helm/smartcart`. Argo CD monitors the Git repository and compares the declared configuration with the live cluster. When the pipeline updates the image tags in Git, Argo CD detects the change and reconciles the application.

### Security checks

| Tool / check | Purpose |
|---|---|
| Gitleaks | Scans checked-out repository files for exposed secrets |
| Semgrep | Static analysis of backend and frontend application source |
| Dependency auditing | Checks backend and frontend dependencies |
| Trivy | Scans built backend and frontend container images for HIGH and CRITICAL vulnerabilities |

### Observability

- **Prometheus** collects application and infrastructure metrics.
- **Grafana** provides dashboards and data-source access.
- **OpenTelemetry** instruments application telemetry.
- **Tempo** stores and serves distributed traces.

### Secrets management

The local platform includes HashiCorp Vault and Vault Secrets Operator integration. Vault stores application secrets, while the operator uses the configured Vault connection and Kubernetes authentication resources to synchronize required values into Kubernetes Secrets consumed by SmartCart workloads.

---

## Project Screenshots

### 1. SmartCart Application

Screenshot of the running e-commerce application.

![SmartCart Application](docs/screenshots/smartcart-application.png)

### 2. Argo CD GitOps

Argo CD application view showing synchronization status, health status and deployed Kubernetes resources.

![Argo CD SmartCart Application](docs/screenshots/argocd-application.png)

### 3. Grafana Monitoring

Grafana dashboard showing SmartCart application metrics and infrastructure monitoring.

![Grafana SmartCart Dashboard](docs/screenshots/grafana-dashboard.png)

### 4. GitHub Actions CI/CD

GitHub Actions workflow showing the CI/CD pipeline and its execution results.

![GitHub Actions CI/CD Pipeline](docs/screenshots/cicd-pipeline.png)

---

## AWS Extension — `terra-aws` Branch

The AWS implementation is maintained separately so the local KIND implementation on `main` remains focused and easy to run.

Explore the AWS work in the [`terra-aws` branch](https://github.com/Pankaj4828/SmartCart/tree/terra-aws).

That branch covers:

- Terraform-managed AWS infrastructure.
- Amazon EKS cluster and managed worker nodes.
- IAM roles, policies, EKS access configuration and GitHub OIDC setup.
- EKS Pod Identity and the EBS CSI driver.
- Argo CD deployment of the SmartCart Helm chart to EKS.
- HashiCorp Vault and Vault Secrets Operator integration.
- Prometheus, Grafana, Tempo and OpenTelemetry on EKS.
- AWS deployment verification, troubleshooting and teardown documentation.

### AWS Phase 3 status

The Phase 3 EKS environment was deployed and verified. The SmartCart Argo CD application reached Synced / Healthy, the database migration Job completed, PostgreSQL reached Running, and the frontend was accessed through Kubernetes port-forwarding.

After verification, the Phase 3 AWS resources were intentionally destroyed to avoid ongoing cloud costs. The Terraform bootstrap configuration and remote-state S3 bucket were retained. The AWS implementation and closeout details remain documented in the `terra-aws` branch.

The AWS deployment used Docker Hub for SmartCart container images. ECR appears in the AWS architecture illustration as a conceptual component; it was not part of the deployed Phase 3 Terraform resources. The AWS deployment did not expose the application through a public ALB or Ingress.

---

## Documentation

### Local KIND implementation (`main`)

- [Architecture overview](docs/ARCHITECTURE.md)
- [Kubernetes guide](docs/kubernetes.md)
- [Helm guide](docs/helm.md)
- [Argo CD setup](docs/ARGOCD_SETUP.md)
- [Argo CD and observability setup](docs/argocd-observability-setup.md)

### AWS implementation (`terra-aws`)

- [AWS implementation and documentation](https://github.com/Pankaj4828/SmartCart/tree/terra-aws/docs/aws)
- [Phase 3 final closeout](https://github.com/Pankaj4828/SmartCart/blob/terra-aws/docs/aws/SmartCart_Phase3_Final_Closeout.md)

---

## Project Summary

SmartCart brings together application development and a practical DevOps delivery workflow. The `main` branch demonstrates the local Docker, KIND, Helm, GitHub Actions and Argo CD implementation. The `terra-aws` branch contains the AWS extension, including Terraform, EKS, IAM, storage, secrets management, observability and Phase 3 deployment verification.

The two branches show the progression from a local Kubernetes deployment to an AWS-managed Kubernetes environment, while keeping the local quick-start path straightforward.
