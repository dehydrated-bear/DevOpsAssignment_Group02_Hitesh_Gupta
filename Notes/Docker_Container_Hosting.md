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

---

## 3. Docker Images, Dockerfile & Building Images

### 3.1 What is a Docker Image?

- An image is a read-only, layered snapshot of a filesystem plus metadata.
- Images are built from instructions in a file called `Dockerfile`.
- Every line in a Dockerfile that modifies the filesystem creates a new layer.
- Layers are cached, so rebuilding an image only re-runs the steps that changed.
- Images are identified by `repository:tag`, for example `nginx:1.27`.
- The special tag `latest` points to the most recently pushed "latest" build.

### 3.2 Image Layers Explained

- A Dockerfile instruction such as `RUN`, `COPY`, or `ADD` adds a layer.
- Layers are stacked, and the container sees a single merged filesystem.
- Because layers are cached, sharing a base image across many images uses disk
  storage only once.
- `docker image history <image>` shows each layer with its size and command.
- `overlay2` is the default storage driver on modern Linux hosts and implements
  copy-on-write so unchanged files are never duplicated.

### 3.3 A Minimal Dockerfile

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
EXPOSE 80
```

- `FROM` sets the base image.
- `COPY` copies local files into the image.
- `EXPOSE` documents which port the container listens on.
- Build with `docker build -t my-site .`

### 3.4 Common Dockerfile Instructions

| Instruction   | Purpose                                                |
|---------------|--------------------------------------------------------|
| FROM          | Base image to build on                                 |
| RUN           | Execute a command while building the image             |
| COPY          | Copy files from the build context into the image       |
| ADD           | Like COPY, plus tarball auto-extraction and URLs       |
| WORKDIR       | Set the working directory for RUN/CMD/COPY/ENTRYPOINT  |
| ENV           | Set environment variables for the image/container      |
| ARG           | Build-time variable usable only during the build       |
| EXPOSE        | Declare which ports the container listens on           |
| CMD           | Default command run at container start (can override)  |
| ENTRYPOINT    | Main command that is hard to override (containerized)  |
| USER          | Switch to a non-root user for runtime                  |
| VOLUME        | Declare a mount point for persistent data              |
| LABEL         | Add metadata such as maintainer or version             |
| HEALTHCHECK   | Define a command to check container health             |
| STOPSIGNAL    | The signal sent to stop the container                  |
| ONBUILD       | Trigger instructions when used as a base image         |

### 3.5 ENTRYPOINT vs CMD

- `CMD` provides defaults that can be overridden by `docker run myimage arg`.
- `ENTRYPOINT` is the executable that always runs.
- Combined: ENTRYPOINT supplies the binary, CMD supplies default arguments.
- JSON array form is preferred: `CMD ["nginx", "-g", "daemon off;"]`
- Shell form runs through a shell: `CMD nginx -g "daemon off;"`
- When both are given in shell form, only ENTRYPOINT runs and CMD is ignored.

### 3.6 Building an Image

```bash
docker build -t app:1.0 .
docker build -t app:1.0 -f alt/Dockerfile.prod .
docker build --build-arg VERSION=2.0 -t app:2.0 .
```

- The final ` .` is the **build context** — the set of files Docker can COPY.
- `.dockerignore` excludes files from the context (node_modules, .git, secrets).
- `--target service` builds only a named stage in a multi-stage build.

### 3.7 Multi-Stage Builds

- Multi-stage builds use multiple `FROM` statements to keep final images small.
- The pattern: one stage installs the full toolchain, a later stage copies only
  the compiled artifacts into a slim runtime image.

```dockerfile
# ---- build stage ----
FROM golang:1.22 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# ---- runtime stage ----
FROM alpine:latest
RUN adduser -D appuser
COPY --from=builder /app/server /usr/local/bin/server
USER appuser
EXPOSE 8080
CMD ["server"]
```

- Results in a final image that contains only the binary and a base OS.
- This reduces image size by hundreds of megabytes for many languages.

### 3.8 Image Size Optimisation

- Prefer small bases: `alpine`, `distroless`, or `slim` variants.
- Combine RUN commands and clean package caches in the same layer:
  `RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*`
- Use `.dockerignore` to avoid copying build caches.
- Use multi-stage builds to avoid shipping compilers.
- Use `docker image inspect` and tools like `dive` to view layer contents.
- Avoid storing secrets in layers: secrets become visible in image history.

### 3.9 Tagging and Versioning Images

```bash
docker tag app:1.0 registry.example.com/myteam/app:1.0
docker tag app:1.0 registry.example.com/myteam/app:latest
docker push registry.example.com/myteam/app:1.0
```

- Semantic versioning (`1.2.3`) plus major-only tags (`1`) are common patterns.
- An immutable unique ID may be generated in CI and used as the tag.
- Never reuse an existing tag for a different build unless you are fine with
  breaking reproducibility.

### 3.10 Registries and Pulling Images

```bash
docker pull nginx:alpine          # from Docker Hub
docker pull registry.example.com/app:1.0
docker login registry.example.com # authenticate
docker search nginx               # search Docker Hub
```

- Public registries: Docker Hub, GitHub Container Registry (ghcr.io).
- Cloud registries: AWS ECR, Azure Container Registry (ACR), Google Artifact
  Registry, JFrog Artifactory, Quay.io.
- Private registries can be self-hosted using the open-source `registry` image:
  `docker run -d -p 5000:5000 registry:2`.

### 3.11 Inspecting and exporting images

```bash
docker image ls                 # list local images
docker image inspect nginx      # metadata in JSON
docker image history nginx      # layer history
docker image save -o app.tar app:1.0   # export to tarball
docker image load -i app.tar    # import a tarball
docker image rm app:1.0         # delete an image
docker image prune -a           # remove all unused images
```

### 3.12 Running Containers from Images

```bash
docker run -d --name web -p 8080:80 nginx
docker run -it ubuntu bash
docker run --rm -v /host/data:/data alpine ls /data
```

- `-d` runs detached, `-it` gives an interactive terminal session.
- `--rm` auto-deletes the container when it exits.
- `-p` publishes a host port to a container port.
- `-v` mounts a host folder or volume into the container.

### 3.13 Summary

Images are layered, read-only templates created from a Dockerfile. Good image
design focuses on small size, caching, and multi-stage builds. Once built,
images are tagged, pushed to registries, and later pulled to hosts where they
become running containers. Storage and networking for those containers is
covered in the next section.

---

## 4. Volumes, Networking & Data Persistence

### 4.1 The Container Filesystem Problem

- Every container starts from the image's read-only layers plus a thin writable
  layer.
- If the container is deleted, everything written to that writable layer is
  lost.
- Containers should be treated as ephemeral: it should be safe to delete and
  recreate them at any time.
- Therefore data that must survive must be stored in a place outside the
  container's writable layer.

### 4.2 Types of Persistent Storage

1. **Volumes**: Managed by Docker, stored under `/var/lib/docker/volumes`.
2. **Bind mounts**: Map a host directory directly into the container.
3. **tmpfs mounts**: In-memory storage, fast but lost on container stop.
4. **Named pipes / host files**: Windows-specific mapping mechanisms.

### 4.3 Docker Volumes

- Volumes are the recommended way to persist data.
- They are managed with `docker volume` commands.
- Create and use a named volume:

```bash
docker volume create appdata
docker run -d -v appdata:/var/lib/mysql mysql:8
```

- Docker will also auto-create an anonymous volume if the image declares a
  VOLUME instruction.
- Backing up a volume: `docker run --rm -v appdata:/data -v $(pwd):/backup alpine tar czf /backup/appdata.tar.gz -C /data .`
- Restore a volume by extracting the archive into a fresh volume.

### 4.4 Bind Mounts

- Bind mounts map any host directory into the container.
- Useful during development for live code reload.
- Syntax: `-v /host/path:/container/path`
- Modern preferred syntax: `--mount type=bind,source=/host,target=/container`

```bash
docker run -d -p 8080:80 -v "$(pwd)"/html:/usr/share/nginx/html nginx
```

- Bind mounts do not copy data; the container sees the host files directly.
- Paths are resolved from the host, so permissions of host files apply.

### 4.5 tmpfs Mounts

- Store sensitive or transient data in host memory.
- Syntax: `--mount type=tmpfs,target=/cache`
- Data is never written to disk and disappears when the container stops.
- Good for scratch space, session caches, and secrets that must not persist.

### 4.6 Copy-on-Write and Layer Storage

- If a file is written to a container path that is inside a lower image layer,
  Docker copies the file up into the writable layer first (copy-on-write).
- This keeps the base image layer immutable and shared between containers.
- High write volumes become problematic because of copy-on-write overhead —
  another reason databases should use volumes.

### 4.7 Docker Networking Overview

- Every container gets its own network namespace with a virtual IP address.
- The default bridge network gives containers an IP on `172.17.0.0/16`.
- Containers communicate with each other via names on user-defined networks.
- The host can reach containers through published ports.

### 4.8 Network Drivers

| Driver        | Purpose                                                    |
|---------------|------------------------------------------------------------|
| bridge        | Default private network for containers on the same host   |
| host          | Container shares the host network stack directly          |
| none          | No networking at all                                       |
| overlay       | Multi-host networking for Swarm/Kubernetes                 |
| macvlan       | Assign containers real MAC addresses on the host LAN       |
| ipvlan        | Assign containers real IPs on the host LAN without MACs   |

### 4.9 Creating and Using Custom Bridge Networks

```bash
docker network create app-net
docker run -d --name db --network app-net mysql:8
docker run -d --name web --network app-net -p 8080:80 nginx
```

- On `app-net`, the `web` container can reach `db` by the DNS name `db`.
- The default bridge does NOT provide automatic DNS between containers, so
  custom networks are preferred.
- Networks can be isolated: put frontend and backend on separate networks and
  only attach network bridges where needed.

### 4.10 Port Publishing

- Publish a port with `-p hostPort:containerPort`.
- Example: `-p 8080:80` means host port 8080 maps to container port 80.
- Multiple mappings are allowed: `-p 8080:80 -p 8443:443`
- Random host port: `-P` publishes all EXPOSEd ports to random ports; check with
  `docker port <container>`.
- The host firewall (iptables/ufw) still applies on top of Docker's port rules.

### 4.11 Persisting Databases with Volumes

- Databases must never rely on container layers for data.
- Example for MySQL:

```bash
docker volume create mysql-data
docker run -d \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=secret \
  -v mysql-data:/var/lib/mysql \
  -p 3306:3306 \
  mysql:8
