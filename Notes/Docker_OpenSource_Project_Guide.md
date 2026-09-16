# Docker and Open Source Project Management

This guide explains how to use Docker while building, maintaining, and publishing
an open source project. It covers the complete path from a source repository to
a tested container image that other people can download and run.

## 1. The Big Picture

Docker packages an application and its runtime dependencies into an image.
An image is a versioned, read-only artifact.
A container is a running process created from an image.
A registry stores images so that people and automation can download them.
An open source repository stores the source code, documentation, and automation.

The usual workflow looks like this:

1. A contributor clones the source repository.
2. The contributor changes code on a separate branch.
3. Tests run locally and in continuous integration.
4. A Dockerfile describes how to build the application image.
5. The image is built and tested.
6. A maintainer tags the image with a meaningful version.
7. The image is pushed to a public or private registry.
8. Users pull the tag and run the application.

Keeping source code and images connected is important.
The source repository should explain which image tag contains which release.
The image should contain enough metadata to identify its source revision.

## 2. What Docker Solves

Software depends on operating system packages, language runtimes, libraries,
configuration files, and environment variables.
Two developers can use the same source code and still get different results.
Docker reduces this difference by describing the runtime as build instructions.

Containers are isolated processes, not lightweight virtual machines in every way.
They share the host kernel, so the host still matters for kernel-level behavior.
They are usually fast to start and easy to replace.
Their writable container layer is temporary unless data is stored elsewhere.

Docker is useful for development because a project can declare its services.
Docker Compose can start an application, database, and cache together.
Docker is useful in CI because a build can run in a clean environment.
Docker is useful in release workflows because an image is a portable artifact.

Docker does not automatically make an application secure.
It does not replace dependency updates, access control, or backups.
It does not make bad application architecture disappear.
It does make repeatable packaging easier when the inputs are controlled.

## 3. Core Objects

### 3.1 Dockerfile

A Dockerfile is a recipe for building an image.
Each instruction creates or reuses a layer.
The order of instructions affects both correctness and build speed.
The file should be short, explicit, and easy for a contributor to review.

### 3.2 Image

An image contains filesystem layers and configuration metadata.
Images are identified by a repository name and a tag or digest.
A tag such as `1.4.0` is convenient for people.
A digest such as `sha256:...` identifies exact content.
Tags can move, but digests are content-addressed and immutable.

### 3.3 Container

A container is a process started from an image configuration.
It has a name, environment, mounts, network settings, and an exit status.
Removing a container removes its writable layer.
Named volumes can preserve application data outside that layer.

### 3.4 Registry

A registry is an image distribution service.
Docker Hub, GitHub Container Registry, and cloud registries are common choices.
A registry repository can be public so anyone can pull the image.
Publishing source code and publishing an image are related but separate actions.

### 3.5 Tag

A tag is a human-readable pointer to an image manifest.
Use release tags for reproducible instructions.
Use a moving tag such as `latest` only when its meaning is documented.
Do not make users guess whether `latest` means stable, nightly, or development.

## 4. Installing and Verifying Docker

Install Docker using the official instructions for the operating system.
On Linux, Docker Engine and Docker Desktop are different distribution options.
After installation, verify that the client can reach the daemon.

```bash
docker version
docker info
docker run --rm hello-world
```

The `hello-world` command downloads a small image and runs it.
The `--rm` option removes the temporary container after it exits.
If the command fails, check whether the daemon is running.
On Linux, also check whether the current user has permission to use the socket.

```bash
systemctl status docker
docker context ls
docker ps
```

Do not expose the Docker daemon socket to the public internet.
Access to the daemon is effectively powerful access to the host.
Use a protected local socket, an authenticated remote endpoint, or a managed CI
runner with appropriate isolation.

## 5. Starting an Open Source Project

Before writing a Dockerfile, define the project purpose.
Write a short README that states who the project helps and how to try it.
Choose a clear license and include the license file in the repository.
Add a code of conduct and a contribution guide for community expectations.
Document how issues, pull requests, and releases are handled.

A useful initial repository layout is:

```text
project/
├── .github/
│   └── workflows/
├── docs/
├── src/
├── tests/
├── .dockerignore
├── .gitignore
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── Dockerfile
├── LICENSE
├── README.md
└── compose.yaml
```

Use a default branch that represents the current reviewed state.
Keep feature work in branches instead of committing directly to that branch.
Require review for changes that affect releases or deployment behavior.
Make automated checks required before merging when the hosting service supports it.

## 6. Source Control Habits

A small commit is easier to review than a mixed commit.
Use imperative commit subjects such as `Add image health check`.
Keep formatting-only changes separate from behavior changes.
Reference an issue when the project uses issue tracking.
Explain breaking changes in the commit body and release notes.

A contributor can start with:

```bash
git clone https://github.com/example/project.git
cd project
git switch --create feature/container-docs
git status
```

Before opening a pull request, the contributor should run the same checks used by
continuous integration whenever possible.

```bash
git diff --check
docker build --tag project:local .
docker run --rm project:local
```

Never commit passwords, registry tokens, private keys, or production config.
Use secret storage provided by the hosting platform or CI system.
Rotate a secret immediately if it is accidentally pushed.

## 7. Writing a Good README

The README is the first interface for a new user.
Put the shortest successful path near the top.
Show both source-based and container-based quick starts when both are supported.
State the supported platforms and required versions.
Explain which port the service listens on.
List environment variables and whether each is required.
Provide an example request and response for a service.
Link to detailed documentation instead of placing every detail in the README.

A container quick start should be concrete:

