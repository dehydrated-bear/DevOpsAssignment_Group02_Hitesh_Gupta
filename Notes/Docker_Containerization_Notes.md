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

---

## 5. Containerizing This Project - Step by Step

This section walks through how a typical web application in this project would
be containerized end to end. The approach works for Node.js, Python, Java, or
static frontend codebases.

### Step 1 - Understand the application

Before writing anything, answer these questions:

1. What runtime does the app need? (Node 18, Python 3.11, OpenJDK 17, etc.)
2. What is the start command? (`npm start`, `python app.py`, `java -jar app.jar`)
3. What port does it listen on? (3000, 5000, 8080, 80)
4. What are the build steps, if any? (`npm run build`, `mvn package`)
5. Does it need environment variables or persistent storage?
6. Does it have to talk to a database, cache, or another service?

### Step 2 - Plan the Dockerfile

The simplest plan is: base image, work directory, install dependencies, copy
source, define the start command. For production you add a build stage, a
non-root user, and a `.dockerignore`.

### Step 3 - Plan the container layout

A typical preview of the runtime layout:

```text
HOST                         CONTAINER
localhost:3000  ----------->  container:3000   (app)
localhost:5000  ----------->  container:5000   (api)
localhost:80    ----------->  container:80     (frontend)
```

### Step 4 - Build and test locally

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
curl http://localhost:3000
```

### Step 5 - Push and deploy

```bash
docker tag my-app myusername/my-app:1.0.0
docker push myusername/my-app:1.0.0
```

---

## 6. Writing the Dockerfile for the Project

### Node.js example

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"]
```

### Python/Flask example

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

### Ordering matters for caching

Docker caches each layer. If you copy all of the source code first and then
run `npm install`, every source change invalidates the dependency layer,
forcing a slow re-install. Copy the dependency manifests, install, and only
then copy the source:

```dockerfile
COPY package*.json ./     # changes rarely
RUN npm install           # cached until the manifest changes
COPY . .                  # changes often, never breaks the cache above
```

### ENTRYPOINT vs CMD

- `CMD` is the default command and can be overridden at run time.
- `ENTRYPOINT` is the fixed command that always runs; arguments are appended.

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

Now `docker run my-image app.py --host 0.0.0.0` appends arguments to the
entrypoint, giving great flexibility.

---

## 7. The .dockerignore File

The `.dockerignore` file stops unnecessary files from being copied into the
image or sent to the daemon's build context. A bloated build context makes
builds slow and images large.

```text
node_modules
npm-debug.log
.git
.gitignore
.env
Dockerfile
.dockerignore
*.log
build
dist
coverage
*.md
```

A good `.dockerignore` also prevents accidentally baking secrets (like `.env`)
into an image that might later be pushed to a public registry.

---

## 8. Building, Tagging, and Running Images

### Building

```bash
docker build -t my-app .
docker build -t my-app -f docker/Dockerfile.prod .
docker build --no-cache -t my-app .
```

`--no-cache` forces a full rebuild, bypassing cached layers. This is useful
when debugging weird layer caching behaviour.

### Running

```bash
# foreground
docker run -p 3000:3000 my-app

# detached
docker run -d -p 3000:3000 my-app

# with a name
docker run -d --name my-app -p 3000:3000 my-app

# with an environment variable
docker run -d -e NODE_ENV=production -p 3000:3000 my-app

# with an env file
docker run -d --env-file .env -p 3000:3000 my-app

# with restart policy
docker run -d --restart unless-stopped -p 3000:3000 my-app
```

### Tagging

```bash
docker tag my-app myusername/my-app:latest
docker tag my-app myusername/my-app:1.0.0
```

### Removing unused objects

```bash
docker image prune
docker container prune
docker system prune -a
```

---

## 9. docker-compose for Multi-Container Setups

A real application is rarely a single container. A typical stack has a
frontend, an API, a database, and a cache. `docker-compose.yml` lets you
declare the whole stack in one file and run it with one command.

### Basic compose file