```

- Backing up and restoring become simple volume operations.

### 4.12 Storage Drivers

| Driver   | Notes                                       |
|----------|---------------------------------------------|
| overlay2 | Default, efficient, recommended on Linux    |
| fuse-overlayfs | Works without extended attributes (rootless) |
| vfs      | Copies whole layers, slow, not recommended  |
| zfs/btrfs| Native filesystem snapshots, copy-on-write |

- Storage driver is chosen at daemon start and set in `daemon.json`.
- Do not switch storage drivers on a live host with existing containers.

### 4.13 Rootless Docker

- Rootless mode runs the daemon and containers without root privileges.
- Storage problems: overlay2 needs fuse-overlayfs or vfs in rootless mode.
- Networking is restricted; userland proxy with slirp4netns is used by default.
- Useful on shared machines where the operator is not allowed root access.

### 4.14 Summary

Container filesystems are ephemeral, so persistent data belongs in volumes or
bind mounts. Networking starts from the simple default bridge but real
applications need custom networks with DNS, port publishing to the host, and
overlay networks when scaling to many hosts. With storage and networking
understood, multi-container applications and Compose become straightforward.

---

## 5. Docker Compose & Multi-Container Hosting

### 5.1 Why Multi-Container Hosting?

- Modern applications are rarely a single process.
- A typical web stack has: reverse proxy, frontend, backend API, database,
  cache, message queue, and background workers.
- Each part has different scaling needs, update cycles, and resource usage.
- Running each part as its own container improves isolation, observability, and
  independent deployment.

### 5.2 Introducing Docker Compose

- Compose is a CLI tool that defines and runs multi-container apps from a YAML
  file, normally called `compose.yaml` (or `docker-compose.yml`).
- One command (up) creates all networks, volumes, and containers described.
- Compose is ideal for development environments and small production stacks.
- The modern command prefix is `docker compose`; the old standalone binary is
  `docker-compose`.

### 5.3 A Full Compose Example

A simple web app with an API and a database:

```yaml
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      retries: 5

  backend:
    build: ./backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://app:secret@db/app
    ports:
      - "8080:8080"

  web:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./web:/usr/share/nginx/html:ro
    ports:
      - "80:80"