```bash
docker pull ghcr.io/example/project:1.0.0
docker run --name project --publish 8080:8080 \
  ghcr.io/example/project:1.0.0
```

Then show the local URL or command that confirms the service works.
Tell users how to stop and remove the example container.

```bash
docker stop project
docker rm project
```

## 8. Choosing a Base Image

Choose a base image that supports the application and has a maintenance policy.
Prefer official images or images maintained by a trusted organization.
Pin a major version at minimum, and consider pinning a digest for releases.
Smaller images reduce download time and the number of installed components.
Small does not automatically mean secure or easier to debug.

Common choices include Debian-based, Alpine-based, and distroless images.
Debian-based images often have broad compatibility and familiar tooling.
Alpine images are compact but can expose compatibility differences.
Distroless images reduce the runtime attack surface but contain few tools.
Use a builder image separately when compilation tools are not needed at runtime.

Avoid using `latest` as the only base image reference.
Record why a particular base image was selected.
Plan a regular update process for the base image and system packages.

## 9. Creating the Dockerfile

Start a Dockerfile with the smallest complete runtime description.
The `FROM` instruction selects the starting filesystem and runtime.
The `WORKDIR` instruction sets the default directory for later instructions.
The `COPY` instruction adds files from the build context to the image.
The `RUN` instruction executes a command during the build.
The `ENV` instruction defines a default environment value.
The `EXPOSE` instruction documents a listening port; it does not publish it.
The `USER` instruction selects the account used by the running process.
The `ENTRYPOINT` and `CMD` instructions define the default process.

Here is a simple Python service example:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 8000
USER 10001
CMD ["python", "-m", "src.server"]
```

Use JSON array syntax for executable commands when possible.
It avoids an extra shell process and handles signals more predictably.
The application should run in the foreground so Docker can track its process.
Do not start a background daemon and then exit the main process.

## 10. Build Context and `.dockerignore`

The final argument to `docker build` is the build context.
Docker sends files from that context to the builder.
An unnecessarily large context slows down builds and may leak private files.
Keep the context at the repository root only when the Dockerfile needs it.

Create a `.dockerignore` file next to the Dockerfile:

```text
.git
.github
.env
.env.*
node_modules
__pycache__
*.pyc
coverage
dist
build
.venv
*.log
```

Review ignore patterns before publishing a project.
Do not rely on `.gitignore` to control Docker build context.
The two files serve different tools and often need different entries.
Never copy cloud credentials or local SSH configuration into an image.

## 11. Layer Ordering and Build Cache

Docker can reuse a layer when its instruction and inputs have not changed.
Put stable dependency metadata before frequently changing source files.
For example, copy `package-lock.json` before copying application source.
This lets dependency installation remain cached during source-only changes.

An efficient Node.js layout might look like this:

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
USER node
EXPOSE 3000
CMD ["node", "server.js"]
```

Use lockfiles so dependency resolution is repeatable.
Use `npm ci`, `pip install` with a locked requirements file, or the equivalent
reproducible installer for the project language.
Avoid placing timestamps or random values in build instructions.
Those values make cache reuse unreliable.

Build with a clear tag:

```bash
docker build --tag project:local .
docker image inspect project:local
```

The tag `local` communicates that this image is for local verification.
Do not push a local experiment under a release tag.

## 12. Multi-Stage Builds

A multi-stage build separates compilation tools from the runtime image.
The first stage can contain compilers, package managers, and development headers.
The final stage copies only the artifacts required to run the application.

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/project ./cmd/project

FROM gcr.io/distroless/static-debian12
COPY --from=builder /out/project /project
USER 65532:65532
ENTRYPOINT ["/project"]
```

Multi-stage builds reduce runtime size and remove build-only tools.
They do not remove vulnerabilities in the application or copied libraries.
Check that the final stage contains certificates if HTTPS calls are required.
Check that the selected user can read files and bind to the chosen port.

## 13. Build Arguments and Environment Variables

Build arguments are available during image construction.
Runtime environment variables are supplied when a container starts.
Do not put secrets in either mechanism.
Build arguments can appear in build history and cached layers.

```dockerfile
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION
```

Pass a non-secret build value when needed:

```bash
docker build --build-arg APP_VERSION=1.0.0 \
  --tag project:1.0.0 .
```

Supply runtime configuration separately:

```bash
docker run --rm \
  --env APP_MODE=production \
  --env-file .env.example \
  project:local
```

Keep `.env.example` free of real credentials.
Document the meaning, format, and default for every supported variable.

## 14. Running Locally

Start a container with a stable name while testing interactively.

```bash
docker run --name project-local \
  --publish 8080:8000 \
  --env APP_MODE=development \
  project:local
```

The left side of `8080:8000` is the host port.
The right side is the port inside the container.
The application must listen on an address reachable from the container network.
For a web service, listening on `0.0.0.0` is commonly required.

Inspect logs from another terminal:

```bash
docker logs --follow project-local
docker inspect project-local
docker port project-local
```

Stop and remove the container after testing:

```bash
docker stop project-local
docker rm project-local
```

Use `docker exec` for short diagnostic commands inside a running container.
Do not treat manual changes made with `docker exec` as permanent configuration.
They disappear when the container is replaced.

## 15. Health Checks

A health check gives an orchestrator a simple signal about service readiness.
It should test a meaningful local endpoint or command.
It should be fast, deterministic, and safe to repeat.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8000/health \
  || exit 1
```

If the runtime image does not include `wget`, use the application’s own check.
Document what a healthy response means.
Do not use a health check that changes data.
Use separate readiness and liveness concepts when the deployment platform allows.