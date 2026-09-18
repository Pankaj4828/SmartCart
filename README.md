# SmartCart

## AI-Powered E-Commerce Platform

SmartCart is a modern AI-powered e-commerce platform designed as a
production-style DevOps portfolio project.

The project combines a real application with modern DevOps,
cloud, security, observability, Kubernetes, and GitOps practices.

## Project Goals

- Build a functional e-commerce application
- Add an AI-powered shopping assistant
- Containerize the application with Docker
- Deploy the application to Kubernetes using KIND
- Package Kubernetes resources with Helm
- Implement CI/CD with GitHub Actions
- Add DevSecOps security scanning
- Implement observability using OpenTelemetry, Prometheus, Grafana, and Tempo
- Implement GitOps using ArgoCD
- Extend the platform to AWS using Terraform and Ansible

## Application Stack

- React + TypeScript
- Python + FastAPI
- PostgreSQL
- Redis
- Ollama

## DevOps Stack

- Docker
- Docker Compose
- Kubernetes
- KIND
- Helm
- GitHub Actions
- ArgoCD
- Terraform
- Ansible

## Security

- Semgrep
- Gitleaks
- Dependency vulnerability scanning
- Trivy
- SBOM generation
- Container image signing

## Observability

- OpenTelemetry
- Prometheus
- Grafana
- Tempo

## Architecture

```text
User
  |
  v
React + TypeScript
  |
  v
FastAPI
  |
  +---- PostgreSQL
  |
  +---- Redis
  |
  +---- Ollama