volumes:
  pgdata:
```

### 5.4 Service Names as DNS

- Each service name in `compose.yaml` becomes a DNS name on the Compose network.
- The backend reaches the database at hostname `db`, port `5432`.
- No hard-coded IP addresses are needed anywhere.

### 5.5 Environment and Configuration

```yaml
services:
  app:
    image: myapp:1.0
    environment:
      APP_MODE: production
      SECRET_TOKEN: ${SECRET_TOKEN}
    env_file:
      - .env
```

- `environment` sets variables directly.
- `env_file` loads variables from a file.
- `${VAR}` resolves from the shell or a project `.env` file at runtime.
- Secrets should be supplied via files or Swarm secrets, never committed to git.

### 5.6 Networking in Compose

- Compose auto-creates a project bridge network.
- `ports` publishes ports on the host.
- `expose` only makes ports available to linked services.
- Custom networks can separate tiers:

```yaml
services:
  db:
    networks: [internal]
  backend:
    networks: [internal, public]
  web:
    networks: [public]
networks:
  internal:
    internal: true
  public: {}
```

- Marking a network `internal: true` blocks external access to it.

### 5.7 Volumes and Dependencies in Compose

- Named volumes are declared once and shared via `volumes:` key.
- `depends_on` controls start order and can wait for health.
- `restart` policies: `no`, `always`, `on-failure`, `unless-stopped`.
- `healthcheck` makes readiness explicit and lets other services wait.

### 5.8 Common Compose Commands

```bash
docker compose up -d                  # start services in background
docker compose up --build             # rebuild before start
docker compose down                   # stop and remove containers/network
docker compose down -v                # also remove named volumes
docker compose ps                     # list service status
docker compose logs -f                # follow logs of all services
docker compose logs backend           # logs of one service
docker compose exec backend bash      # shell inside a container
docker compose restart backend        # restart one service
docker compose scale workers=3        # set replica count (V2)
docker compose config                 # render final merged config
docker compose pull                   # pull all images
```

### 5.9 Difference Between Compose and Swarm

- Compose: single-host or dev-focused, easy, no cluster/load balancing.
- Swarm: multi-host orchestration, built into the engine, supports secrets and
  overlay networks.
- Swarm can consume the same YAML if you add `deploy` sections.
- For large clusters Kubernetes is usually a better fit.

### 5.10 Running Production Stacks with Compose

- Use immutable image tags from CI, not `latest`.
- Pin major versions of images.
- Set memory and CPU limits per service:
  `deploy: resources: limits: memory: 512M`
- Restart policy `unless-stopped` or the Swarm `deploy.replicas` for control.
- Route traffic with a dedicated reverse proxy service.
- Centralise logs by shipping files to a collector.

### 5.11 Building Images in Compose

```yaml
services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile.prod
      args:
        BUILD_ENV: production
