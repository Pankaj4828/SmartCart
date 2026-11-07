variable "role_name" {
  description = "Name of the IAM role assumed by GitHub Actions"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in OWNER/REPOSITORY format"
  type        = string
}

variable "github_actions_branch" {
  description = "Branch allowed to assume the GitHub Actions IAM role"
  type        = string
}

variable "eks_cluster_arn" {
  description = "ARN of the EKS cluster that GitHub Actions can describe"
  type        = string
}

variable "tags" {
  description = "Tags applied to IAM resources"
  type        = map(string)
  default     = {}
}
