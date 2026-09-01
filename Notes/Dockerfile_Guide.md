# How to Create a Dockerfile for a Codebase

A Dockerfile is a text file that contains all the commands and instructions needed to
build a Docker image. Docker reads the Dockerfile and builds a **Docker image** that can
be run as a **container**. The Dockerfile is the heart of containerising any application.

This guide walks through everything you need to write a proper Dockerfile for a codebase,
using several real-world examples so you can adapt it to your own project.

---

## Table of Contents

1.  What is a Dockerfile?
2.  Dockerfile vs. Docker Image vs. Container
3.  The Important Dockerfile Instructions
4.  Anatomy of a Basic Dockerfile
5.  Example 1: A Simple Node.js Application
6.  Example 2: A Python / Flask Application
7.  Example 3: A Java / Spring Boot Application
8.  Example 4: A React (frontend) Application
9.  Multi-Stage Builds (Production Best Practice)
10. Best Practices and Tips
11. Common Mistakes to Avoid
12. Useful Docker Commands
13. Summary / Checklist

---

## 1. What is a Dockerfile?

A **Dockerfile** is a plain-text script containing a series of instructions. Each
instruction creates a layer in the image. When you run `docker build`, Docker executes
these instructions one by one, and the final result is a Docker image.

```dockerfile
# This is a comment in a Dockerfile
FROM node:18
WORKDIR /app
COPY . .
CMD ["node", "index.js"]
```

### Why do we need a Dockerfile?
- It makes your application **portable** (runs anywhere Docker runs).
- It makes builds **reproducible** (same result every time).
- It allows **fast deployment** and easy **scaling**.
- It packages the app together with all its dependencies and environment.

---

## 2. Dockerfile vs. Docker Image vs. Container

It is very common to confuse these three terms. Let's clarify.

| Term          | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| **Dockerfile**| The text instructions that describe how to build an image.                   |
| **Image**     | The compiled, immutable blueprint created from a Dockerfile.                 |
| **Container** | A running instance of an image. You can run many containers from one image.  |

Think of it like a recipe (Dockerfile), the baked cake (image), and a slice being eaten
(container).

---

## 3. The Important Dockerfile Instructions

These are the instructions you will use most often.

### `FROM`
Every Dockerfile must start with `FROM`. It defines the **base image** your app will be
built on top of.

```dockerfile
FROM node:18-alpine
```

### `WORKDIR`
Sets the **working directory** inside the container. All subsequent commands run here.

```dockerfile
WORKDIR /app
```

### `COPY`
Copies files or directories **from your local machine** into the container.

```dockerfile
COPY package.json .
COPY . .
```

### `ADD`
Similar to `COPY` but can also copy from a URL or extract a tar file. Prefer `COPY`
unless you need the extra features.

```dockerfile
ADD https://example.com/file.tar.gz /tmp/
```

### `RUN`
Executes a **command while building the image**. Used for installing dependencies,
creating directories, etc. Each `RUN` creates a new layer.

```dockerfile
RUN npm install
```

### `ENV`
Sets an **environment variable** inside the container.

```dockerfile
ENV PORT=3000
ENV NODE_ENV=production
```

### `EXPOSE`
Documents which **port** the container will listen on. This is informational only; it
does not actually publish the port.

```dockerfile
EXPOSE 3000
```

### `CMD`
Defines the **command to run** when the container starts. There can only be **one** `CMD`
instruction (the last one wins). `CMD` can be overridden.

```dockerfile
CMD ["node", "index.js"]
```

### `ENTRYPOINT`
Defines the command that is **always** executed when the container starts. Unlike `CMD`,
arguments passed at runtime are appended to it, not used to replace it.

```dockerfile
ENTRYPOINT ["python", "app.py"]
```

> **Difference:** `CMD` is the default command that can be overridden; `ENTRYPOINT` is the
> mandatory command. You often use both together.

### `ARG`
Defines a **build-time variable**. It is only available during the build, not at runtime.

```dockerfile
ARG APP_VERSION=1.0.0
ENV APP_VERSION=$APP_VERSION
```

### `VOLUME`
Creates a mount point to persist data.

```dockerfile
VOLUME /data
```

