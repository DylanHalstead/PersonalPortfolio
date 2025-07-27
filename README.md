# Personal Portfolio

My personal website used to be a portfolio showcase; used to show previous work
and blog content.

## ✨ Features

- 🌊 **Interactive, fluid animations** with GSAP, Tailwind, and Svelte
  interactivity
- 📦 **Static site generation** powered by Astro's island architecture creating
  a fast, performant experience for users
- 🐳 **Self-hosted site hosting** utilizing containerization w/Docker,
  self-hosted GA runners, cloudflare tunnels, and NGINX
- 🔍 **SEO-optimized** with proper metadata, canonical URLs, and social media
  tags
- 📝 **Blog content** with Astro's content collections

## 🏗️ Project Structure

This project is following the
[Astro project structure](https://docs.astro.build/en/basics/project-structure/):

```
│
├── src/
│   ├── assets/                 # Build-time assets
│   ├── components/             # Component library
│   │   ├── astro/
│   │   └── svelte/
│   ├── content/                # Content collections
│   │   ├── config.ts           # Content collections configuration
│   │   ├── data/
│   │   │   ├── blog/           # Blog articles (Markdown)
│   │   │   ├── projects.json   # Previous work and projects
│   │   │   └── tags.json       # Tags used to categorize projects
│   ├── layouts/                # Reusable page layouts
│   ├── pages/                  # Astro pages/routes
│   ├── styles/                 # Global styles/Tailwind configuration
├── public/                     # Static, client-side assets
├── dist/                       # Build output
└── .github/workflows/          # CI/CD pipelines
```

## 🧑‍💻 Local Development

### 📦 Dependencies

- [Node.js >= 22](https://nodejs.org/en/download)
- [PNPM >= 10](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/engine/install/)
  - Optional, but recommended for containerized development

### 🐣 Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```
   The site will be available at `http://localhost:4321`

### 🐳 Docker

For containerized development:

```bash
# Build and run with Docker Compose
pnpm run build:docker

# Or manually with Docker
docker build -t personal-portfolio .
docker run -p 8080:8080 personal-portfolio

# Build with custom port
docker build --build-arg PORT=3000 -t personal-portfolio .
docker run -p 3000:3000 personal-portfolio
```

## 🚀 Deployment

The site is automatically deployed via
[GitHub Actions](https://github.com/features/actions). To deploy a new release,
create a tagged release with a name starting with `v`. Note that this sites
CI/CD is ran on a
[self-hosted runner](https://docs.github.com/en/actions/concepts/runners/about-self-hosted-runners).
The main runner is hosted on my personal server, and the site's container is
proxied through a
[Cloudflare tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).
