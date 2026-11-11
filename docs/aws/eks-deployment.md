# AWS EKS Deployment

## Cluster
The Terraform EKS module creates the cluster and managed node group. The intended dev cluster name is `smartcart-dev`. The dev environment discovers the default VPC and its default subnets. Verify that the selected subnets are suitable and span the required Availability Zones before applying.

The cluster configures API and ConfigMap authentication, bootstrap administrator permissions, and both private and public API endpoint access. Public endpoint access is restricted by the configured CIDR list.

The managed node group uses the configured scaling values and instance type. The selected worker type for this project is `t3.medium`; verify the active variable values before deployment.

## Pod Identity and EBS CSI
Terraform installs the `eks-pod-identity-agent` add-on. It creates an IAM role trusted by `pods.eks.amazonaws.com`, attaches `AmazonEBSCSIDriverPolicyV2`, associates the role with service account `ebs-csi-controller-sa` in `kube-system`, and installs the `aws-ebs-csi-driver` add-on.

Verify both add-ons and the association after the cluster is created.

## gp3 StorageClass
`kubernetes/aws/storageclass-gp3.yaml` defines:
- Name `gp3`
- Provisioner `ebs.csi.aws.com`
- Volume type `gp3`
- Encryption enabled
- `WaitForFirstConsumer` binding
- `Delete` reclaim policy

It is a standalone manifest, not one of the listed Argo CD Applications. After the EBS CSI driver is ready:
```bash
kubectl apply -f kubernetes/aws/storageclass-gp3.yaml
kubectl get storageclass gp3
```

With reclaim policy `Delete`, dynamically provisioned EBS volumes may be deleted when their PVCs are deleted. Take care with persistent data.

## kubectl access
After the cluster is deployed:
```bash
aws eks update-kubeconfig --region us-west-2 --name smartcart-dev
kubectl get nodes
kubectl get pods -A
```
Use the actual region and cluster name from the active Terraform environment. Do not rely on stale kubeconfig contexts from a destroyed cluster.

## Prerequisites and costs
Before workloads are deployed, verify nodes, Pod Identity Agent, EBS CSI, gp3 StorageClass and Argo CD. EKS, EC2 nodes and EBS volumes can incur charges; follow the Terraform cleanup guide after testing.
