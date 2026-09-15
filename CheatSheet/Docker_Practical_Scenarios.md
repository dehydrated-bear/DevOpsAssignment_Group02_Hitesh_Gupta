# Docker Practical Scenarios & Mini Projects

> **Assignment Topic:** Docker & Containerization
> **Author:** Manish Kumar
> **Branch:** `manish-dpp`

Hands-on scenarios that apply everything in real projects. Great for interviews, exam prep, and actual work.

---

## Scenario 1: Containerize a Node.js App

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
RUN adduser --disabled-password appuser
USER appuser
CMD ["node", "server.js"]
```

```bash
docker build -t mynodeapp .
docker run -d -p 3000:3000 --name nodeapp mynodeapp
curl http://localhost:3000
```

**Key points:** pin the node version, use `npm ci` for reproducible installs, run as non-root.

---

## Scenario 2: Containerize a Python Flask App

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
RUN useradd -m appuser
USER appuser
CMD ["python", "app.py"]
```

```bash
docker build -t flaskapp .
docker run -d -p 5000:5000 --name flask flaskapp
```

---

## Scenario 3: Multi-Stage Build (Go binary, 1.2GB → 12MB)

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/server .

# Runtime stage — minimal image
FROM gcr.io/distroless/static-debian12
COPY --from=builder /out/server /server
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

```bash
docker build -t tinygo .
docker images tinygo          # will be ~12MB
```

---

## Scenario 4: Database + App Stack with Docker Compose

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/mydb

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

```bash
docker compose up -d --build
docker compose logs -f app
docker compose down          # keeps data (pgdata volume persists)
docker compose down -v       # destroys data too
```

**Key point:** `depends_on` with `condition: service_healthy` waits for the DB to be ready, not just "started".

---

## Scenario 5: Debug a Broken Container

```bash
# 1. Container exited unexpectedly
docker ps -a                           # see status + exit code

# 2. Read logs
docker logs <container_id>

# 3. Run interactively to reproduce
docker run -it myapp /bin/sh

# 4. Inspect the filesystem changes
docker diff <container_id>

# 5. Copy a file out before destroying the container
docker cp <id>:/app/crash.log ./crash.log

# 6. Rebuild with a fix, remove old container, run new one
docker rm -f <container>
docker build -t myapp .
docker run -d -p 8080:80 --name myapp myapp
```

---

## Scenario 6: Development Hot-Reload Setup

```yaml
version: "3.9"

services:
  dev:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./src:/app:cached     # live code sync from host
      - /app/node_modules     # anonymous volume to preserve installed deps
    ports:
      - "3000:3000"
    command: ["npx", "nodemon", "server.js"]
    environment:
      NODE_ENV: development
```

```bash
docker compose up
# edit src/server.js on host → changes appear instantly in container
```

**Key point:** anonymous volumes (`/app/node_modules`) override bind mounts for that path, preventing host `node_modules` from clobbering the container's installed deps.

---

## Scenario 7: Push Image to Private Registry

```bash
# Login to your registry
docker login ghcr.io -u Manish546-gif

# Tag the image
docker tag myapp:1.0 ghcr.io/Manish546-gif/myapp:1.0

# Push
docker push ghcr.io/Manish546-gif/myapp:1.0

# Pull on another machine
docker pull ghcr.io/Manish546-gif/myapp:1.0
```

---

## Scenario 8: Container Resource Limits

```bash
# Limit to 512MB RAM and 1 CPU
docker run -d \
  --memory=512m \
  --cpus=1.0 \
  --restart=unless-stopped \
  --name constrained_app \
  myapp

# See live resource usage
docker stats constrained_app
```

```yaml
# In docker-compose.yml
services:
  web:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
```

---

## Scenario 9: Log Management

```bash
# Use a logging driver
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  myapp

# View logs outside the container (on Linux host)
ls /var/lib/docker/containers/<id>/<id>-json.log

# Centralized: send logs to a collector
docker run -d --log-driver=syslog myapp
docker run -d --log-driver=fluentd myapp
docker run -d --log-driver=gelf myapp
```

---

## Scenario 10: Backup and Restore a Named Volume

```bash
# Backup a database volume
docker run --rm \
  -v pgdata:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/pgdata-backup.tar.gz -C /source .

# Restore
docker run --rm \
  -v pgdata:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/pgdata-backup.tar.gz -C /target
```

---

## Scenario 11: Docker Security Audit

```bash
# Scan an image for vulnerabilities
docker scout cves myapp:latest
trivy image myapp:latest

# Check running containers for issues
docker scout recommendations --image myapp

# List all non-root containers
docker exec <id> id          # should show uid > 0
docker exec <id> cat /etc/passwd | grep appuser
```

```dockerfile
# Security-hardened Dockerfile example
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app /app
WORKDIR /app
USER nonroot
EXPOSE 3000
CMD ["server.js"]
```

---

## Scenario 12: Clean Up Everything

```bash
# Show what's taking space
docker system df -v

# Remove everything unused (containers, images, networks, build cache)
docker system prune -a --volumes

# Nuclear option: stop Docker, delete /var/lib/docker, restart
sudo systemctl stop docker
sudo rm -rf /var/lib/docker/*
sudo systemctl start docker
```

---

*Happy containerizing ! — Manish Kumar (manish-dpp)*
