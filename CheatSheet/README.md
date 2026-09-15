# 🐳 Docker: The Complete Process — From Start to Finish

> **Branch:** `jay-ddp`
>
> A step-by-step walkthrough of the **entire Docker process**, from installing Docker to running a full-stack app in production. Every section contains **real, copy-paste-ready code examples** followed by an explanation of **how the code works**.

The examples are based on the project in [`FullStackApp/`](../FullStackApp/): a **React (Vite + Nginx) frontend**, a **Node.js Express backend**, and a **MongoDB** database — all containerized.

---

## 📂 CheatSheet — All Files in This Folder

### Docker from Start to End (jay-ddp)

- [**Docker_Process_CheatSheet.md**](./Docker_Process_CheatSheet.md) — Condensed quick-reference cheat sheet of the **whole Docker process** from start to end: install, images, Dockerfile, build, run, volumes, networks, Compose, debugging, registry, cleanup.

### Docker Comprehensive Guides (Manish Kumar — branch: `manish-dpp`)

- [**Docker_CheatSheet.md**](./Docker_CheatSheet.md) — Comprehensive Docker quick-reference covering images, containers, Dockerfiles, volumes, networking, Docker Compose, debugging, registries, and best practices.
- [**Docker_Compose_Volumes_Networking.md**](./Docker_Compose_Volumes_Networking.md) — Deep dive into multi-container orchestration (Compose), persistent storage (volumes/mounts), and container networking.
- [**Docker_Troubleshooting_FAQ.md**](./Docker_Troubleshooting_FAQ.md) — Common errors & fixes, step-by-step debugging, and interview-focused FAQ.
- [**Docker_Practical_Scenarios.md**](./Docker_Practical_Scenarios.md) — 12 hands-on real-world scenarios: containerizing apps, multi-stage builds, Compose stacks, debugging, hot-reload, private registries, resource limits, backups, security audits.

**Topics covered across the whole folder:**
1. What is Docker & Container vs VM
2. Installation
3. Architecture & core objects
4. Dockerfile reference (FROM, RUN, COPY, CMD, ENTRYPOINT...)
5. Building & running images/containers
6. Managing containers & images
7. Volumes & data persistence
8. Networking
9. Docker Compose
10. Logs, debugging & system commands
11. Best practices & security (multi-stage builds)
12. Quick top-20 one-liners
13. Deep dive: Compose YAML, volumes/mounts, network drivers
14. Troubleshooting: common errors, debugging flow, FAQ
15. 12 practical scenarios & mini projects
16. The full end-to-end Docker process walkthrough (this document)
17. The one-page Docker process cheat sheet

---

## 📚 Table of Contents

