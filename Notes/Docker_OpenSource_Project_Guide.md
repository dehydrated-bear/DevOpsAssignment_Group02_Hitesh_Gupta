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