### `USER`
Changes the user the container runs as. Good for security.

```dockerfile
USER node
```

### `HEALTHCHECK`
Tells Docker how to test if the container is still healthy.

```dockerfile
HEALTHCHECK CMD curl --fail http://localhost:3000 || exit 1
```

### `LABEL`
Adds metadata like the maintainer or version.

```dockerfile
LABEL maintainer="team@example.com"
```

---

## 4. Anatomy of a Basic Dockerfile

Let's bring the common instructions together to see the overall structure.

```dockerfile
FROM node:18-alpine

# set the working directory
WORKDIR /app

# copy dependency manifest first (better caching)
COPY package*.json ./

# install dependencies
RUN npm install

# copy the rest of the source code
COPY . .

# set environment variables
ENV NODE_ENV=production

# document the exposed port
EXPOSE 3000

# default command
CMD ["node", "index.js"]
```

Notice the order:
1.  Base image (`FROM`)
2.  Working directory (`WORKDIR`)
3.  Package manifest (`COPY package*.json`)
4.  Install dependencies (`RUN npm install`)
5.  Copy source (`COPY . .`)
6.  Environment and metadata
7.  Start command (`CMD`)

Why copy `package.json` **before** the rest of the code? Because Docker caches layers.
If only your source code changes, Docker can reuse the cached `npm install` layer, which
makes rebuilds much faster.

---

## 5. Example 1: A Simple Node.js Application

Project structure:

```
my-app/
├── Dockerfile
├── package.json
└── index.js
```

`Dockerfile`:

```dockerfile
# 1. Use an official Node.js runtime as the base image
FROM node:18-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package.json and package-lock.json
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the application code
COPY . .

# 6. Expose port 3000
EXPOSE 3000

# 7. Run the application
CMD ["node", "index.js"]
```

To build and run:

```bash
docker build -t my-node-app .
docker run -p 3000:3000 my-node-app
```

---

## 6. Example 2: A Python / Flask Application

Project structure:

```
flask-app/
├── Dockerfile
├── requirements.txt
└── app.py
```

`Dockerfile`:

```dockerfile
# Use a slim Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install Python dependencies (copy requirements first for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the Flask default port
EXPOSE 5000

# Run Flask app
CMD ["python", "app.py"]
```

A more production-safe variant using `python:3.11-alpine` and an unprivileged user:

```dockerfile
FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_APP=app.py
ENV FLASK_ENV=production

EXPOSE 5000

# Create and use a non-root user
RUN adduser -D myuser
USER myuser

CMD ["python", "app.py"]
```

Build and run:

```bash
docker build -t flask-app .
docker run -p 5000:5000 flask-app
```

---

## 7. Example 3: A Java / Spring Boot Application

Project structure:

```
spring-app/
├── Dockerfile
├── mvnw
└── src/
```

`Dockerfile`:

```dockerfile
# Build stage - uses Maven to create a jar
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy the pom file
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source and build the jar
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage - runs the built jar
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the jar from the build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
```

Build and run:

```bash
docker build -t spring-app .
docker run -p 8080:8080 spring-app
```

---

## 8. Example 4: A React (frontend) Application

Project structure:

```
react-app/
├── Dockerfile
├── package.json
└── src/
```

`Dockerfile` (with a simple Node server):

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the production bundle
RUN npm run build

# Serve the app
CMD ["npm", "start"]
```

> Note: For React apps, it is common to use a **multi-stage build** (below) where the
> built static files are served by a lightweight web server like **nginx**.

---

## 9. Multi-Stage Builds (Production Best Practice)

Multi-stage builds let you use multiple `FROM` statements. This keeps the final image
small by discarding build tools and only keeping what is needed to **run** the app.

### Why use multi-stage builds?
- Smaller images (faster to push and pull).
- No build tools or source code in the final image.
- Better security (less attack surface).
- Better caching.

### Example: React app served by nginx

```dockerfile
# Stage 1: Build the application
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy the built files (only the build output!)
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Example: Python app with a builder stage

