# Docker Basics

## What is Docker?

Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, portable, and self-sufficient environments that can run anywhere Docker is installed.

Unlike traditional virtual machines, containers share the host operating system kernel. This makes them much more efficient — they start in seconds, use less memory, and require far fewer resources than a full virtual machine running a separate operating system.

## Why Use Docker?

- **Portability** — a container runs the same way on any machine that has Docker, regardless of the underlying infrastructure
- **Consistency** — eliminates the classic "it works on my machine" problem by packaging the application with all its dependencies
- **Isolation** — each container runs in its own isolated environment, so conflicts between applications are avoided
- **Scalability** — containers can be easily replicated to handle increased load
- **Version control** — images are versioned, so you can roll back to a previous version at any time

## Key Concepts

### Images
- Templates used to create containers
- Built from Dockerfiles
- Stored in registries like Docker Hub
- Images are read-only and immutable once built
- Each image is composed of multiple layers stacked on top of each other

### Containers
- Running instances of images
- Isolated from each other and the host system
- Can be started, stopped, and destroyed
- Containers have their own filesystem, network, and process space
- Multiple containers can be created from a single image

### Dockerfile
- Text file containing instructions to build an image
- Defines the environment and application setup
- Instructions are executed line by line, in order
- Common instructions include FROM, RUN, COPY, CMD, and EXPOSE

### Volumes
- Persistent storage that survives container restarts
- Used to share data between containers or between a container and the host
- Volumes are managed by Docker and stored on the host filesystem

### Networks
- Containers communicate with each other through networks
- Docker provides bridge, host, and overlay network drivers
- You can isolate containers on separate networks for security

## Dockerfile Example

```dockerfile
# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
```

## Common Commands

```bash
# List Docker images
docker images

# Pull an image from Docker Hub
docker pull <image_name>

# Run a container
docker run <image_name>

# Run a container in detached mode
docker run -d <image_name>

# Run a container with port mapping
docker run -p 8080:80 <image_name>

# List running containers
docker ps

# List all containers
docker ps -a

# Stop a running container
docker stop <container_id>

# Remove a stopped container
docker rm <container_id>

# Remove an image
docker rmi <image_name>

# View container logs
docker logs <container_id>

# Execute a command inside a running container
docker exec -it <container_id> /bin/bash

# Build an image from a Dockerfile
docker build -t <image_name> .

# Remove all unused containers, images, and networks
docker system prune
```

## Docker vs Virtual Machines

| Feature | Docker Containers | Virtual Machines |
|---------|-------------------|------------------|
| Boot time | Seconds | Minutes |
| Size | Megabytes | Gigabytes |
| Performance | Near-native | Slight overhead |
| OS | Shares host kernel | Full guest OS |
| Resource usage | Lightweight | Heavy |
| Isolation | Process-level | Hardware-level |
