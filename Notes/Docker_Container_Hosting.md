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

---

## 2. Docker Architecture & Installation

### 2.1 Docker Platform Components

Docker is not a single program. It is a client-server platform built from
several components working together:

1. **Docker Daemon (`dockerd`)**: The background server process running on the
   host. It manages images, containers, networks, and storage volumes.
2. **Docker Client (`docker`)**: The command line tool a user interacts with. It
   talks to the daemon over a socket (by default a Unix socket or a
   TCP endpoint on Windows).
3. **REST API**: The interface between the client and daemon. Third-party tools
   can also speak to the daemon over this API.
4. **Docker Registries**: Remote services that store images. Docker Hub is the
   default, but private registries are common in enterprises.
5. **containerd**: The high-level container runtime used by the daemon to
   execute containers.
6. **runc**: The low-level runtime that actually spawns containers using Linux
   kernel namespaces and cgroups.

### 2.2 Client-Server Model

- The Docker CLI on your laptop can control a daemon running on a remote server
  by setting the `DOCKER_HOST` environment variable.
- Example: `DOCKER_HOST=tcp://1.2.3.4:2375 docker ps`
- Docker Desktop on Windows and macOS runs the daemon inside a small Linux VM,
  because Docker containers require Linux kernel features.

### 2.3 Linux Kernel Technologies Behind Docker

| Technology  | Purpose                                                    |
|-------------|------------------------------------------------------------|
| Namespaces  | Isolate processes, filesystems, networking, and users      |
| cgroups     | Limit and monitor CPU, memory, and I/O per container       |
| UnionFS     | Layered filesystem used for images (overlay2 is standard)  |
| Seccomp     | Restrict the system calls a container can make             |
| Capabilities| Drop or add kernel privileges for a container              |
| Netfilter   | Enables bridge networking and port mapping via iptables    |

### 2.4 Docker Installation on Linux

On a Debian/Ubuntu host the recommended approach is to use the official Docker
APT repository.

1. Update packages: `sudo apt update`
2. Install prerequisite packages:
   - `sudo apt install ca-certificates curl gnupg lsb-release`
3. Add the Docker GPG key and repository.
4. Install the engine:
   - `sudo apt install docker-ce docker-ce-cli containerd.io`
5. Verify:
   - `sudo systemctl enable --now docker`
   - `docker --version`
   - `sudo docker run hello-world`

### 2.5 Running Docker Without sudo

The `docker` group allows users to access the daemon socket:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Security note: anyone in the `docker` group effectively has root access to the
host, because they can mount host directories and run privileged containers.

### 2.6 Docker Desktop on Windows

- Docker Desktop provides Docker Engine, Docker CLI, Docker Compose, Kubernetes,
  and a GUI dashboard.
- It uses Windows Subsystem for Linux 2 (WSL2) as the backend by default.
- WSL2 gives near-native Linux performance inside Windows.
- Enable WSL2: `wsl --set-default-version 2`
- After installing, verify with `docker version` and `docker run hello-world`.
- Settings in the Docker Desktop tray allow switching between Linux containers
  and (on some setups) Windows containers.

### 2.7 Docker on macOS

- Docker Desktop for Mac also uses a lightweight Linux VM.
- Supports both Intel and Apple Silicon chips.
- The VM resources (CPU, memory, disk) can be tuned in Docker Desktop
  preferences.

### 2.8 Verifying Installation

Common verification commands:

```bash
docker version          # client and server version info
docker info             # detailed system-wide info and metrics
docker run hello-world  # smoke test that pulls and runs a test image
docker image ls         # list local images
docker ps -a            # list all containers (running and stopped)
```

### 2.9 Docker vs other runtimes

- **containerd**: A production-grade container runtime, can be used standalone
  with tools like `nerdctl`.
- **Podman**: A daemonless alternative, compatible with Docker CLI syntax.
- **CRI-O**: A runtime built specifically for Kubernetes.
- **Kata Containers**: Run containers inside lightweight VMs for extra isolation.
- **containerd**: The runtime Kubernetes uses by default through its CRI plugin.

### 2.10 Docker context and configuration

- `/etc/docker/daemon.json` holds daemon configuration (storage driver, debug,
  insecure registries, log limits).
- `daemon.json` example for limiting log size:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

- After changing `daemon.json` restart with `sudo systemctl restart docker` or
  `sudo kill -SIGHUP $(pidof dockerd)`.

### 2.11 Upgrading and removal

- Upgrade: `sudo apt update && sudo apt upgrade docker-ce`
- Remove completely:
  - `sudo apt purge docker-ce docker-ce-cli containerd.io`
  - `sudo rm -rf /var/lib/docker`
- The `/var/lib/docker` directory contains all images, containers, and volumes.
  Removing it permanently deletes local data unless off-host backups exist.

### 2.12 Summary

Docker is a client-server platform built on Linux kernel isolation features.
Installing Docker is straightforward on every major operating system. After
installation the daemon runs constantly, and the CLI is used to talk to it. This
foundation supports all the image building and hosting workflows covered next.