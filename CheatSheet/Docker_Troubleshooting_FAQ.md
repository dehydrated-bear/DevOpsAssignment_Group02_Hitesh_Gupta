# Docker Troubleshooting & FAQ

> **Assignment Topic:** Docker & Containerization
> **Author:** Manish Kumar
> **Branch:** `manish-dpp`

A practical guide to the most common Docker problems, their causes, and fixes. Save this for interview prep and day-to-day debugging.

---

## 1. Common Errors & Fixes

### "Cannot connect to the Docker daemon"
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock.
Is the docker daemon running?
```
**Cause:** Docker engine not started, or current user lacks permission.
**Fix:**
```bash
sudo systemctl start docker          # Linux (systemd)
sudo systemctl enable docker         # start on boot
# macOS / Windows: start Docker Desktop app

# Permission denied (Linux) — add your user to docker group
sudo usermod -aG docker $USER
# then log out/in (or run: newgrp docker)
```

### "Bind for 0.0.0.0:8080 failed: port is already allocated"
**Cause:** Port already in use by another container or process.
**Fix:**
```bash
docker ps -a                                  # find the container using the port
docker stop <container>                       # stop it
# OR change the host port
docker run -p 8081:80 myapp
# Find which host process owns the port (Linux):
sudo lsof -i :8080
```

### "No space left on device" / "can't upload layer"
**Cause:** Docker has accumulated too many images, containers, volumes, and build cache. Solution was:
```bash
docker system prune -a --volumes
docker volume prune
docker image prune -f
# Check what's consuming space:
docker system df
```

### "exec: 'bash': executable file not found in $PATH"
**Cause:** The image is minimal (e.g. Alpine) and has no `bash`.
**Fix:** Use `sh` instead:
```bash
docker exec -it myapp /bin/sh    # works on Alpine
# or install bash in the image (add to Dockerfile)
RUN apk add --no-cache bash
```

### "GetScanError" / "manifest unknown" / "pull access denied"
**Cause:** Image tag doesn't exist, or it's private and you're not logged in.
**Fix:**
```bash
docker login                        # authenticate
docker pull user/repo:specific-tag  # use exact, existing tag
docker search centos                # verify image exists
```

### "standard_init_linux.go: exec user process caused: exec format error"
**Cause:** Image architecture doesn't match your host (e.g. arm64 image on amd64, or a cross-compiled binary).
**Fix:** Build for the right platform, or pull the correct arch:
```bash
docker pull --platform linux/amd64 nginx
# Or during build
docker build --platform linux/amd64 -t myapp .
# Check image platform
docker inspect myapp --format '{{.Os}}/{{.Architecture}}'
```

### "You have reached your pull rate limit"
**Cause:** Docker Hub limits anonymous pulls.
**Fix:** `docker login` (authenticated pulls get higher limits), or pull less often / use a mirror.

### "Container exits immediately (code 0 or 1)"
**Cause:** No long-running foreground process (common for web apps started in `CMD` that exit), or the app crashed.
**Fix:**
```bash
docker logs myapp                 # read the actual error
# Run interactively to see output
docker run -it myapp
# Ensure your CMD keeps a foreground process running
```

---

## 2. Debugging a container step by step

```bash
docker ps -a                                    # 1. Is it running? Get the ID
docker logs -f <container>                      # 2. Read the logs
docker inspect <container>                      # 3. Full config & exit details
docker inspect -f '{{.State.ExitCode}}' <id>    # 4. Exit code
docker exec -it <container> /bin/sh             # 5. Shell inside (if running)
docker stats                                    # 6. Resource usage
docker top <container>                          # 7. Processes inside
docker diff <container>                         # 8. Files changed vs image
```

### Key inspect fields
```bash
docker inspect -f '{{.State.Status}}' myapp                          # running / exited
docker inspect -f '{{.NetworkSettings.IPAddress}}' myapp             # container IP
docker inspect -f '{{json .Mounts}}' myapp                           # volumes (JSON)
docker inspect -f '{{.Config.Image}}' myapp                          # base image
docker inspect -f '{{.State.StartedAt}}' myapp                       # start time
docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' myapp         # restart policy
```

---

## 3. FAQ (Interview-Focused)

### Q: Difference between an image and a container?
An **image** is an immutable, read-only template (a stack of layers) used to create containers. A **container** is a runnable instance of an image with a thin read/write layer on top.

### Q: Difference between Docker and a VM?
Containers virtualize the **OS** (share the host kernel) at the process level and are lightweight (MB, seconds to boot). VMs virtualize the **hardware** with a full guest OS (GB, minutes to boot) and provide stronger isolation.

### Q: What is the difference between CMD and ENTRYPOINT?
- **ENTRYPOINT** defines the command that always runs; it's hard to override.
- **CMD** provides default arguments/commands that can be overridden at `docker run`.
- Common pattern: `ENTRYPOINT` = executable, `CMD` = default args.

### Q: What is a multi-stage build and why use it?
Multiple `FROM` statements in one Dockerfile — each stage can reuse base images, and you only copy what you need into the final stage. Result: **dramatically smaller** production images (no build tools/compilers).

### Q: How is data persisted in Docker?
Through **volumes** (named volumes or bind mounts) which live outside the container lifecycle, so data survives container removal. Without them, data is lost when the container is deleted.

### Q: What are the Docker networking modes?
- `bridge` (default) — containers on an isolated network, port-mapped to host.
- `host` — shares the host's network directly (no NAT).
- `none` — no networking.
- `overlay` — multi-host networking (used by Docker Swarm).

### Q: How do containers communicate with each other?
On a **user-defined bridge network**, containers resolve each other by **service/container name** via Docker's built-in DNS. In Compose, services use the service name as the hostname.

### Q: What is Docker Compose used for?
Coding multi-container applications in a single YAML file — defining services, networks, volumes, and dependencies with one command to start/stop the whole stack.

### Q: What restart policies are available?
- `no` (default), `on-failure[:max-retries]`, `always`, `unless-stopped`.

### Q: How do you pass secrets without baking them into the image?
Use `--secret` at build time, environment variables at runtime, Docker secrets (Swarm), or mount a secrets file via a volume. Never hardcode secrets in the Dockerfile or `COPY` them into the image.

### Q: What is layer caching and how can you optimize it?
Each Dockerfile instruction creates a cacheable layer. Order matters: put **slow-changing** instructions (base image, dependency install) first and **fast-changing** code (`COPY . .`) last so Docker reuses cached layers on rebuilds — much faster builds.

---

## 4. Dockerfile `.dockerignore` example

```dockerignore
node_modules
.git
.gitignore
*.md
Dockerfile*
docker-compose*.yml
.env
dist
tmp
.vscode
```

Excluding build-unrelated files keeps the build context small and avoids copying secrets/artifacts into the image.

---

## 5. Container lifecycle quick map

```
docker pull image ──► docker build ──► docker run ──► running container
                                    │                    │
                                    │              docker exec (shell in)
                                    │                    │
                                    └── docker stop/start/restart
                                              │
                                          (ephemeral)
                                              │
                                        docker rm (permanent)
```

---

*Happy debugging ! — Manish Kumar (manish-dpp)*
