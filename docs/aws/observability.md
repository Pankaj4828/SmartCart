# AWS Observability

## Components
AWS values are under `kubernetes/aws/` and deployed using separate Argo CD Applications.

| Component | Values file | Purpose |
|---|---|---|
| Metrics Server | `metrics-server/values.yaml` | Resource metrics for HPA and `kubectl top` |
| kube-prometheus-stack | `monitoring/values.yaml` | Prometheus, Grafana, Operator, node exporter and kube-state-metrics |
| Tempo | `tempo/values.yaml` | Distributed tracing |

## Metrics Server
`argocd/metrics-server-application.yaml` pins chart `3.14.0`, uses the Kubernetes SIGs Helm repository and reads values from branch `terra-aws`. It deploys into `kube-system`. Verify the deployment and metrics API after sync.

## Prometheus and Grafana
`argocd/monitoring-application.yaml` pins `kube-prometheus-stack` chart `93.1.1` from Prometheus Community.

Current values enable Prometheus and Grafana, disable Alertmanager, enable node exporter and kube-state-metrics, configure one Prometheus replica and 24-hour retention, and configure a gp3 PVC for Prometheus. Grafana has Tempo configured as an additional data source at:
```text
http://tempo.tempo.svc.cluster.local:3200
```

## Backend metrics
The SmartCart chart includes `backend-servicemonitor.yaml`. It selects backend Services labeled `app: backend`, looks in namespace `smartcart-gitops`, scrapes `/metrics` using the Service port named `http`, and uses label `release: monitoring`. The scrape interval is 15 seconds.

The backend exposes metrics using `prometheus_fastapi_instrumentator`. Keep Service labels and the named port aligned with the ServiceMonitor and verify the target in Prometheus.

## Tempo and traces
`argocd/tempo-application.yaml` pins Grafana Community Tempo chart `3.2.1`.

The backend sends traces directly to Tempo over OTLP gRPC at:
```text
tempo.tempo.svc.cluster.local:4317
```
Grafana queries Tempo through port `3200`. The described path does not use an OpenTelemetry Collector.

## Validation
Before deployment, lint/render charts and verify chart versions, values, gp3 storage and ServiceMonitor selectors. After deployment, verify Metrics Server, Prometheus targets, Grafana data sources and trace ingestion.

Review configured resource requests and limits against available node capacity before deployment.
