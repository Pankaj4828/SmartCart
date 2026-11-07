data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

module "eks" {
  source = "../../modules/eks"

  cluster_name                         = local.name_prefix
  kubernetes_version                   = var.kubernetes_version
  subnet_ids                           = data.aws_subnets.default.ids
  node_instance_type                   = var.node_instance_type
  cluster_endpoint_public_access_cidrs = var.cluster_endpoint_public_access_cidrs

  tags = local.common_tags
}


module "github_actions_iam" {
  source = "../../modules/iam"

  role_name             = "${local.name_prefix}-github-actions-deploy"
  github_repository     = "Pankaj4828/SmartCart"
  github_actions_branch = "main"
  eks_cluster_arn       = module.eks.cluster_arn
  tags                  = local.common_tags
}

resource "aws_eks_access_entry" "github_actions" {
  cluster_name  = module.eks.cluster_name
  principal_arn = module.github_actions_iam.github_actions_role_arn
  type          = "STANDARD"
  tags          = local.common_tags
}

resource "aws_eks_access_policy_association" "github_actions" {
  cluster_name  = module.eks.cluster_name
  principal_arn = module.github_actions_iam.github_actions_role_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"

  access_scope {
    type       = "namespace"
    namespaces = ["smartcart"]
  }

  depends_on = [aws_eks_access_entry.github_actions]
}