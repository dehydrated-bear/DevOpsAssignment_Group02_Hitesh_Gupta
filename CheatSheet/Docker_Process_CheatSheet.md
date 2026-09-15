# 🐳 Docker Process From Start to End — Quick Reference Cheat Sheet

> **Branch:** `jay-ddp`
>
> The **condensed cheat sheet** covering the whole Docker lifecycle in one page —
> install → image → build → run → persist → network → compose → debug → ship → clean.
> For the full step-by-step walkthrough with in-depth explanations, open [`README.md`](./README.md).

---

## 🧱 The Whole Process in One Line

```
installdocker → pull/build image → run container → add volumes + networks →
compose everything → debug with logs → push to registry → prune when done
```

---

## ⚡ Top 15 One-Liners (the 80% you use daily)

| # | Task | Command |
|---|------|---------|
| 1 | Verify install | `docker --version` |
| 2 | Smoke test | `docker run hello-world` |
| 3 | List images | `docker images` |
| 4 | List running containers | `docker ps` |
| 5 | List all containers | `docker ps -a` |
| 6 | Build image | `docker build -t myapp:1.0 .` |
| 7 | Run detached + port map | `docker run -d -p 5000:5000 --name app myapp:1.0` |
| 8 | See logs | `docker logs -f app` |
| 9 | Shell inside a container | `docker exec -it app sh` |
| 10 | Stop / start | `docker stop app` / `docker start app` |
| 11 | Remove container | `docker rm -f app` |
| 12 | Remove image | `docker rmi myapp:1.0` |
| 13 | Compose up | `docker compose up -d --build` |
| 14 | Compose down | `docker compose down` |
| 15 | Full cleanup | `docker system prune -af` |

---

## 1. Install & Verify

```bash
# macOS
brew install --cask docker && open -a Docker

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Verify
docker --version
docker info
docker run hello-world

# Linux: avoid sudo
sudo usermod -aG docker $USER   # then re-login
```

---

## 2. Images

| Command | Purpose |
|---------|---------|
| `docker pull nginx:alpine` | download an image from a registry |
| `docker images` | list local images |
| `docker history img` | show the layers of an image |
| `docker image inspect img` | full JSON metadata |
| `docker image rm img` / `docker rmi img` | delete an image |
| `docker tag app jay/app:v1` | retag an image (for pushing) |
| `docker login` | authenticate to a registry |
| `docker push jay/app:v1` | upload image to registry |
| `docker pull jay/app:v1` | download image from registry |

**Image naming:** `namespace/repo:tag` → `jay/taskmanager-backend:v1.0.0` (no namespace = personal/Docker Hub).

---

## 3. The Dockerfile (blueprint)

```dockerfile
FROM node:20-alpine              # base image
WORKDIR /app                     # work dir
COPY package*.json ./            # copy files (order matters for caching)
RUN npm ci --omit=dev            # run command at BUILD time
ENV NODE_ENV=production          # environment variable
EXPOSE 5000                      # document the port (metadata only)
HEALTHCHECK --interval=30s CMD curl -f http://localhost:5000/api/health || exit 1
USER appuser                     # security: never root
CMD ["node", "server.js"]        # command at RUN time (startup)
```

| Instruction | Run-time? | Example |
|-------------|-----------|---------|
| `FROM` | build | `FROM node:20-alpine` |
| `COPY` / `ADD` | build | `COPY src ./src` |
| `RUN` | build (once) | `RUN npm ci` |
| `ENV` | both | `ENV PORT=5000` |
| `ARG` | build only | `ARG VITE_API_URL=/api` |
| `EXPOSE` | metadata | `EXPOSE 80` |
| `CMD` | start (overridable) | `CMD ["nginx","-g","daemon off;"]` |
| `ENTRYPOINT` | start (not overridable) | `ENTRYPOINT ["docker-entrypoint.sh"]` |

**Multi-stage build** = several `FROM` in one file; final stage copies only what it needs:

```dockerfile
FROM node:20-alpine AS build
RUN npm run build                    # compile React -> dist/

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. Build

```bash
docker build -t taskmanager-backend:latest ./backend
docker build --no-cache -t app:v1 .        # force full rebuild (skip cache)
docker build -f Dockerfile.dev .            # use a non-default Dockerfile
```

**Caching rule:** put things that change least often (package files) first — later steps are skipped when nothing changed (`CACHED`).

---

## 5. Run & Container Lifecycle

```bash
docker run    # create + start
docker start  # restart an existing (stopped) container
docker run -d -p 5000:5000 --name app -e PORT=5000 -v data:/app/data myapp:1.0
```

| Flag | Meaning |
|------|---------|
| `-d` | detached (background) |
| `-p 5000:5000` | map host:container port |
| `-P` | publish all EXPOSEd ports to random host ports |
| `--name` | friendly name |
| `-e KEY=value` | set an env var |
| `--env-file .env` | load env vars from file |
| `-v host:container` / `-v vol:/container` | mount volume |
| `--network tasknet` | join a network |
| `--restart unless-stopped` | auto-restart policy |
| `-it` | interactive + TTY (for exec/sh) |
| `--rm` | auto-delete container on exit |
| `--link` | (legacy) DO NOT use — use networks |

**Lifecycle commands:**

```bash
docker ps                # running
docker ps -a             # all
docker logs -f app       # live logs
docker exec -it app sh   # shell inside
docker inspect app       # JSON details
docker stats             # live resource usage
docker top app           # processes inside
docker cp app:/path/file ./    # copy file out
docker stop app          # SIGTERM -> graceful, then SIGKILL
docker start app
docker restart app
docker rm -f app         # force remove (kills running)
```

---

## 6. Volumes (persistence)

```bash
docker volume create mongo_data
docker run -v mongo_data:/data/db mongo:7.0     # named volume
docker run -v "$(pwd)":/app node:20-alpine       # bind mount (host folder)
docker run -v /app/data app                       # anonymous volume

