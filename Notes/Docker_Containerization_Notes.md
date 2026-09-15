# Docker Containerization Notes

Complete study notes on containerizing applications with Docker. This document
covers everything from the core concepts of containers, through writing
Dockerfiles and docker-compose files for this project, to optimization,
security, and troubleshooting.

---

## Table of Contents

1. Introduction to Containerization
2. Containers vs. Virtual Machines
3. Docker Architecture
4. Docker Objects and Lifecycle
5. Containerizing This Project - Step by Step
6. Writing the Dockerfile for the Project
7. The .dockerignore File
8. Building, Tagging, and Running Images
9. docker-compose for Multi-Container Setups
10. Docker Networks
11. Docker Volumes and Persistent Data
12. Environment Variables and Secrets
13. Image Optimization and Size Reduction
14. Multi-Stage Builds in Practice
15. Docker Security Best Practices
16. Logging, Health Checks, and Monitoring
17. Docker Hub and Image Registries
18. CI/CD with Docker
19. Troubleshooting and Debugging
20. Common Commands Cheat Sheet
21. Summary and Checklist

---

## 1. Introduction to Containerization

Containerization is a lightweight form of virtualization where the application
and all of its dependencies (libraries, runtimes, configuration files) are
packaged together into a single unit called a **container**. Containers share
the host operating system kernel but run in isolated user spaces.

Why containers matter:

- **Portability** - "It works on my machine" is eliminated. A container runs
  the same way on a developer laptop, a test server, or a production cluster.
- **Consistency** - Every container is built from the same image, so the
  software stack is identical everywhere.
- **Efficiency** - Containers use fewer resources than virtual machines because
  they do not require a full guest operating system.
- **Speed** - Containers start in milliseconds to seconds, much faster than
  booting a virtual machine.
- **Scalability** - Containers can be scaled horizontally by running many
  instances of the same image behind a load balancer.

The two main artifacts in containerization are:

| Artifact   | Description                                                              |
| ---------- | ------------------------------------------------------------------------ |
| **Image**  | A read-only, immutable template with the application and its runtime.    |
| **Container** | A running, writable instance of an image.                            |

A good mental model: an image is a class, and a container is an object created
from that class.

---

## 2. Containers vs. Virtual Machines

It is important to understand how containers differ from virtual machines (VMs).

| Property            | Virtual Machine                      | Container                           |
| ------------------- | ------------------------------------ | ----------------------------------- |
| Isolation level     | Full OS + hardware virtualisation    | Process-level, kernel namespaces    |
| Guest OS            | Yes, each VM has its own OS          | No, shares the host kernel          |
| Boot time           | Minutes                              | Milliseconds to seconds             |
| Size                | Gigabytes                            | Megabytes                           |
| Resource overhead   | High (needs full OS per VM)          | Low (just the app + dependencies)   |
| Density per host    | Tens                                 | Hundreds to thousands               |
| Security boundary   | Strong (hypervisor)                  | Weaker (kernel shared)              |

The key difference is that a VM virtualizes **hardware**, while a container
virtualizes the **operating system interface**. Containers are lighter, but
because they share the kernel they are not as strongly isolated as VMs. In
practice, many production systems use both - Kubernetes pods run on VMs, for
example.

---

## 3. Docker Architecture

Docker follows a client-server model. Understanding its architecture helps you
reason about why commands behave the way they do.

### Core components

- **Docker daemon (dockerd)** - A background service that manages Docker
  objects: images, containers, networks, and volumes. It listens for requests
  from the Docker client.
- **Docker client (docker)** - The command-line tool you interact with. It
  sends commands to the daemon over a REST API or a local socket.
- **containerd** - The industry-standard container runtime that Docker uses
  under the hood to actually run containers.
- **runc** - The low-level OCI runtime that creates and runs containers.
- **Docker registries** - Repositories that store and distribute Docker images.
  Docker Hub is the default public registry.
- **Docker objects** - The images, containers, networks, volumes, plugins, and
  other entities that Docker creates and manages.

### Flow of a typical workflow

```text
docker build  ->  client  ->  daemon  ->  pulls base image  ->  builds layers
docker run   ->  client  ->  daemon  ->  creates container   ->  runs process
docker push  ->  client  ->  daemon  ->  uploads image to registry
docker pull  ->  client  ->  daemon  ->  downloads image from registry
```

All state is handled by the daemon. If you restart the daemon, the containers
restart according to the restart policy and the images remain on disk.

---

## 4. Docker Objects and Lifecycle

### Images

An image is built from layers. Each instruction in a Dockerfile creates a new
layer, and layers are cached. This is why the order of Dockerfile instructions
matters so much for build speed.

### Containers

A container is created from an image with the `docker run` or `docker create`
command. It adds a thin, writable layer on top of the image. When the container
is removed with `docker rm`, that writable layer is discarded.

### The container states

```text
Created  ->  Running  ->  Paused
                     \->  Exited  ->  Dead
```

### Image and container commands

```bash
# image management
docker images
docker build -t my-image .
docker tag my-image my-image:v1
docker rmi my-image
docker pull node:18-alpine

# container management
docker create --name app my-image
docker start app
docker stop app
docker restart app
docker rm app
docker exec -it app /bin/sh
```

### Repositories, tags, and digests

- A **repository** is a collection of related images (e.g. `node`).
- A **tag** is a mutable label for a specific version (`node:18-alpine`).
- A **digest** is an immutable SHA-256 identifier of a specific image. Two
  different tags can point at the same digest.

```bash
docker inspect --format '{{.RepoDigests}}' node:18-alpine
```