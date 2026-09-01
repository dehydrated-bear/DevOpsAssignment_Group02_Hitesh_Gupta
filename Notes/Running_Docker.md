# Running Docker

## Starting Docker

1. **Install Docker Desktop** (Windows/Mac) or Docker Engine (Linux)
2. **Start Docker Desktop** from your applications
3. **Verify installation** by running `docker --version` in terminal
4. **Verify the daemon is running** with `docker info`

> **Note:** The Docker daemon must be running before any Docker commands will work. On Windows and Mac, Docker Desktop handles this automatically once launched.

## Running Your First Container

```bash
# Run the hello-world container
docker run hello-world
```

This command downloads the `hello-world` image from Docker Hub (if not already local), creates a container from it, runs it, and shows a welcome message. If you see the confirmation message, Docker is working correctly.

## Working with This Project

### Building the Image
```bash
# Build the Docker image from the Dockerfile
docker build -t ddpdocker .

# Check if the image was created
docker images
```

The `-t` flag tags the image with a name so you can reference it later. The `.` at the end tells Docker to use the current directory as the build context.

### Running the Container
```bash
# Run the container
docker run -d -p 8080:80 ddpdocker

# Access the application at http://localhost:8080
```

Breaking down the flags:
- `-d` — run the container in detached mode (in the background)
- `-p 8080:80` — map host port 8080 to container port 80

### Viewing Container Logs and Output
```bash
# Follow logs in real time
docker logs -f <container_id>

# Show logs from the last 100 lines
docker logs --tail 100 <container_id>
```

### Managing Containers
```bash
# View running containers
docker ps

# View all containers including stopped ones
docker ps -a

# Stop a container
docker stop <container_id>

# Start a stopped container
docker start <container_id>

# Remove a container
docker rm <container_id>

# Force remove a running container
docker rm -f <container_id>

# Remove an image
docker rmi ddpdocker
```

### Entering a Running Container
```bash
# Get an interactive shell inside the container
docker exec -it <container_id> /bin/bash

# Run a single command inside the container
docker exec <container_id> ls -la
```

## Working with Images

```bash
# List all local images
docker images

# Pull an image from Docker Hub
docker pull <image_name>

# Remove an image and its dependencies
docker rmi --force <image_name>

# Show image history
docker history ddpdocker
```

## Cleaning Up

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune

# Remove ALL unused Docker resources (containers, images, networks, and cache)
docker system prune -a
```

## Troubleshooting

- If port 8080 is in use, try a different port: `-p 9090:80`
- Check container logs: `docker logs <container_id>`
- Access container shell: `docker exec -it <container_id> /bin/bash`
- If `docker build` fails, check for errors in the Dockerfile and ensure the base image name is correct
- If the container exits immediately, check logs — the application may be crashing at startup
- Verify Docker is running: `docker info` — if this fails, start Docker Desktop first