```

- `build` replaces `image` for local builds.
- If both are present, Compose builds and tags the image.
- `args` passes build-time variables used by `ARG` in the Dockerfile.

### 5.12 Compose Profiles

- Profiles enable optional services that only start when selected.
- Example: add `profiles: ["debug"]` to a service.
- Start it with `docker compose --profile debug up -d`.

### 5.13 Compose in CI vs Production

- In CI, Compose spins up throwaway environments for tests.
- In production, Compose is used on single VMs or small servers.
- On large fleets the same YAML can drive Swarm or be converted to Kubernetes
  manifests with tools like Kompose.

### 5.14 Summary

Compose takes the pain out of multi-container hosting. A single YAML describes
networks, volumes, services, dependencies, and health checks. Everything is
repeatable and version-controlled. When one host is no longer enough,
orchestration tools such as Swarm and Kubernetes, covered next, take over.

---

## 6. Orchestration: Docker Swarm & Kubernetes

### 6.1 Why Orchestration?

- Single hosts have limits on CPU, memory, disk, and resilience.
- Production hosting needs multiple hosts: if one fails, others keep the service
  alive.
- Orchestrators automate the placement, scaling, networking, and healing of
  containers across a cluster of machines.
- Both Swarm and Kubernetes provide: service discovery, load balancing,
  rolling updates, health checks, and self-healing.

### 6.2 Docker Swarm Overview

- Swarm mode is built into the Docker Engine since v1.12.
- A Swarm consists of **manager** nodes and **worker** nodes.
- Managers keep state, schedule services, and provide the control plane.
- Workers run the actual service tasks.
- Communication between nodes is encrypted via TLS, and raft consensus keeps
  state consistent among managers.

### 6.3 Swarm Object Model

| Concept      | Description                                         |
|--------------|-----------------------------------------------------|
| Node         | A machine joined to the cluster                     |
| Service      | Definition: image, replicas, ports, networks        |
| Task         | A running container scheduled for a service         |
| Stack        | A group of services defined in a Compose-like YAML  |
| Secret       | Encrypted configuration held by managers            |
| Config       | Unencrypted configuration object                    |

### 6.4 Initialising and Joining a Swarm

```bash
docker swarm init --advertise-addr 192.168.1.10
docker swarm join --token <worker-token> 192.168.1.10:2377
docker node ls
```

- `docker swarm join-token manager` prints the manager join command.
- Managers use port 2377 for control traffic, 7946 for gossip, 4789 for VXLAN
  overlay traffic.

### 6.5 Deploying a Service in Swarm

```bash
docker service create --name web --replicas 3 -p 8080:80 nginx:alpine
docker service ls
docker service ps web
docker service scale web=5
docker service update --image nginx:1.27 web
docker service rm web
```

- `docker service update` performs a rolling update without downtime.
- Swarm automatically spreads replicas across worker nodes.
- If a task dies, the scheduler replaces it on another node.

### 6.6 Swarm Stacks

- Stacks use Compose syntax with a `deploy` section:

```yaml
version: "3.8"
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    deploy:
      replicas: 4
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
  db:
    image: mysql:8
    volumes:
      - dbdata:/var/lib/mysql
    deploy:
      placement:
        constraints:
          - node.role == manager
