terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-west-1"
  access_key = "${access_key}"
  secret_key = "${secret_key}"
}

resource "aws_ami_copy" "copy_ami" {
  name              = "backend-ami"
  description       = "A copy of ami-070aad77fce02184a"
  source_ami_id     = "ami-070aad77fce02184a"
  source_ami_region = "us-east-2"

  tags = {
    Name = "Backend"
  }
}

resource "aws_default_subnet" "default_az1" {
  availability_zone = "us-west-1a"

  tags = {
    Name = "Default subnet for us-west-1a"
  }
}

resource "aws_default_subnet" "default_az2" {
  availability_zone = "us-west-1b"

  tags = {
    Name = "Default subnet for us-west-1b"
  }
}

resource "aws_lb" "test" {
  name               = "test-lb-tf"
  internal           = false
  load_balancer_type = "application"

  enable_deletion_protection = false

  subnet_mapping {
    subnet_id            = aws_default_subnet.default_az1.id
  }
  subnet_mapping {
    subnet_id            = aws_default_subnet.default_az2.id
  }

  tags = {
    Environment = "production"
  }
}

resource "aws_launch_template" "backend" {
  name_prefix   = "backend"
  image_id      = aws_ami_copy.copy_ami.id
  instance_type = "t2.micro"
}

resource "aws_autoscaling_group" "bar" {
  availability_zones = ["us-west-1a", "us-west-1b"]
  desired_capacity   = 1
  max_size           = 2
  min_size           = 1

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  health_check_type = "ELB"
}

resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_alb_target_group" "test" {
  name     = "tf-example-lb-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_default_vpc.default.id
}

resource "aws_autoscaling_attachment" "asg_attachment_bar" {
  autoscaling_group_name = aws_autoscaling_group.bar.id
  alb_target_group_arn   = aws_alb_target_group.test.arn
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.test.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.test.arn
  }
}

resource "aws_elasticache_cluster" "example" {
  cluster_id           = "cluster-example"
  engine               = "redis"
  node_type            = "cache.t2.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis3.2"
  engine_version       = "3.2.10"
  port                 = 6379
}

#resource "aws_lb" "default" { } 