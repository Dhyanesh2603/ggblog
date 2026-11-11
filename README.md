# GGBlog 📖

> **Modern Web Novel & Technical Reading Platform with Reader Studio & Ergonomic Typography**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Oxlint](https://img.shields.io/badge/Oxlint-Enforced-FF6B6B?style=for-the-badge)](https://oxc.rs/)

---

## Overview

**GGBlog** is an immersive digital publication and serialized web novel reading platform built with **React 19, TypeScript, and Vite**. Designed for distraction-free reading, it features interactive chapter state persistence, a collapsible table-of-contents drawer, customized typography scales, and a dedicated **Writer Studio**.

---

## Features

- 📚 **Serialized Novel & Chapter Routing**: Deep-linked chapter indexing with seamless previous/next chapter pagination.
- 🧠 **Context-Aware Reading State**: Global reading progress persistence via `ReadingContext` and local storage.
- ✍️ **Writer Studio**: In-browser authoring environment for drafting, previewing, and formatting chapters.
- 🎨 **Adaptive Theme Tokens**: Tailored for prolonged reading with eye-strain reduction modes.
- ⚡ **Ultra-Fast Tooling**: Powered by Vite and linted with Oxlint for near-instant HMR and sub-second builds.

---

## Project Structure

```
src/
├── components/          # Reusable UI (Header, MobileMenu, TableOfContentsDrawer, Footer)
├── context/             # React Contexts (NovelContext, ReadingContext)
├── data/                # Seed chapters, metadata, and publication catalog
├── pages/
│   ├── HomePage.tsx          # Featured publications & novel showcases
│   ├── NovelIndexPage.tsx    # Complete chapter archive & metadata overview
│   ├── ChapterPage.tsx       # Distraction-free reader view
│   ├── ReadingPage.tsx       # Saved bookmarks & reading history
│   ├── WriterStudioPage.tsx  # In-browser authoring studio
│   └── AboutPage.tsx         # Platform philosophy & author bio
└── utils/               # Typography, text metrics, and time-to-read calculators
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/Dhyanesh2603/ggblog.git
cd ggblog

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## License
MIT