volumes:
  dbdata:
```

- Deploy a stack with `docker stack deploy -c stack.yml app`.
- Swarm secrets: `echo "s3cr3t" | docker secret create db_pass -` then mount
  under `/run/secrets/db_pass` in the container.

### 6.7 Overlay Networks in Swarm

- The `overlay` driver connects containers across many hosts.
- Created automatically when a stack uses networks.
- Services get DNS names across the whole cluster.
- Traffic between containers on the same overlay is encrypted optionally.

### 6.8 Swarm Routing Mesh

- Published ports are available on every node, even nodes that do not run the
  task.
- The routing mesh forwards traffic to a node that runs the task.
- This gives simple load balancing and high availability out of the box.

### 6.9 Kubernetes Overview

- Kubernetes (k8s) is the industry-standard container orchestrator.
- Originally created by Google, now maintained by the CNCF.
- Bigger feature set than Swarm: auto-scaling, RBAC, service mesh, ingress,
  operators, and a huge ecosystem.

### 6.10 Kubernetes Core Concepts

| Concept       | Description                                             |
|---------------|---------------------------------------------------------|
| Pod           | Smallest unit: one or more containers sharing a network |
| Node          | A machine in the cluster (worker)                       |
| Deployment    | Desired state for a set of Pods (replicas, updates)     |
| Service       | Stable network endpoint for a set of Pods               |
| Namespace     | Logical grouping of resources                           |
| Ingress       | External HTTP(S) routing rules                          |
| ConfigMap     | Non-secret configuration data                           |
| Secret        | Encrypted configuration data                            |
| PersistentVolume | Storage provisioned out of the cluster               |
| StatefulSet   | Stable identity for stateful workloads                  |
| DaemonSet     | Runs a Pod on every node                                |
| HPA           | Horizontal Pod Autoscaler                               |

### 6.11 Pods, Deployments, and Services

- A **Deployment** declares the desired number of replicas and rolls updates.
- A **Service** selects Pods with labels and exposes a stable ClusterIP.
- External traffic arrives via **Ingress** or a LoadBalancer service.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:alpine
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
```

### 6.12 Kubernetes Networking and Storage

- Every Pod gets its own IP on the cluster network (CNI: Calico, Flannel,
  Cilium, Weave).
- Persistent data uses PVCs backed by storage classes
  (hostPath, NFS, AWS EBS, Azure Disk, GCE PD, CSI drivers).
- Sticking to the same data for stateful apps is handled by StatefulSets.

### 6.13 Scaling and Self-Healing

```bash
kubectl scale deployment web --replicas=5
kubectl autoscale deployment web --min=2 --max=10 --cpu-percent=70
kubectl rollout status deployment/web
kubectl rollout undo deployment/web
```

- Liveness probes restart unhealthy Pods.
- Readiness probes stop sending traffic to unready Pods.
- Startup probes guard slow-starting applications.

### 6.14 Swarm vs Kubernetes: Choosing

| Factor           | Docker Swarm        | Kubernetes              |
|------------------|---------------------|-------------------------|
| Setup effort     | Very low            | Moderate to high        |
| Feature set      | Minimal             | Extensive               |
| Best for         | Small clusters      | Large dynamic platforms |
| Auto-scaling     | Manual scale only   | HPA, cluster autoscaler |
| Ingress          | Routing mesh        | Ingress controllers     |
| Ecosystem/tools  | Small               | Huge (Helm, operators)  |
| Learning curve   | Gentle              | Steep                   |

### 6.15 Managed Kubernetes Services

- **AWS EKS**: Amazon Elastic Kubernetes Service, integrates with IAM, EBS, ALB.
- **Azure AKS**: Azure Kubernetes Service, one-click upgrade and monitoring.
- **Google GKE**: The most mature managed k8s, automatic node pools.
- **Rancher / k3s / kind / minikube**: Lightweight or local options.

### 6.16 Summary

When one host is not enough, Swarm adds multi-host scheduling with almost zero
extra complexity, while Kubernetes provides the full platform-grade feature set.
Either way, the application keeps being packaged as Docker images; only the
orchestration layer above the containers changes. The final section covers CI/CD,
security, monitoring, and the best practices that make all of this production
ready.