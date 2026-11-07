output "github_actions_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions through OIDC"
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_role_name" {
  description = "IAM role name assumed by GitHub Actions through OIDC"
  value       = aws_iam_role.github_actions.name
}