```dockerfile
# Stage 1: installer - collect only runtime wheels
FROM python:3.11-slim AS installer

WORKDIR /root/.cache
RUN pip install --user pipenv

# Stage 2: runtime
FROM python:3.11-slim AS runtime

ENV PATH="/root/.local/bin:${PATH}"

COPY --from=installer /root/.local /root/.local
COPY --from=installer /root/.cache /root/.cache

COPY requirements.txt .
RUN pip install --user -r requirements.txt

COPY . .

CMD ["python", "app.py"]
```

The key instruction here is `COPY --from=<stage-name>`, which copies files from one stage
to another.

---

## 10. Best Practices and Tips

- **Use a `.dockerignore` file** to prevent copying `node_modules`, build artifacts,
  secrets, and git folders into the image.
- **Use specific image tags** (e.g. `node:18-alpine`) instead of `latest` for
  reproducibility.
- **Use small base images** like `-alpine` variations to reduce size.
- **Copy dependency manifests before source code** to leverage Docker layer caching.
- **Combine `RUN` commands** with `&&` to reduce the number of layers.
- **Run as a non-root user** for security.
- **Use multi-stage builds** for production images.
- **Explicitly use `EXPOSE`** to document ports even though it does not publish them.
- **Install only production dependencies** (e.g. `npm ci --only=production`).
- **Remove package caches** inside the image (e.g. `apt-get clean`, `--no-cache-dir`).
- **Put `CMD` (and `ENTRYPOINT`) at the end** of the Dockerfile.

Example `.dockerignore`:

```text
node_modules
npm-debug.log
.git
.gitignore
.env
Dockerfile
*.log
```

---

## 11. Common Mistakes to Avoid

- **Copying `node_modules` into the container** and then running `npm install` again.
- **Not using a `.dockerignore`**, which bloats the image.
- **Using `latest` tags**, making builds unreproducible.
- **Forgetting `EXPOSE`** or the correct port mapping.
- **Using `RUN npm install` then `COPY . .`**, which breaks layer caching.
- **Running as root** inside the container.
- **Hard-coding paths** instead of using `WORKDIR`.
- **Having multiple `CMD` instructions** (only the last one is used).
- **Not testing the image locally** before pushing it to a registry.

---

## 12. Useful Docker Commands

```bash
# Build an image from a Dockerfile
docker build -t my-app .

# Build with a specific tag/version
docker build -t my-app:v1.0.0 .

# Run a container and map ports (host:container)
docker run -p 3000:3000 my-app

# Run in detached (background) mode
docker run -d -p 3000:3000 my-app

# List all images
docker images

# List all running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a running container
docker stop <container-id>

# Remove a container
docker rm <container-id>

# Remove an image
docker rmi my-app

# View logs of a container
docker logs <container-id>

# Run an interactive shell in a container
docker exec -it <container-id> /bin/sh

# Inspect a Dockerfile for syntax issues (dry run build)
docker build -t my-app --no-cache .
```

---

## 13. Summary / Checklist

Before you consider your Dockerfile complete, go through this checklist:

- [ ] Starts with a valid `FROM` base image.
- [ ] Uses `WORKDIR` to set a working directory.
- [ ] Copies dependency manifests first for cache efficiency.
- [ ] Installs dependencies with `RUN`.
- [ ] Copies the rest of the source code with `COPY`.
- [ ] Sets the required environment variables with `ENV`.
- [ ] Documents the port with `EXPOSE`.
- [ ] Defines the startup command with `CMD` and/or `ENTRYPOINT`.
- [ ] Uses a `.dockerignore` to keep the image small.
- [ ] Runs as a non-root user where possible.
- [ ] Uses multi-stage builds for production.
- [ ] Builds and runs successfully locally before shipping.

### The core workflow in four commands

```bash
# 1. Create a Dockerfile in your project root

# 2. Build the image
docker build -t my-app .

# 3. Run the container
docker run -p 3000:3000 my-app

# 4. (Optional) Push to a registry
docker tag my-app myusername/my-app:latest
docker push myusername/my-app:latest
```

---

That's it! You now know how to write a Dockerfile for just about any codebase, from a
Node.js API to a Spring Boot backend to a React frontend. Start small, use the examples,
and always remember the golden rule: **small images, correct caching, reproducible builds.**
