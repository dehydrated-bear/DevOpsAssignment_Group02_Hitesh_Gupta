# Docker Compose, Volumes & Networking — Deep Dive

> **Assignment Topic:** Docker & Containerization
> **Author:** Manish Kumar
> **Branch:** `manish-dpp`

A focused reference for the three most powerful Docker features: **multi-container orchestration with Compose**, **persistent storage with volumes**, and **container networking**.

---

## Part A — Docker Compose

### What is Compose?
A tool for defining and running **multi-container** applications with a single **`docker-compose.yml`** file. Instead of many `docker run` commands, you declare everything declaratively.

### Anatomy of `docker-compose.yml`

```yaml
version: "3.9"

services:                 # the containers you want
  web:
    build: .              # build from local Dockerfile
    image: myapp:latest   # OR use an existing image
    container_name: web-1
    ports:
      - "8000:8000"       # host:container
    expose:
      - "8000"            # internal only, not published to host
    environment:
      - APP_ENV=production
    env_file:
      - .env
    volumes:
      - ./src:/app        # bind mount
      - pgdata:/var/lib/postgresql/data   # named volume
    depends_on:
      - db                # start db before web
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:                  # declare named volumes
  pgdata:

networks:                 # custom networks (optional)
  default:
    driver: bridge
```

### Environment variable handling
```yaml
# 1. Inline environment
environment:
  - KEY=value

# 2. From a .env file (supports interpolation)
env_file:
  - .env

# 3. Interpolation from host/shell or .env
image: postgres:${POSTGRES_VERSION:-15}    # default 15 if not set
```

### Compose command reference
```bash
docker compose up -d                # start in background
docker compose up -d --build        # (re)build and start
docker compose up --scale web=3     # scale a service (dev)
docker compose ps                   # status
docker compose logs -f web          # follow logs of a service
docker compose exec web bash        # shell into a service container
docker compose stop                 # stop (keep containers)
docker compose start                # start stopped containers
docker compose restart              # restart all
docker compose down                 # stop + remove containers & network
docker compose down -v              # ALSO remove named volumes
docker compose down --rmi all       # ALSO remove images
docker compose config               # validate + print resolved config
docker compose config --services    # list service names
docker compose pull                 # pull images
docker compose build                # build images
docker compose top                  # running processes per service
docker compose run web pytest       # one-off command
docker compose pause / unpause       # freeze / resume
```

> **Legacy vs v2:** `docker-compose` (v1, hyphen) is deprecated. Use `docker compose` (v2, plugin). Functionally identical commands.

### Multi-file overrides (development vs production)
```bash
docker-compose.yml           # base
docker-compose.override.yml  # auto-loaded override for dev
docker-compose.prod.yml      # explicit prod override

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## Part B — Volumes & Data Persistence

### Why volumes?
Containers are **ephemeral**. Any data written to the container's writable layer is **lost** when the container is deleted. Volumes persist data outside the container lifecycle.

### The 3 mount types

| Type          | Used when                                                        | Example                          |
|---------------|------------------------------------------------------------------|----------------------------------|
| **Named volume** | Storing persistent app data (DBs, uploads) managed by Docker  | `-v pgdata:/var/lib/postgresql/data` |
| **Bind mount**  | Development (live code sync), config files, host access       | `-v $(pwd):/app`                 |
| **tmpfs**       | Sensitive data you don't want persisted (RAM only)            | `--tmpfs /tmp`                   |

### Command reference
```bash
# Volumes
docker volume create mydata
docker volume ls
docker volume inspect mydata        # mountpoint on host
docker volume rm mydata
docker volume prune                 # remove all unused

# Mount at run time
docker run -v mydata:/data myapp                # named volume
docker run -v /abs/host/path:/data myapp        # bind mount (absolute path)
docker run --mount type=bind,source=$(pwd),target=/app myapp   # new syntax

# Compose
volumes:
  - mydata:/data          # named
  - ./src:/app            # bind
```

> **`-v` vs `--mount`:** `--mount` is the newer, more explicit syntax, recommended for anything beyond the simplest cases (reads/writes, type, source, target, readonly).

### Common pitfalls
- **Bind mount path must be absolute** (or use `$(pwd)`), otherwise Docker treats it as a named volume.
- For the **default anonymous volume** (`-v /data` only) — creates an unnamed volume, deleted on `docker rm -v`.
- Databases (Postgres, MySQL, Mongo) **must** have a volume on their data dir or you lose all data on container recreation.

```bash
# persist postgres data (correct)
docker run -d --name pg -e POSTGRES_PASSWORD=pass -v pgdata:/var/lib/postgresql/data postgres:16
```

### Read-only filesystem for security
```bash
docker run --read-only -v mydata:/data myapp   # root fs read-only, volume writable
```

---

## Part C — Networking

### Network drivers

| Driver    | Scope     | Use case                                          |
|-----------|-----------|---------------------------------------------------|
| `bridge`  | single host | Default. Containers on isolated network, mapped ports |
| `host`    | single host | Share host network stack; no port mapping needed   |
| `none`    | single host | No networking (isolated loops only)                |
| `overlay` | multi-host | Connects containers across Swarm nodes             |

### Command reference
```bash
# List / create / remove
docker network ls
docker network create --driver bridge mynet
docker network rm mynet

# Attach at run time
docker run --network mynet --name web1 myapp

# Attach a running container
docker network connect mynet web1
docker network disconnect mynet web1

# Inspect
docker network inspect mynet                  # list attached containers + IPs
docker inspect -f '{{.NetworkSettings.Networks}}' web1

# Get a container's IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web1
```

### Container-to-container communication (the key idea)
On a **user-defined bridge network**, containers resolve each other by **name** (built-in DNS):
```bash
docker network create backend
docker run --network backend --name db --network-alias database mydb
docker run --network backend --name web myapp
# web can now connect to db via hostname "db" (or alias "database")
```
In **Compose**, every service auto-joins the project network and is reachable by its **service name**:
```yaml
services:
  web:
    environment:
      - DB_HOST=db     # "db" is the service name hostname
  db:
    image: postgres
```

### Exposing vs Publishing
- **`EXPOSE` (Dockerfile)** — documentation only; does NOT publish the port.
- **`-p` / `ports:`** — actually publishes to the host, making it reachable from outside.
- **`expose:` (Compose)** — makes a port available to linked services only, not the host.

### Host networking example
```bash
# Container shares the host's IP directly (e.g. for multicast/performance)
docker run --network host myapp
# No -p needed; the app binds directly to host ports.
```

### DNS & custom
```bash
# Custom DNS servers
docker run --dns 8.8.8.8 myapp
# Use a specific IP for the container
docker run --ip 172.18.0.50 myapp
```

---

## Cheat: The one diagram you need

```
                HOST
   ┌─────────────────────────────┐
   │  external clients           │
   │      │                      │
   │      ▼                      │
   │   port 8080 ──► bridge net  │
   │                │  web (172.18.0.2)  ┌─► db  (by name "db")
   │                └──► app (172.18.0.3)─┘
   │                     │
   │                named volume: data persists
   └─────────────────────────────┘
```

---

*Happy containerizing ! — Manish Kumar (manish-dpp)*