docker volume ls
docker volume inspect mongo_data
docker volume prune        # remove unused
```

**Remember:** stripe a container and its data is gone unless it's in a volume. Compose-declared volumes survive `docker compose down` but die with `docker compose down -v`.

---

## 7. Networks

```bash
docker network ls
docker network create tasknet
docker network inspect tasknet
docker network rm tasknet
docker run --network tasknet --name backend -p 5000:5000 myapp:1.0
docker network connect tasknet frontend     # attach a running container
```

**Rule of thumb:** containers on the **same custom network** reach each other by **name**.
Bridge (default) works for host → container (via `-p`); own `--network` for container → container (via name).

---

## 8. Docker Compose

```yaml
services:
  web:
    build: ./frontend          # or image: nginx:alpine
    ports: ["80:80"]
    environment:
      KEY: ${SOME_VAR:-default}
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    networks: [tasknet]
  api:
    build: ./backend
    ports: ["5000:5000"]
    volumes: [mongo_data:/data/db]

volumes:
  mongo_data:
networks:
  tasknet:
    driver: bridge
```

| Command | Purpose |
|---------|---------|
| `docker compose up -d --build` | build + start stack |
| `docker compose ps` | status |
| `docker compose logs -f api` | logs for one service |
| `docker compose exec api sh` | shell into a service |
| `docker compose build` | build images only |
| `docker compose stop` / `start` | pause / resume stack |
| `docker compose restart` | restart services |
| `docker compose down` | stop + remove containers/network (volumes kept) |
| `docker compose down -v` | also delete volumes (DATA LOSS) |
| `docker compose up -d --scale web=3` | scale replicas |

**Compose essentials:** service name = DNS name; `depends_on` = start order; `condition: service_healthy` = only start when the dependency's healthcheck passes; `${VAR:-default}` = host env var with fallback (read from `.env`).

---

## 9. Debug & Troubleshooting

```bash
docker logs --tail 100 -f app        # last 100 lines, keep streaming
docker inspect -f '{{.State.Status}}' app
docker exec -it app sh               # poke around inside
docker stats                         # CPU / memory / network
docker system df                     # disk usage
```

**Stuck? Run the checklist:**
```
1. docker ps                → is it running?
2. docker logs <name>        → what did the app log?
3. docker network inspect    → is it on the right network?
4. docker exec <name> ping   → can it resolve the other service?
5. docker port <name>        → is -p actually working?
```

---

## 10. Cleanup

```bash
docker stop $(docker ps -q)          # stop everything
docker rm -f $(docker ps -aq)        # remove every container
docker image prune -f                # dangling images
docker volume prune -f               # unused volumes (DATA LOSS possible)
docker network prune -f              # unused networks
docker system prune -af              # nuclear option: everything
docker system prune -af --volumes    # nuclear + volumes
```

---

## 11. Port Mapping Cheat

| You want | You write | Meaning |
|----------|-----------|---------|
| host 5000 → container 5000 | `-p 5000:5000` | explicit map |
| any random host port → 8080 | `-p 8080` | `-p CONTAINER_PORT` only |
| auto for all EXPOSEd ports | `-P` | publish all |
| container port only (compose) | `"5000:5000"` | same syntax |

---

## 12. Common Gotchas

- **Containers are ephemeral** — data dies with the container unless on a volume.
- **Never `--link`** — use user-defined networks + service names.
- **Don't run as `root`** in production — add a `USER` in the Dockerfile.
- **Don't bake secrets into images** — use env vars / `.env` / secrets.
- **Order COPYs for cache** — package files before source code.
- **One process per container** — don't run Mongo + Node + Nginx in one container.
- **`apt-get install`** needs `apt-get update` first in the same `RUN` line.

---

## 13. Mini End-to-End Playbook (this project)

```bash
# Build both images from the Dockerfiles
docker build -t taskmanager-backend:latest  ./backend
docker build -t taskmanager-frontend:latest ./frontend

# OR just bring up the whole stack from docker-compose.yml
docker compose up -d --build
docker compose ps

# Verify APIs
curl http://localhost:5000/api/health
curl http://localhost/api/health

# Debug any service
docker logs -f taskmanager_backend
docker exec -it taskmanager_backend sh

# Ship
docker tag taskmanager-backend:latest jay/taskmanager-backend:v1.0.0
docker push jay/taskmanager-backend:v1.0.0

# Clean
docker compose down
docker system prune -af
```

> **Author:** Jay K. — Group 02 (Docker & Containerization)
> **Source files:** [`FullStackApp/docker-compose.yml`](../FullStackApp/docker-compose.yml), [`FullStackApp/backend/Dockerfile`](../FullStackApp/backend/Dockerfile), [`FullStackApp/frontend/Dockerfile`](../FullStackApp/frontend/Dockerfile)