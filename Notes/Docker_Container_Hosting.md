# Docker Container Hosting - Complete Notes

> Comprehensive study notes on Docker container hosting. These notes cover the
> concepts, commands, configuration files, and practical workflows required to
> build, run, and host applications inside Docker containers.

---

## Table of Contents

1. [Introduction to Container Hosting](#1-introduction-to-container-hosting)
2. [Docker Architecture & Installation](#2-docker-architecture--installation)
3. [Docker Images, Dockerfile & Building Images](#3-docker-images-dockerfile--building-images)
4. [Volumes, Networking & Data Persistence](#4-volumes-networking--data-persistence)
5. [Docker Compose & Multi-Container Hosting](#5-docker-compose--multi-container-hosting)
6. [Orchestration: Docker Swarm & Kubernetes](#6-orchestration-docker-swarm--kubernetes)
7. [CI/CD, Security, Monitoring & Best Practices](#7-cicd-security-monitoring--best-practices)

---

## 1. Introduction to Container Hosting

### 1.1 What is Container Hosting?

- Container hosting is the practice of running applications inside lightweight,
  isolated runtime environments called **containers**.
- A container packages an application together with all its dependencies,
  libraries, configuration files, and even the operating system userland
  required to run it.
- Unlike virtual machines (VMs), containers share the host operating system
  kernel, which makes them extremely lightweight and fast to start.
- Docker is the most widely adopted container engine and platform for container
  hosting.
- Container hosting on a server means the server runs a container runtime such
  as Docker, and applications are shipped as images that get instantiated as
  running containers.
- Hosting containers is about managing the full lifecycle: build the image,
  store it in a registry, pull it on the host, run the container, expose ports,
  mount volumes, monitor health, and update the application.

### 1.2 Containers vs Virtual Machines

| Feature            | Containers                    | Virtual Machines                  |
|--------------------|-------------------------------|-----------------------------------|
| Kernel             | Shared host kernel            | Own full OS via hypervisor       |
| Startup time       | Milliseconds                  | Seconds to minutes               |
| Size               | MBs                           | GBs                              |
| Density            | Many per host                 | Few per host                     |
| Isolation          | Process/namespace level       | Hardware-level                    |
| Resource usage     | Low overhead                  | High overhead                     |
| Portability        | Very high                     | Medium                            |
| Performance        | Near native                   | Slight virtualization overhead   |

### 1.3 Why Use Container Hosting?

- **Consistency**: The same image runs identically on a laptop, CI server, or
  production cloud instance.
- **Isolation**: Each service runs in its own sandbox, reducing conflicts
  between dependencies.
- **Portability**: Images can move freely between on-premise servers and any
  cloud provider.
- **Scalability**: Containers can be scaled horizontally by running multiple
  replicas behind a load balancer.
- **Efficiency**: Higher server utilization because many containers share one
  OS kernel.
- **Speed of delivery**: Containers can be started in under a second, enabling
  rapid deployments and rollbacks.

### 1.4 Common Container Hosting Scenarios

1. Hosting a single web application such as Nginx, Apache, or Node.js.
2. Hosting a database such as PostgreSQL, MySQL, or Redis inside a container.
3. Running development environments that mimic production exactly.
4. Running CI/CD build agents and pipelines.
5. Microservices architectures where each service is its own container.
6. Running scheduled batch jobs and workers.
7. Hosting analytics, ML models, and message queues.

### 1.5 Key Concepts in Docker Hosting

- **Image**: A read-only template with instructions for creating a container.
- **Container**: A runnable instance of an image.
- **Dockerfile**: The recipe file used to build an image.
- **Registry**: A service that stores and distributes images (Docker Hub,
  AWS ECR, Google Artifact Registry).
- **Docker Engine**: The core daemon (`dockerd`) plus CLI that runs containers.
- **Volume**: Persistent data stored outside the container filesystem.
- **Network**: A virtual network connecting containers to each other and to the
  host.
- **Compose**: A tool for defining and running multi-container applications.
- **Orchestrator**: Software (Swarm, Kubernetes) that manages many containers
  across many hosts.

### 1.6 Container Lifecycle

1. **Build**: Create an image from a Dockerfile.
2. **Push**: Upload the image to a registry.
3. **Pull**: Download the image onto the target host.
4. **Run**: Create and start a container from the image.
5. **Inspect**: Check logs, processes, and metadata.
6. **Pause/Resume**: Temporarily freeze processes.
7. **Restart**: Stop and start again, applying policies.
8. **Stop**: Gracefully terminate.
9. **Kill**: Force terminate.
10. **Remove**: Delete the container (and optionally its data).
11. **Prune**: Clean up unused images, containers, volumes, networks.

### 1.7 Where Can You Host Containers?

- **On-premise servers**: Bare metal or virtual machines with Docker installed.
- **Cloud VM instances**: AWS EC2, Azure VMs, GCP Compute Engine.
- **Managed container services**: AWS ECS, AWS EKS, Azure AKS, Google GKE.
- **Docker-specific clouds**: Docker Cloud, DigitalOcean Droplets.
- **Edge/IoT devices**: Raspberry Pi and other lightweight hosts.
- **Local development machines**: All the cloud behaviours can be emulated on a
  laptop using Docker Desktop.

### 1.8 Summary

Container hosting with Docker changes the way applications are deployed. Instead
of manually configuring servers, everything an application needs is captured in
an image. Deployment becomes predictable, reproducible, and easy to scale.
The remainder of these notes go step by step through Docker architecture,
installation, image building, storage, networking, multi-container apps,
orchestration, and production best practices.