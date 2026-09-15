# Docker Study Notes

This directory contains comprehensive study notes and reference material for learning Docker. It is organised into logical sections so that a complete beginner can progress from understanding *why* containers exist, all the way to running and managing them in day-to-day work.

## Table of Contents

- [Docker Study Notes](#docker-study-notes)
  - [Table of Contents](#table-of-contents)
  - [What is in this folder](#what-is-in-this-folder)
  - [Prerequisites](#prerequisites)
- [Why Docker Is Required](#why-docker-is-required)
  - [The Problem Before Containers](#the-problem-before-containers)
  - [How Docker Solves These Problems](#how-docker-solves-these-problems)
  - [Docker vs Traditional Virtual Machines](#docker-vs-traditional-virtual-machines)
  - [When You Should (and Should Not) Use Docker](#when-you-should-and-should-not-use-docker)
- [Docker Setup and Installation](#docker-setup-and-installation)
  - [System Requirements](#system-requirements)
  - [Installing Docker on Linux](#installing-docker-on-linux)
  - [Installing Docker on macOS](#installing-docker-on-macos)
  - [Installing Docker on Windows](#installing-docker-on-windows)
  - [Verifying Your Installation](#verifying-your-installation)
  - [Troubleshooting Common Setup Issues](#troubleshooting-common-setup-issues)
- [Core Concepts](#core-concepts)
- [Recommended Learning Path](#recommended-learning-path)
- [Additional Resources](#additional-resources)

---

## What is in this folder

| File | Purpose |
|------|---------|
| `README.md` | This file — the main study guide covering **why Docker is required** and **how to set it up** |
| `Docker_Basics.md` | The foundational concepts: images, containers, Dockerfiles, volumes, and networks |
| `Running_Docker.md` | Hands-on commands for building, running, and managing containers in practice |

---

## Prerequisites

Before you start, make sure you are comfortable with the following basics. You do not need to be an expert, but a passing familiarity helps a great deal:

- Command-line / terminal basics (`cd`, `ls`, `mkdir`)
- Basic knowledge of what an operating system is
- An understanding of what runs your applications (runtime, dependencies, config)
- A working text editor
- Admin rights on your machine to install software

If you are entirely new to Docker, start with the **Installation** section first, then move on to `Docker_Basics.md`.

---

# Why Docker Is Required

## The Problem Before Containers

Every software application depends on a runtime and a set of libraries, packages, and configuration files. Before containers became mainstream, developers faced a constant set of painful and expensive problems.

### 1. The "It Works on My Machine" Problem
Code that ran perfectly on a developer's laptop would fail on a teammate's machine, on staging, or in production. The cause was almost always a mismatch in the environment: a different version of a runtime, a missing library, or a slightly different operating system setting. Hours — often days — were wasted debugging these environment differences.

### 2. Manual and Error-Prone Deployment
Deploying software meant manually installing runtimes, copying files, setting environment variables, and starting services in the right order. Every step was an opportunity for human error, and the process varied from machine to machine. There was no single, trusted recipe.

### 3. Conflicts Between Applications
Two applications running on the same server often required conflicting versions of the same library or runtime. Upgrading one application would silently break the other. System administrators had to carefully manage shared dependencies to avoid "dependency hell."

### 4. Heavy and Slow Virtual Machines
Virtual machines solved isolation, but they were resource-hungry. Each VM carried an entire guest operating system, consuming gigabytes of disk and significant CPU and memory. Booting a VM could take minutes, and running many VMs on one host quickly exhausted resources.

### 5. Wasted Environment Setup Time
Every new developer joining a team had to spend hours setting up their local environment so that it matched everyone else's. Onboarding was slow, and small differences in setup led to subtle bugs.

## How Docker Solves These Problems

Docker addresses all of these issues by packaging an application **together with everything it needs** into a standardised unit called a *container*.

### 1. Containerised Environment
A Docker container bundles your code, its runtime, system tools, libraries, and settings into one isolated environment. Because all of the environment is packed inside the container, differences in the host operating system no longer matter.

### 2. Reproducible Builds
By defining the environment in code (a `Dockerfile`), Docker makes the build deterministic. Anyone who builds the image from the same source gets the same result. This eliminates the "it works on my machine" problem — if it runs in the container, it runs everywhere.

### 3. Lightweight Isolation
Containers share the host operating system's kernel instead of bundling a full guest OS. This makes them far smaller and faster than virtual machines while still providing strong process-level isolation.

### 4. Fast Startup and Low Overhead
Containers start in seconds, not minutes, and use a fraction of the memory and disk of a virtual machine. This makes them ideal for scaling, rapid iteration, and running many workloads on a single host.

### 5. Portability Across Environments
A container built once will run identically on a developer's laptop, a colleague's machine, a CI/CD pipeline, a staging server, or a cloud VM. This portability is the backbone of modern DevOps workflows.

### 6. Consistent Development and Production
The same image that runs in development can be promoted to production without rebuilding. This dramatically reduces the chance of environment-related failures in production.

### 7. Simplified DevOps and CI/CD
Because environments are defined in code, Docker integrates naturally with pipelines. Build once, test the artifact, and deploy the identical artifact — no environment drift.

### 8. Easier Scaling
Containers are designed to be replicated. With orchestration tools like Kubernetes or Docker Swarm, you can spin up many instances of a service to handle load, and tear them down when demand drops.

## Docker vs Traditional Virtual Machines

| Feature | Docker Containers | Virtual Machines |
|---------|-------------------|------------------|
| **Architecture** | Share host OS kernel | Each runs a full guest OS |
| **Boot time** | Seconds | Minutes |
| **Size** | Megabytes | Gigabytes |
| **Memory usage** | Very low | High |
| **Performance** | Near-native | Noticeable overhead |
| **Isolation** | Process-level | Hardware-level |
| **Portability** | Excellent | Moderate |
| **Resource density** | Many per host | Few per host |

The key takeaway is that both approaches isolate workloads, but containers do so with a fraction of the overhead, which is why they have become the default for modern cloud-native development.

## When You Should (and Should Not) Use Docker

### Good Use Cases
- Microservices-based applications
- CI/CD pipelines and automated testing
- Local development environments that mirror production
- Running multiple isolated services on one host
- Applications that need to be portable across providers
- Reproducible data-processing or batch jobs

### Cases Where Docker May Not Be Ideal
- Applications with a strict desktop GUI that need direct hardware access
- Very small, simple one-off scripts where the overhead is not justified
- Workloads requiring very low-level hardware or driver access
- Cases where isolation needs to be extremely strict (often better served by VMs)

---

# Docker Setup and Installation

This section walks through installing Docker on the three major operating systems, then verifying that everything works.

## System Requirements

Before installing, confirm you meet the baseline requirements:

- **macOS:**
  - macOS 11 or newer is recommended
  - An Intel or Apple Silicon (M1/M2) chip
  - At least 4 GB of RAM (8 GB recommended)

- **Windows:**
  - Windows 10 64-bit (Home/Pro/Enterprise) or newer
  - WSL 2 (Windows Subsystem for Linux) enabled
  - Hardware virtualization enabled in BIOS

- **Linux:**
  - A 64-bit distribution with a reasonably recent kernel
  - `sudo` access to install packages
  - At least 2 GB of RAM

## Installing Docker on Linux

Docker on Linux runs natively because the engine talks directly to the Linux kernel. The steps below are typical for Debian/Ubuntu-based systems.

### Step 1: Update Package Lists
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Prerequisite Packages
```bash
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
```

### Step 3: Add Docker's Official GPG Key
```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

### Step 4: Add the Docker Repository
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Step 5: Install Docker Engine
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Step 6: Start and Enable the Docker Service
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 7: Add Your User to the Docker Group
This lets you run `docker` commands without `sudo`:
```bash
sudo usermod -aG docker $USER
```
Log out and back in (or restart) for the change to take effect.

## Installing Docker on macOS

The recommended approach on macOS is Docker Desktop, which provides a simple GUI and includes the Docker Engine, CLI, and Compose.

### Step 1: Download Docker Desktop
Go to the official Docker website and download the Docker Desktop installer for macOS (choose the Apple Silicon build if you have an M1/M2 Mac).

### Step 2: Install the Application
Open the downloaded `.dmg` file, drag the Docker icon into the `Applications` folder, and launch Docker Desktop from Launchpad.

### Step 3: Accept the Terms and Complete Setup
On first launch you will be asked to accept the service agreement by entering your password. Docker Desktop will then start the Docker Engine automatically.

### Step 4: Verify with Terminal
Open a terminal and run:
```bash
docker --version
```
You should see output like `Docker version 27.x.x`.

### Optional: Alternative Installation with Homebrew
If you use Homebrew, you can install Docker CLI tools without the Desktop GUI:
```bash
brew install --cask docker
```
Or install only the command-line tools:
```bash
brew install docker docker-compose
```
Note that the CLI alone does not start a daemon on macOS — you still need the engine, which Docker Desktop provides.

## Installing Docker on Windows

Docker Desktop is also the standard choice on Windows.

### Step 1: Enable WSL 2
Open PowerShell as Administrator and run:
```powershell
wsl --install
```
Restart your machine when prompted. WSL 2 provides the Linux kernel that Docker Desktop needs.

### Step 2: Download Docker Desktop
Download the Docker Desktop Installer for Windows from the official site.

### Step 3: Run the Installer
Double-click the installer, leave the defaults in place, and click **Install**. You may be asked to log out and back in.

### Step 4: Launch and Verify
Open Docker Desktop, accept the terms, and confirm the setup completes. Then in PowerShell or WSL run:
```bash
docker --version
```

## Verifying Your Installation

Regardless of platform, run these checks to confirm Docker is working correctly.

### Check the CLI
```bash
docker --version
```

### Check the Daemon Is Running
```bash
docker info
```
If `docker info` returns server information, the engine is up. If it fails, the daemon may need to be started.

### Run the Hello World Container
```bash
docker run hello-world
```
This downloads a tiny test image, runs it, and prints a confirmation message. If you see the message, your Docker installation is fully functional.

### Check Compose (Optional but Useful)
```bash
docker compose version
```

## Troubleshooting Common Setup Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `Cannot connect to the Docker daemon` | Daemon not running | Start Docker Desktop / the Docker service |
| `permission denied` on Docker commands | User not in `docker` group | Run `sudo usermod -aG docker $USER` and re-login |
| WSL errors on Windows | WSL 2 not configured | Run `wsl --install` and restart |
| Slow pull / timeout | Network or registry access | Check firewall / proxy settings |
| Port already in use | Another service on the port | Use a different `-p` mapping |
| Docker engine not starting on Mac | Resource limits / old version | Ensure enough RAM, update Docker |

---

# Core Concepts

Before moving on, make sure you are familiar with these core ideas, all of which are covered in more depth in `Docker_Basics.md`:

1. **Images** — immutable, read-only templates used to create containers
2. **Containers** — running instances of images, isolated from the host
3. **Dockerfile** — the recipe that defines how an image is built
4. **Volumes** — persistent storage that survives container restarts
5. **Networks** — the connected environment that lets containers talk to each other
6. **Registries** — repositories (like Docker Hub) where images are stored and shared
7. **Compose** — a tool for defining and running multi-container applications

---

# Recommended Learning Path

Follow this order for the smoothest learning experience:

1. **Read the "Why Docker Is Required" section** of this file to build motivation and context.
2. **Install Docker** using the setup instructions above, then run `docker run hello-world` to confirm it works.
3. **Read `Docker_Basics.md`** to understand images, containers, volumes, and networks.
4. **Read `Running_Docker.md`** and try the hands-on commands in a sandbox.
5. **Experiment** by building a small image from your own `Dockerfile`.
6. **Explore** Compose and orchestration once you are comfortable with single containers.

---

# Additional Resources

- **Docker's Official Documentation:** the definitive source for every command and concept
- **Docker Hub:** the public registry for sharing and discovering images
- **Dockerfile Reference:** the complete guide to writing Dockerfiles
- The `ReferenceVideos` folder in this repository for visual learners

---

*Happy containerising! Practice small, iterate often, and always read the official docs when in doubt.*
