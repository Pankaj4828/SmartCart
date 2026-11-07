variable "aws_region" {
  description = "AWS region for the development environment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "smartcart"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "kubernetes_version" {
  description = "Kubernetes version supported by EKS"
  type        = string
  default     = "1.34"
}

variable "node_instance_type" {
  description = "EC2 instance type for the EKS worker node"
  type        = string
  default     = "t3.medium"
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "Public IP CIDR blocks allowed to access the EKS API"
  type        = list(string)
}
