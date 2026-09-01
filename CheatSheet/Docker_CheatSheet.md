# 🐳 Docker Cheat Sheet

> **Assignment Topic:** Docker & Containerization
> **Author:** Manish Kumar
> **Branch:** `manish-dpp`

A comprehensive quick-reference for Docker — from basics to production workflows. Everything you need to install, build, run, manage, and debug containers and images.

---

## 📦 Table of Contents

1. [What is Docker?](#what-is-docker)
2. [Installation](#installation)
3. [Docker Architecture & Core Concepts](#docker-architecture--core-concepts)
4. [The Dockerfile](#the-dockerfile)
5. [Building Images](#building-images)
6. [Running Containers](#running-containers)
7. [Managing Containers](#managing-containers)
8. [Images: Lifecycle & Management](#images-lifecycle--management)
9. [Volumes & Data Persistence](#volumes--data-persistence)
10. [Networking](#networking)
11. [Docker Compose](#docker-compose)
12. [Logs & Debugging](#logs--debugging)
13. [Registry & Distribution](#registry--distribution)
14. [Docker daemon & System Commands](#docker-daemon--system-commands)
15. [Best Practices & Security](#best-practices--security)
16. [Blitz: Top 20 One-Liners](#blitz-top-20-one-liners)

---

## 1. What is Docker?

Docker is an **open-source platform** for developing, shipping, and running applications inside **lightweight, isolated environments called containers**.

- **Containers** package an application with all its dependencies (code, runtime, libraries, config) so it runs **identically on any machine**.
- Containers share the **host OS kernel** — that's what makes them far lighter and faster than virtual machines (VMs).

### Container vs Virtual Machine

| Feature            | Container               | Virtual Machine            |
|--------------------|-------------------------|----------------------------|
| OS                 | Shares host kernel      | Own full guest OS          |
| Size               | MBs                     | GBs                        |
| Boot time          | Seconds (near instant)  | Minutes                    |
| Performance        | Near-native             | Some overhead              |
| Isolation          | Process-level           | Full hardware isolation    |
| Resource usage     | Low                     | High                       |

---

## 2. Installation

### Linux (Ubuntu/Debian)
```bash
# Add Docker's official GPG key & repo, then:
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io
# Verify
docker --version
```

### macOS (Homebrew)
```bash
brew install --cask docker        # Docker Desktop
```

### Windows
Install **Docker Desktop** — supports both Windows + Linux containers (WSL2 backend recommended).

### Verify your install
```bash
docker --version        # Client version
docker info             # Daemon status & system info
docker run hello-world # Smoke test — pulls and runs a hello-world image
```

> **Permission note (Linux):** add your user to the `docker` group to run without `sudo`:
> `sudo usermod -aG docker $USER` and re-login.

---

## 3. Docker Architecture & Core Concepts

```
┌─────────────────────────────────────────────────────────┐
│  Client (docker CLI)              Docker Host            │
│   docker build/run/pull   ────►    docker daemon (dockerd)│
│                                          │               │
│                              ┌───────────┴───────────┐   │
│                              │ Images     Containers  │   │
│                              │ Volumes    Networks    │   │
│                              └───────────────────────┘   │
└──────────────┬──────────────────────────┬────────────────┘
               │                          │
          Registry (e.g. Docker Hub)   Registry
               │                          │
          docker pull / push          docker push
```

- **Docker Client** — the CLI you type commands into.
- **Docker Daemon (`dockerd`)** — background service that builds/runs/manages containers.
- **Docker Registries** — store & distribute images (Docker Hub = default).
- **Docker Objects** — images, containers, networks, volumes, plugins.

### Core Objects
| Object      | Description                                                     |
|-------------|-----------------------------------------------------------------|
| **Image**   | Immutable read-only template used to create containers          |
| **Container**| A running instance of an image (writeable layer on top)        |
| **Volumes** | Persistent storage for data outside the container lifecycle     |
| **Network** | Connects containers to each other & to the outside world        |

---

## 4. The Dockerfile

A `Dockerfile` is a **text file** with instructions Docker uses to build an image **automatically**.

```dockerfile
# 1. Base image
FROM python:3.12-slim

# 2. Metadata (author)
LABEL maintainer="manish@example.com"

# 3. Set working directory
WORKDIR /app

# 4. Copy dependency file first (for layer caching)
COPY requirements.txt .

# 5. Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy application code
COPY . .

# 7. Expose a port
EXPOSE 8000

# 8. Environment variables
ENV APP_ENV=production

# 9. Non-root user (security best practice)
RUN adduser --disabled-password appuser
USER appuser

# 10. Default command
CMD ["python", "app.py"]
```

### Dockerfile Instruction Reference

| Instruction | Purpose                                              | Example                        |
|-------------|------------------------------------------------------|--------------------------------|
| `FROM`      | Base image (must be first instruction)               | `FROM node:20-alpine`          |
| `RUN`       | Execute command during build                         | `RUN apt-get update`           |
| `COPY`      | Copy files from build context into image             | `COPY . /app`                  |
| `ADD`       | Like COPY but supports URLs & auto-extract archives  | `ADD file.tar.gz /opt/`        |
| `WORKDIR`   | Set working directory (creates if missing)           | `WORKDIR /app`                 |
| `ENV`       | Set environment variable                             | `ENV NODE_ENV=production`      |
| `EXPOSE`    | Document which port the container listens on (doc only)| `EXPOSE 3000`                |
| `CMD`       | Default command executed on run (overridable)        | `CMD ["npm", "start"]`         |
| `ENTRYPOINT`| Main command that always runs (hard to override)     | `ENTRYPOINT ["docker-entrypoint"]`|
| `ARG`       | Build-time variable (not available at runtime)       | `ARG VERSION=1.0`              |
| `USER`      | Switch user for RUN/CMD/ENTRYPOINT (security)        | `USER node`                    |
| `VOLUME`    | Create a mount point for a volume                    | `VOLUME /data`                 |
| `HEALTHCHECK`| Define a check to test container health             | `HEALTHCHECK CMD curl -f ...`  |

### CMD vs ENTRYPOINT
- **CMD** — provides defaults that can be **overridden** when running the container.
- **ENTRYPOINT** — the command that **always runs**; CMD supplies args to it.
- Best practice: use `ENTRYPOINT` for the main executable + `CMD` for default args.

---

## 5. Building Images

```bash
# Build image from Dockerfile in current dir, tag it
docker build -t myapp:1.0 .

# Build with a different Dockerfile
docker build -f Dockerfile.prod -t myapp .

# Build with build args
docker build --build-arg VERSION=2.0 -t myapp .

# List images
docker images

# Show image details
docker inspect myapp:1.0

# View build history / layers
docker history myapp:1.0

# Remove all dangling (untagged) images
docker image prune

# Remove an image (forced)
docker rmi -f myapp:1.0
```

> **Layer caching:** each instruction creates a layer. Order matters — put frequently-changing steps (`COPY . .`) **last** so Docker can reuse cached layers.

---

## 6. Running Containers

```bash
# Run a container in the background (detached)
docker run -d --name myapp -p 8080:80 myapp:1.0

# Run in foreground with interactive shell + pseudo-TTY
docker run -it --rm ubuntu bash

# Map host port 8080 to container port 80
#   -p  <host>:<container>
docker run -p 8080:80 nginx

# Publish a random host port to container's 80
docker run -P nginx

# Mount a host directory as a volume
docker run -v /host/path:/container/path myapp

# Use a named volume
docker run -v mydata:/data myapp

# Set environment variables
docker run -e MYVAR=value -e OTHER=hello myapp

# Restart policy (always, on-failure, unless-stopped)
docker run --restart unless-stopped myapp

# Limit resources
docker run --memory="512m" --cpus="1.5" myapp

# Attach to running container
docker attach myapp
```

---

## 7. Managing Containers

```bash
# List running containers
docker ps

# List ALL containers (including stopped)
docker ps -a

# List by filter
docker ps --filter "status=exited"

# Start / stop / restart
docker start myapp
docker stop myapp
docker restart myapp

# Pause / unpause (freeze processes)
docker pause myapp
docker unpause myapp

# Kill (force stop)
docker kill myapp

# Remove a container (running must be stopped, or use -f)
docker rm myapp
docker rm -f myapp

# Remove all stopped containers
docker container prune

# Copy files between container and host
docker cp myapp:/app/logs.txt ./logs.txt
docker cp ./config.yml myapp:/app/config.yml

# Show running processes inside a container
docker top myapp

# Get stats (CPU, memory, network) — live
docker stats

# Rename a container
docker rename myapp newname
```

---

## 8. Images: Lifecycle & Management

```bash
# Pull an image from a registry
docker pull nginx
docker pull nginx:1.25      # specific tag
docker pull ubuntu:24.04

# List images
docker images
docker image ls -a          # includes intermediate

# Inspect / tag
docker inspect myapp:1.0
docker tag myapp:1.0 myapp:latest

# Save image to tar archive (transfer/backup)
docker save -o myapp.tar myapp:1.0

# Load image from a tar archive
docker load -i myapp.tar

# Show image history
docker history myapp:1.0

# Cleanup
docker rmi myapp:1.0        # remove image
docker image prune -a       # remove ALL unused images

# Export / import container (filesystem, no layers/history)
docker export myapp > myapp-container.tar
docker import myapp-container.tar myapp:v2
```

---

## 9. Volumes & Data Persistence

Containers are **ephemeral** — data is lost when a container is removed. Volumes persist it.

### Types
1. **Named volumes** — managed by Docker (`-v mydata:/data`)
2. **Bind mounts** — host directory mapped in (`-v /host/path:/data`)
3. **tmpfs mounts** — in-memory only (RAM), ephemeral

```bash
# Named volume
docker volume create mydata
docker run -v mydata:/data postgres

# Bind mount (live edit on host)
docker run -v $(pwd):/app -w /app node

# List / inspect / remove volumes
docker volume ls
docker volume inspect mydata
docker volume rm mydata

# Remove all unused volumes
docker volume prune

# Anonymous volume (auto-created, random name)
docker run -v /data myapp
```

> **Pro tip:** bind mounts are great for development (live code reload); named volumes are best for databases & persistent production data.

---

## 10. Networking

Docker networking lets containers talk to each other and the outside world.

### Built-in network drivers
- **bridge** — default; containers communicate via the host's bridge.
- **host** — container shares host's network stack (no port mapping needed).
- **none** — no networking.
- **overlay** — connects containers across multiple Docker hosts (Swarm).

```bash
# List networks
docker network ls

# Create a custom bridge network
docker network create mynet

# Run a container attached to a custom network
docker run --network mynet --name app1 myapp

# Connect / disconnect a running container
docker network connect mynet app1
docker network disconnect mynet app1

# Remove a network
docker network rm mynet

# Get a container's IP
docker inspect -f '{{.NetworkSettings.IPAddress}}' app1

# DNS: containers on the same network resolve each other BY NAME
docker run --network mynet --name app2 myapp   # app2 can ping app1 by "app1"
```

> **Tip:** on a user-defined bridge network, containers can reference each other by **container name** (built-in DNS). This is how `docker-compose` services talk to each other.

---

## 11. Docker Compose

**Compose** defines multi-container apps in a single YAML file — perfect for microservices & dev environments.

### `docker-compose.yml` example
```yaml
version: "3.9"

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DB_HOST=db
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Common Compose commands
```bash
# Start all services in background
docker compose up -d

# Build images then start
docker compose up -d --build

# Start only one service
docker compose up -d db

# View logs (all or one service)
docker compose logs -f web

# List running services
docker compose ps

# Stop (keep containers) / Down (remove containers+network)
docker compose stop
docker compose down

# Down AND remove named volumes + images
docker compose down -v --rmi all

# Run a one-off command in a service container
docker compose run web python manage.py migrate
```

> **Note:** `docker-compose` (v1) is legacy; modern Docker uses `docker compose` (v2, plugin).

---

## 12. Logs & Debugging

```bash
# View logs from a container
docker logs myapp

# Follow logs (stream)
docker logs -f myapp

# Show last 50 lines
docker logs --tail 50 myapp

# Timestamps on log lines
docker logs -t myapp

# Enter a running container (interactive shell)
docker exec -it myapp /bin/sh
docker exec -it myapp bash

# Run a single command inside a container
docker exec myapp python --version

# Inspect full config/details of container
docker inspect myapp

# Inspect a specific JSON field
docker inspect -f '{{.State.Status}}' myapp

# See changes made to container filesystem (vs image)
docker diff myapp

# Container health (container must define HEALTHCHECK)
docker inspect -f '{{.State.Health.Status}}' myapp

# System-wide events (stream)
docker events

# Check what's using disk
docker system df
```

---

## 13. Registry & Distribution

Images are distributed via **registries** (default: Docker Hub).

```bash
# Log in to a registry
docker login
docker login registry.example.com

# Log out
docker logout

# Pull / push an image
docker pull nginx
docker push myusername/myapp:1.0

# Tag before pushing to your repo
docker tag myapp:1.0 myusername/myapp:1.0
docker push myusername/myapp:1.0

# Private registry (run one with Docker itself)
docker run -d -p 5000:5000 --name registry registry:2

# Search Docker Hub
docker search nginx

# Image naming convention
#   [registry/]namespace/repository[:tag]
#   e.g. docker.io/library/nginx:latest
```

---

## 14. Docker Daemon & System Commands

```bash
# Version info
docker version

# System-wide information
docker info

# Disk usage of all docker objects
docker system df
docker system df -v

# Clean up EVERYTHING unused (containers, images, networks, cache)
docker system prune
docker system prune -a --volumes   # aggressive cleanup

# Get live resource usage of containers
docker stats
docker stats --no-stream     # single snapshot

# Show events stream
docker events

# Manage the daemon/engine (Linux)
sudo systemctl start docker
sudo systemctl stop docker
sudo systemctl status docker
sudo systemctl enable docker    # start on boot
```

---

## 15. Best Practices & Security

### Image & Dockerfile best practices
- ✅ Use **small, official, pinned** base images (`alpine`, `-slim`).
- ✅ Use **multi-stage builds** to keep final images small.
- ✅ **Order layers** to leverage caching — put `COPY` of code last.
- ✅ Use **specific tags** (`node:20-alpine`), not `latest`.
- ✅ Run as a **non-root user** (`USER`).
- ✅ Add `.dockerignore` to exclude junk from build context.
- ✅ **Combine RUN commands** to reduce layers.
- ✅ Prefer `COPY` over `ADD`.
- ✅ Pin dependency versions; scan images for CVEs.

### Sample multi-stage build
```dockerfile
# Stage 1: build
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o myapp .

# Stage 2: runtime (tiny
FROM alpine:3.20
COPY --from=builder /app/myapp /usr/local/bin/myapp
USER 10001:10001
ENTRYPOINT ["myapp"]
```

### Security checklist
- 🔒 Keep base images & packages **up to date**.
- 🔒 Run containers as **non-root**.
- 🔒 **Don't embed secrets** in images — use env vars / secrets (`--secret`).
- 🔒 Limit resource usage (`--memory`, `--cpus`).
- 🔒 Use **read-only root filesystem** where possible (`--read-only`).
- 🔒 Scan images: `docker scout cves myapp:1.0` / `trivy image myapp`.
- 🔒 Scan running containers: `docker scout recommendations --image myapp`.

---

## 16. Blitz: Top 20 One-Liners

```bash
docker pull nginx                          # 1. pull image
docker build -t myapp .                    # 2. build image
docker run -d -p 8080:80 --name app nginx  # 3. run container
docker ps                                  # 4. list running containers
docker ps -a                               # 5. list ALL containers
docker stop $(docker ps -q)                # 6. stop all containers
docker rm $(docker ps -aq)                 # 7. remove all containers
docker rmi -f $(docker images -q)          # 8. remove all images
docker exec -it app bash                   # 9. get a shell in a container
docker logs -f app                         # 10. follow logs
docker inspect app                         # 11. inspect details
docker cp app:/app/data.txt ./             # 12. copy file out
docker build -t myapp --no-cache .        # 13. build w/o cache
docker compose up -d                       # 14. start compose stack
docker compose down                        # 15. tear down compose
docker system prune -a                     # 16. clean everything unused
docker stats                               # 17. live resource usage
docker network ls                          # 18. list networks
docker volume ls                           # 19. list volumes
docker image prune -a                      # 20. remove unused images
```

---

## ✅ Quick Reference Summary

| Task                       | Command                                        |
|----------------------------|------------------------------------------------|
| Build image                | `docker build -t name .`                      |
| Run container              | `docker run -d -p 80:80 myapp`                |
| List containers            | `docker ps` / `docker ps -a`                  |
| Shell into container       | `docker exec -it name sh`                     |
| View logs                  | `docker logs -f name`                         |
| Stop / remove              | `docker stop name` / `docker rm -f name`      |
| Compose up                 | `docker compose up -d`                        |
| Push to registry           | `docker push user/repo:tag`                   |
| Cleanup                    | `docker system prune -a`                      |

---

*Happy containerizing ! — Manish Kumar (manish-dpp)*