1. [The Big Picture: The Whole Process](#1-the-big-picture-the-whole-process)
2. [Step 1 — Install and Verify Docker](#2-step-1--install-and-verify-docker)
3. [Step 2 — Understand Docker Architecture](#3-step-2--understand-docker-architecture)
4. [Step 3 — Get an Image and Run Your First Container](#4-step-3--get-an-image-and-run-your-first-container)
5. [Step 4 — Write a Dockerfile](#5-step-4--write-a-dockerfile)
6. [Step 5 — Build the Image](#6-step-5--build-the-image)
7. [Step 6 — Run Containers and Manage Their Lifecycle](#7-step-6--run-containers-and-manage-their-lifecycle)
8. [Step 7 — Persist Data with Volumes](#8-step-7--persist-data-with-volumes)
9. [Step 8 — Connect Containers with Networks](#9-step-8--connect-containers-with-networks)
10. [Step 9 — Orchesterate Everything with Docker Compose](#10-step-9--orchestrate-everything-with-docker-compose)
11. [Step 10 — Debug, Logs, and Troubleshooting](#11-step-10--debug-logs-and-troubleshooting)
12. [Step 11 — Share Images with a Registry](#12-step-11--share-images-with-a-registry)
13. [Step 12 — Clean Up Your System](#13-step-12--clean-up-your-system)
14. [How the Pieces Fit Together (End-to-End Flow Diagram)](#14-how-the-pieces-fit-together-end-to-end-flow-diagram)

---

## 1. The Big Picture: The Whole Process

The Docker process always follows the same 8-step loop. When you understand this loop, every Docker command you type makes sense:

```
1. INSTALL  → install and start the Docker engine
2. IMAGE    → get an existing image OR write a Dockerfile
3. BUILD    → docker build turns the Dockerfile into an image
4. RUN      → docker run turns the image into a running container
5. PERSIST  → volumes keep data even when the container is deleted
6. CONNECT  → networks let containers talk to each other
7. DEBUG    → logs + exec let you inspect and fix what's running
8. SHIP     → docker push publishes your image to a registry
```

### What are images and containers?

| Concept | What it is | Analogy |
|---------|-----------|---------|
| **Image** | A read-only template / blueprint (code + dependencies + config) | A **recipe** |
| **Container** | A running instance of an image (isolated process) | The **cooked dish** |
| **Dockerfile** | The text file that describes how to build an image | The **recipe card** |
| **Registry** | A server that stores and shares images | The **supermarket** |

```bash
# The single most important mental model:
docker build  -t myapp .     # recipe   -> blueprint
docker run    myapp          # blueprint -> running dish
```

---

## 2. Step 1 — Install and Verify Docker

### macOS (Homebrew)

```bash
brew install --cask docker    # installs Docker Desktop
open -a Docker                # starts Docker Desktop
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Windows
Install **Docker Desktop** with the **WSL2** backend.

### Verify the install — and how it works

```bash
docker --version        # shows the client version
docker info             # shows daemon status, images, containers, networks...
docker run hello-world  # smoke test: pulls a tiny image and prints "Hello from Docker!"
```

**How it works:** `docker run hello-world` first looks for the image locally. It doesn't exist, so the Docker *client* (the CLI you type into) asks the Docker *engine/daemon* (the background service doing the real work) to pull `hello-world` from Docker Hub, then run it. Seeing the "Hello from Docker!" message proves the whole client → daemon → registry pipeline works.

> **Linux permission note:** to avoid typing `sudo` before every command:
> `sudo usermod -aG docker $USER` then log out and back in.

---

## 3. Step 2 — Understand Docker Architecture

Docker has three moving parts. Commands only work when you understand *who does what*:

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR TERMINAL                        │
│        you type:  docker build / run / pull             │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (over a socket)
                         ▼
┌─────────────────────────────────────────────────────────┐
│              DOCKER CLIENT  (the CLI tool)              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/JSON
                         ▼
┌─────────────────────────────────────────────────────────┐
│          DOCKER ENGINE / DAEMON  (dockerd)              │
│  ├─ images  (stored images)        ├─ containers (runtime)│
│  ├─ networks (virtual bridges)     └─ volumes (persistent data)
│                                                           │
└────────────────────────┬────────────────────────────────┘
                         │  pulls / pushes
                         ▼
┌─────────────────────────────────────────────────────────┐
│              IMAGE REGISTRY  (Docker Hub)               │
└─────────────────────────────────────────────────────────┘
```

```bash
# The key command that shows you the daemon state:
docker info

# Shortcuts the client uses to talk to the engine:
docker version --format '{{.Server.Version}}'   # daemon version
```

**How it works:** The `docker` command is a small client. It sends instructions to the daemon over a socket. The daemon builds, runs, and manages everything. This is why a single CLI can talk to local *or remote* engines.

---

## 4. Step 3 — Get an Image and Run Your First Container

### Pull an image from a registry

```bash
docker pull mongo:7.0        # pulls the mongo 7.0 image from Docker Hub
docker pull node:20-alpine   # small (~50MB) Node 20 image based on Alpine Linux
docker images                # list all images you now have locally
```

**How it works:** `docker pull` downloads the image layers (each file-system change is a separate layer) from the registry and stores them on your disk. Layers are shared between images — that's why multiple images download fast.

### Run your first real container

```bash
docker run -d --name mymongo -p 27017:27017 mongo:7.0
```

**How it works, flag by flag:**
- `run` → creates *and* starts a container from the `mongo:7.0` image
- `-d` (detached) → runs in the background so your terminal stays free
- `--name mymongo` → gives the container a friendly name
- `-p 27017:27017` → **port mapping**. `HOST_PORT:CONTAINER_PORT`. Traffic hitting your laptop's port `27017` is forwarded into the container's port `27017`. Without this, nothing from outside can reach the container.

### Check what's running

```bash
docker ps                 # running containers (NAME, IMAGE, PORTS, STATUS...)
docker ps -a              # ALL containers, including stopped ones
docker logs mymongo       # stream the Mongo startup logs
docker stop mymongo       # stop it
docker start mymongo      # start it again later
docker rm mymongo         # permanently remove the container
```

---

## 5. Step 4 — Write a Dockerfile

The **Dockerfile** is the blueprint for an image. Every line usually creates one **layer**.

### Backend Dockerfile — explained line by line

![backend `Dockerfile`](../FullStackApp/backend/Dockerfile)

```dockerfile
# 1. Base image: a pre-built image we start from
FROM node:20-alpine AS base

# 2. Set the working directory inside the container
WORKDIR /app

# 3. A second stage only for installing dependencies
FROM base AS dependencies

# 4. Copy only the package files first (this layer rarely changes -> caching works)
COPY package*.json ./
# 5. Install only production deps with npm ci (clean install from lockfile)
RUN npm ci --omit=dev

# 6. Final production stage
FROM base AS production

# 7. Set environment variable inside the container
ENV NODE_ENV=production

# 8. Copy node_modules from the dependencies stage (multi-stage build)
COPY --from=dependencies /app/node_modules ./node_modules
# 9. Copy our application code
COPY package*.json ./
COPY server.js ./
COPY src ./src

# 10. Create a tiny curl + a non-root user (good security practice)
RUN apk add --no-cache curl && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /app

# 11. Switch to the non-root user (never run containers as root!)
USER appuser

# 12. Document which port the app listens on
EXPOSE 5000

# 13. Tell Docker how to check the app is healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# 14. The actual start command
CMD ["node", "server.js"]
```

**How it works:**
- **Base image (`FROM`)** — instead of installing Node from scratch, we inherit a ready-made one.
- **Layer caching** — Docker caches each layer. Because we copy `package*.json` *before* the source code, changing code never re-installs `node_modules` (huge build speedup on every rebuild).
- **Multi-stage build** — there are three `FROM` stages. The `dependencies` stage installs packages, then the `production` stage copies just the result. The final image is lean: no compiler toolchains.
- **`CMD` vs `RUN`** — `RUN` executes *during the build* (once), `CMD` defines the command executed *every time the container starts*.
- **`COPY --from=...`** — lets one stage borrow files from a previous stage.

### Frontend Dockerfile — the React + Nginx pattern

![frontend `Dockerfile`](../FullStackApp/frontend/Dockerfile)

```dockerfile
# Stage 1: BUILD — compile the static site
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.js ./
COPY src ./src

# Build-time variable (defaults to /api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Vite compiles React into plain HTML/CSS/JS in /app/dist
RUN npm run build

# Stage 2: SERVE — a webserver distributes those static files
FROM nginx:1.27-alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**How it works:** React build output is *static files* — node is not needed at runtime. So stage 1 builds the site, stage 2 copies only the finished `dist` folder into an Nginx image. **The final image has no Node, just Nginx serving bytes.** This is the classic "static site in Docker" pattern.

### The Nginx reverse proxy config

![frontend `nginx.conf`](../FullStackApp/frontend/nginx.conf)

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    # Serve the SPA: fall back to index.html for client-side routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Forward /api/* requests to the backend container over the Docker network
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets for 30 days
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

**How it works:** Browsers ask Nginx for `/index.html` and static assets (served from disk, fast). API calls starting with `/api/` are *proxy_passed* to `http://backend:5000` — notice `backend` is the **container name**, not an IP. Docker's internal DNS resolves it to the backend container's IP automatically.

---

## 6. Step 5 — Build the Image

```bash
# Build with a tag (-t name:version) from the Dockerfile in ./backend
docker build -t taskmanager-backend:latest ./backend

# Build the frontend
docker build -t taskmanager-frontend:latest ./frontend

# List your images
docker images
```

**How it works:** the engine reads the Dockerfile, executes each instruction top-to-bottom as a new layer, and assembles the final image under the tag `taskmanager-backend:latest` (`latest` is the default version tag). With overlapping layers, it prints `CACHED` and skips re-doing unchanged steps.

```bash
# See the layers that make up an image
docker history taskmanager-backend:latest
```

---

## 7. Step 6 — Run Containers and Manage Their Lifecycle

```bash
# Run the backend daemon in the background, mapping port 5000
docker run -d --name taskmanager_backend \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://mongo:27017/taskmanager \
  taskmanager-backend:latest

# Run the frontend on port 80
docker run -d --name taskmanager_frontend -p 80:80 taskmanager-frontend:latest

# Lifecycle commands
docker ps                           # running containers
docker ps -a                        # all containers
docker logs -f taskmanager_backend  # follow the logs live
docker exec -it taskmanager_backend sh   # open a shell INSIDE the container
docker stop taskmanager_backend     # stop (SIGTERM then SIGKILL after grace)
docker start taskmanager_backend    # start again
docker restart taskmanager_backend  # restart
docker rm -f taskmanager_backend    # force remove
```

**How it works — `-e` environment variables:** `MONGO_URI=mongodb://mongo:27017/taskmanager` is injected into the container's environment. The app reads it from `process.env.MONGO_URI` (see `backend/src/config/db.js`). Hardcoding secrets in `-e` on the command line is discouraged — use a `.env` file or Docker secrets instead.

`docker exec -it ... sh` drops you into a running container's shell — the tool you reach for when "the app inside runs, but why is it broken?".

---

## 8. Step 7 — Persist Data with Volumes

Containers are ephemeral: when a container is deleted, everything inside its writable layer is *gone*. Volumes survive.

```bash
# Create a named volume
docker volume create mongo_data

# Mount it so Mongo writes to the volume instead of the container's disk
docker run -d --name taskmanager_mongo \
  -v mongo_data:/data/db \
  -p 27017:27017 \
  mongo:7.0

# Prove it: delete the container, the volume keeps the data
docker rm -f taskmanager_mongo
docker volume ls                 # mongo_data still exists
docker run -d --name taskmanager_mongo2 -v mongo_data:/data/db mongo:7.0
```

**How it works:** `-v mongo_data:/data/db` mounts the named volume `mongo_data` at the container path `/data/db`. Mongo writes there, the writes land on the host's disk (managed by Docker under `/var/lib/docker/volumes/`), and they survive any container death.

### The three persistence types

```bash
# 1. Named volume (recommended)
-v mydata:/app/data

# 2. Bind mount — a real folder on your host (great for dev, hot-reload)
-v "$(pwd)/backend/src:/app/src"

# 3. Anonymous volume — auto-created with a random id
-v /app/data
```

```bash
# Useful volume commands
docker volume ls
docker volume inspect mongo_data
docker volume rm mongo_data
```

---

## 9. Step 8 — Connect Containers with Networks

Containers are isolated by default. To let them talk, put them on the **same (custom) network**. Then they reach each other by **container name**.

```bash
# Create a bridge network
docker network create tasknet

# Join containers to it
docker run -d --name mongo      --network tasknet mongo:7.0
docker run -d --name backend   --network tasknet -p 5000:5000 taskmanager-backend:latest

# From inside the backend container, "mongo" now resolves:
docker exec backend sh -c "wget -qO- http://mongo:27017 || echo 'mongo reachable'"
```

**How it works:** Docker runs a built-in **DNS server**. Any container on `tasknet` can be reached by its container name from any other container on `tasknet`. This is why the backend's `MONGO_URI` in the compose file (`mongodb://mongo:27017/...`) uses plain `mongo` — that's the container name, and the network resolves it to an IP.

```bash
# If you use default bridge or host networking, DNS-by-name does NOT work the same way.
docker network ls        # list networks: bridge, host, none, overlay (swarm)
docker network inspect tasknet    # shows connected containers + IPs
docker network rm tasknet         # delete it
```

---

## 10. Step 9 — Orchestrate Everything with Docker Compose

Compose replaces the 20-line shell script with one YAML file: `docker-compose.yml`. The real one for this project:

![`docker-compose.yml`](../FullStackApp/docker-compose.yml)

```yaml
services:
  mongo:
    image: mongo:7.0                # image (no build needed)
    container_name: taskmanager_mongo
    restart: unless-stopped         # auto-restart policy
    volumes:
      - mongo_data:/data/db         # persist the database
    healthcheck:
      # only "healthy" containers count for depends_on
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    networks:
      - tasknet

  backend:
    build:
      context: ./backend            # build from Dockerfile in ./backend
    container_name: taskmanager_backend
    restart: unless-stopped
    depends_on:
      mongo:
        condition: service_healthy  # DO NOT start until mongo is healthy
    environment:                    # injected env vars (same as -e)
      NODE_ENV: production
      PORT: 5000
      MONGO_URI: mongodb://mongo:27017/taskmanager
      JWT_SECRET: ${JWT_SECRET:-change_this_secret_in_production}
      JWT_EXPIRES_IN: 7d
      CLIENT_ORIGIN: http://localhost
      RATE_LIMIT_WINDOW_MS: 900000
      RATE_LIMIT_MAX: 100
    ports:
      - "5000:5000"
    networks:
      - tasknet

  frontend:
    build:
      context: ./frontend
    container_name: taskmanager_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
    networks:
      - tasknet

# Named volume + network declared at the bottom, once, globally
volumes:
  mongo_data:

networks:
  tasknet:
    driver: bridge
```

**How it works:**
- Each top-level key under `services:` is one container spec.
- Compose **automatically creates** the `tasknet` network and the `mongo_data` volume, and connects every service to them — no manual `docker network create` needed.
- **Service name = DNS name.** Inside the network, `frontend` can reach `backend`, and `backend` can reach `mongo`.
- **`depends_on` with `condition: service_healthy`** guarantees Mongo is fully ready *before* the backend tries to connect — this fixes the classic "backend can't connect to db" race.
- **`${JWT_SECRET:-...}`** reads from your host `.env` file, with a fallback default. Keep secrets in `.env` (which is git-ignored), not in the YAML.

### Lifecycle of the whole stack

```bash
# Build and start everything
docker compose up -d --build

# See the running stack
docker compose ps

# Logs from any/all services
docker compose logs -f backend

# Scale: run 3 frontend replicas
docker compose up -d --scale frontend=3

# Stop everything (containers stay, can be restarted)
docker compose stop

# Start everything again
docker compose start

# Tear down containers + network (volumes kept)
docker compose down

# Tear down EVERYTHING including volumes (data loss!)
docker compose down -v
```

**How it works:** `docker compose up -d --build` builds any service with a `build:` key, pulls the `image:` ones, creates the network/volumes, and starts all containers in dependency order. `docker compose` reads `docker-compose.yml` by default; override with `-f some-other.yml`.

---

## 11. Step 10 — Debug, Logs, and Troubleshooting

```bash
# The #1 debugging tool: logs
docker logs taskmanager_backend
docker logs --tail 100 -f taskmanager_backend     # last 100 lines, follow

# Get inside the container
docker exec -it taskmanager_backend sh            # shell in the container
docker exec -it taskmanager_backend node -e "console.log(process.env.PORT)"

# Inspect configuration and state
docker inspect taskmanager_backend                # full JSON config
docker inspect -f '{{.State.Status}} {{.NetworkSettings.IPAddress}}' taskmanager_backend
docker stats                                       # live CPU / memory per container
docker top taskmanager_backend                     # running processes inside

# Check the image's exposed ports / CMD
docker image inspect taskmanager-backend:latest
```

### The "can't connect" checklist
1. `docker ps` — is the container actually running?
2. `docker logs <name>` — what does the app say?
3. `docker network inspect tasknet` — is the container on the *same* network?
4. `docker exec <name> ping <other-service>` — can it resolve the other container's name?
5. Is the port mapped (`-p`) if you're connecting from the host?

```bash
# Copy a file in/out (rarely needed, but handy)
docker cp taskmanager_backend:/app/package.json ./host-package.json
docker cp ./fix.js taskmanager_backend:/app/fix.js
```

---

## 12. Step 11 — Share Images with a Registry

A registry is a server that stores images so others can `pull` them. Docker Hub is the default.

```bash
# Tag your image with the registry/username prefix
docker tag taskmanager-backend:latest jay/taskmanager-backend:v1.0.0

# Log in to Docker Hub
docker login

# Upload it
docker push jay/taskmanager-backend:v1.0.0

# Anyone else can now run it:
docker pull jay/taskmanager-backend:v1.0.0
docker run -d -p 5000:5000 jay/taskmanager-backend:v1.0.0
```

**How it works:** the image name `jay/taskmanager-backend:v1.0.0` is `NAMESPACE/REPOSITORY:TAG`. Docker Hub is implied when there's no host prefix. The push uploads only the layers that don't already exist on the registry — so updating one line of code pushes a tiny delta, not the whole image.

---

## 13. Step 12 — Clean Up Your System

```bash
# Stop ALL containers
docker stop $(docker ps -q)

# Remove ALL containers (running ones too)
docker rm -f $(docker ps -aq)

# Remove ALL images (untagged/dangling too)
docker rmi $(docker images -q)

# Remove everything: unused images, containers, networks + build cache
docker system prune
docker system prune -a     # also unused AND untagged images
docker system prune -af    # no confirmation prompt
docker system df           # disk usage overview
```

---

## 14. How the Pieces Fit Together (End-to-End Flow Diagram)

```
 Browser ── http://localhost ──►  [frontend container :80]   (Nginx static files)
                                      │  location /api/
                                      ▼  proxy_pass http://backend:5000
                              [backend container :5000]   (Node/Express)
                                      │  process.env.MONGO_URI
                                      ▼  mongodb://mongo:27017/taskmanager
                              [mongo container :27017]
                                      ▲
                                (writes to volume mongo_data)
 ─────────────────────────────────────────────────────────────────────
 All three containers sit on the SAME network:  tasknet
  - frontend  → backend   by name "backend"
  - backend   → mongo     by name "mongo"
 Data never dies:  mongo writes into the named volume mongo_data
```

**The full production-ish workflow, one command at a time:**

```bash
# 1. Install + verify Docker
docker --version
docker run hello-world

# 2. Build the images (Dockerfiles in each app folder)
docker build -t taskmanager-backend:latest  ./backend
docker build -t taskmanager-frontend:latest ./frontend

# 3. Or skip all manual steps and just:
docker compose up -d --build

# 4. Sanity check
docker compose ps
docker compose logs -f backend

# 5. Live debugging
docker exec -it taskmanager_backend sh

# 6. Share images
docker tag taskmanager-backend:latest jay/taskmanager-backend:v1.0.0
docker push jay/taskmanager-backend:v1.0.0

# 7. Cleanup at the end of the day
docker compose down
docker system prune -af
```

And that is the **entire Docker process from start to finish**: install → image → build → run → persist → network → compose → debug → ship → clean.
> For the condensed quick-reference version of everything above, see [`Docker_Process_CheatSheet.md`](./Docker_Process_CheatSheet.md).
