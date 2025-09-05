# Configure the Google Cloud Provider
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state storage
  backend "gcs" {
    bucket = "affine-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Variables
variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "Google Cloud Zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Cloud SQL instance for PostgreSQL
resource "google_sql_database_instance" "affine_db" {
  name                = "affine-postgres-${var.environment}"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = false

  settings {
    tier                        = "db-f1-micro"
    availability_type           = "ZONAL"
    disk_type                   = "PD_SSD"
    disk_size                   = 20
    disk_autoresize             = true
    disk_autoresize_limit       = 100
    deletion_protection_enabled = false

    database_flags {
      name  = "shared_preload_libraries"
      value = "vector"
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled                                  = true
      private_network                               = google_compute_network.affine_network.id
      enable_private_path_for_google_cloud_services = true
      authorized_networks {
        value = "0.0.0.0/0"
      }
    }
  }

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Database
resource "google_sql_database" "affine_database" {
  name     = "affine"
  instance = google_sql_database_instance.affine_db.name
}

# Database user
resource "google_sql_user" "affine_user" {
  name     = "affine"
  instance = google_sql_database_instance.affine_db.name
  password = random_password.db_password.result
}

# Redis instance (Memorystore)
resource "google_redis_instance" "affine_redis" {
  name           = "affine-redis-${var.environment}"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  location_id             = var.zone
  alternative_location_id = "${var.region}-b"

  authorized_network = google_compute_network.affine_network.id
  connect_mode       = "PRIVATE_SERVICE_ACCESS"

  redis_version     = "REDIS_7_0"
  display_name      = "AFFiNE Redis Cache"
  reserved_ip_range = "10.2.0.0/29"
}

# VPC Network
resource "google_compute_network" "affine_network" {
  name                    = "affine-network"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "affine_subnet" {
  name          = "affine-subnet"
  ip_cidr_range = "10.1.0.0/24"
  region        = var.region
  network       = google_compute_network.affine_network.id

  private_ip_google_access = true
}

# Private service access
resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.affine_network.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.affine_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Container Registry
resource "google_artifact_registry_repository" "affine_repo" {
  location      = var.region
  repository_id = "affine"
  description   = "AFFiNE Docker repository"
  format        = "DOCKER"
}

# Cloud Run Service
resource "google_cloud_run_service" "affine_service" {
  name     = "affine-service"
  location = var.region

  template {
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale"         = "1"
        "autoscaling.knative.dev/maxScale"         = "10"
        "run.googleapis.com/cloudsql-instances"    = google_sql_database_instance.affine_db.connection_name
        "run.googleapis.com/vpc-access-connector"  = google_vpc_access_connector.affine_connector.name
        "run.googleapis.com/vpc-access-egress"     = "all-traffic"
      }
    }

    spec {
      container_concurrency = 80
      timeout_seconds       = 300
      service_account_name  = google_service_account.affine_service_account.email

      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/affine/affine:latest"

        ports {
          container_port = 3010
        }

        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
          requests = {
            cpu    = "1000m"
            memory = "1Gi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.affine_user.name}:${random_password.db_password.result}@${google_sql_database_instance.affine_db.private_ip_address}:5432/${google_sql_database.affine_database.name}"
        }

        env {
          name  = "REDIS_SERVER_HOST"
          value = google_redis_instance.affine_redis.host
        }

        env {
          name  = "REDIS_SERVER_PORT"
          value = tostring(google_redis_instance.affine_redis.port)
        }

        env {
          name  = "PORT"
          value = "3010"
        }

        env {
          name  = "AFFINE_SERVER_HOST"
          value = "affine.example.com"
        }

        env {
          name  = "AFFINE_SERVER_HTTPS"
          value = "true"
        }

        env {
          name = "NEXTAUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.nextauth_secret.secret
              key  = "latest"
            }
          }
        }

        env {
          name = "AFFINE_JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret_version.jwt_secret.secret
              key  = "latest"
            }
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.cloud_run_api,
    google_project_service.sql_admin_api,
    google_project_service.redis_api,
  ]
}

# VPC Access Connector
resource "google_vpc_access_connector" "affine_connector" {
  name          = "affine-connector"
  region        = var.region
  ip_cidr_range = "10.3.0.0/28"
  network       = google_compute_network.affine_network.name
}

# IAM Service Account
resource "google_service_account" "affine_service_account" {
  account_id   = "affine-service"
  display_name = "AFFiNE Service Account"
}

# IAM bindings
resource "google_project_iam_member" "affine_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.affine_service_account.email}"
}

resource "google_project_iam_member" "affine_redis_editor" {
  project = var.project_id
  role    = "roles/redis.editor"
  member  = "serviceAccount:${google_service_account.affine_service_account.email}"
}

resource "google_project_iam_member" "affine_secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.affine_service_account.email}"
}

# Allow public access to Cloud Run
resource "google_cloud_run_service_iam_member" "affine_public_access" {
  location = google_cloud_run_service.affine_service.location
  project  = google_cloud_run_service.affine_service.project
  service  = google_cloud_run_service.affine_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secret Manager secrets
resource "random_password" "nextauth_secret" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

resource "google_secret_manager_secret" "nextauth_secret" {
  secret_id = "nextauth-secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "nextauth_secret" {
  secret      = google_secret_manager_secret.nextauth_secret.id
  secret_data = random_password.nextauth_secret.result
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# Enable required APIs
resource "google_project_service" "cloud_run_api" {
  service = "run.googleapis.com"
}

resource "google_project_service" "sql_admin_api" {
  service = "sqladmin.googleapis.com"
}

resource "google_project_service" "redis_api" {
  service = "redis.googleapis.com"
}

resource "google_project_service" "vpcaccess_api" {
  service = "vpcaccess.googleapis.com"
}

resource "google_project_service" "secretmanager_api" {
  service = "secretmanager.googleapis.com"
}

resource "google_project_service" "servicenetworking_api" {
  service = "servicenetworking.googleapis.com"
}

# Outputs
output "cloud_run_url" {
  value = google_cloud_run_service.affine_service.status[0].url
}

output "database_connection_string" {
  value     = "postgresql://${google_sql_user.affine_user.name}:${random_password.db_password.result}@${google_sql_database_instance.affine_db.private_ip_address}:5432/${google_sql_database.affine_database.name}"
  sensitive = true
}

output "redis_host" {
  value = google_redis_instance.affine_redis.host
}

output "container_registry" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/affine"
}
