output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_arn" {
  description = "ARN of the EKS cluster"
  value       = module.eks.cluster_arn
}

output "node_group_name" {
  description = "Name of the managed EKS worker node group"
  value       = module.eks.node_group_name
}


output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC deployment"
  value       = module.github_actions_iam.github_actions_role_arn
}