```yaml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=secret
      - POSTGRES_DB=appdb
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

### Common compose commands

```bash
docker compose up -d          # start the stack in the background
docker compose build          # build all images
docker compose down           # stop and remove containers
docker compose down -v        # also remove volumes
docker compose ps             # list services
docker compose logs -f web    # follow logs of a service
docker compose exec web sh    # open a shell in a service
```

### Why `depends_on` is not enough

`depends_on` only controls the start order, not readiness. Modern Postgres can
still be initializing when the app connects. Real readiness checks need custom
logic or health checks (see section 16).

---

## 10. Docker Networks

Containers on the same network can talk to each other by service name.
Networks provide both **isolation** and **connectivity**.

```bash
docker network create my-net
docker run -d --network my-net --name api my-api
docker run -d --network my-net --name web -p 80:80 my-web
```

Inside the `my-net` network, `web` can reach `api` simply by using the hostname
`api`, regardless of any IP address.

### Default bridge in older workflows

In the default bridge network, containers reach each other by IP, which is
unpredictable. User-defined networks add DNS resolution by container name,
which is why they are preferred.

---

## 11. Docker Volumes and Persistent Data

Containers are ephemeral. Anything written to a container's filesystem is
lost when the container is removed. Volumes persist data across container
lifecycles.

### Three options for persistence

| Option       | Description                                              |
| ------------ | -------------------------------------------------------- |
| **Volume**   | Stored in Docker-managed storage, the recommended way.   |
| **Bind mount** | A host directory mapped into the container.           |
| **tmpfs**    | Stored in memory only, lost on restart.                  |

```bash
# named volume
docker run -v mydata:/app/data my-app

# bind mount (host path)
docker run -v /host/path:/app/data my-app

# named volume in compose
#   volumes:
#     - "./local-dir:/app/data"
```

### Why use volumes

- Databases need data to survive container restarts.
- Logs can be collected outside the container.
- Host files can be shared into the container for development.

---

## 12. Docker Security Best Practices

- **Run as a non-root user.** Unprivileged users limit blast radius if a
  container is compromised.
- **Use small, trusted base images** with specific tags, never `latest`.
- **Never bake secrets into images.** Use environment variables, secrets, or
  secret managers at run time.
- **Scan images** with tools like `docker scout` or `trivy` for known CVEs.
- **Apply least privilege** - drop capabilities, read-only root filesystem.
- **Pin dependencies** so rebuilds produce identical images.

```bash
docker scout cves my-app
docker run --read-only --cap-drop ALL my-app
```

---

## 13. Troubleshooting and Debugging

The most common container problems and their fixes:

| Symptom                     | Likely cause                         | Fix                                    |
| --------------------------- | ------------------------------------ | -------------------------------------- |
| Container exits immediately | CMD is wrong or app crashes on boot  | Check `docker logs`                    |
| Port not reachable          | Wrong port mapping or firewall       | `-p 3000:3000` and app binds 0.0.0.0   |
| Slow builds                 | Layer cache invalidated              | Copy manifests before source           |
| Image too large             | Build tools in runtime image         | Use multi-stage builds                 |
| Connection refused to db    | Wrong network or readiness           | Same network, use health checks        |

```bash
docker logs my-app
docker exec -it my-app sh
docker inspect my-app
docker stats
```

---

## 14. Common Commands Cheat Sheet

```bash
docker build -t my-app .                 # build an image
docker run -d -p 3000:3000 my-app        # run a container
docker ps -a                             # list containers
docker images                            # list images
docker stop <id> && docker rm <id>       # stop and remove
docker logs -f <id>                      # follow logs
docker exec -it <id> sh                  # shell in container
docker compose up -d                     # run a compose stack
docker compose down -v                   # teardown everything
docker system prune -a                   # clean up disk space
```

---

## 15. Summary and Checklist

- [ ] Dockerfile starts with a pinned `FROM` base image.
- [ ] Dependency manifests are copied before the source for caching.
- [ ] `.dockerignore` excludes secrets, lock files, and build artifacts.
- [ ] The app runs as a non-root user.
- [ ] Port is documented with `EXPOSE` and mapped with `-p`.
- [ ] Environment variables come from env files or compose, not the image.
- [ ] Data that must survive restarts lives in a volume.
- [ ] Logs and health checks are configured for the service.
- [ ] The image builds, runs, and is tested locally before pushing.
- [ ] Multi-stage builds keep the production image small.

Containerization turns an application into a repeatable, portable, and
scalable artifact. Master the Dockerfile, compose for your services, volume
your data, and ship with confidence.