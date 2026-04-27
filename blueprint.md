# Project Blueprint: SQLD Community

> **[IMPORTANT] Context Management**
> Every session MUST start by checking the latest log in the `history/` directory to maintain context of previous discussions, decisions, and mandatory rules (especially the 4 user-defined rules).

## Overview
A modern, responsive exam preparation portal for SQLD certification, built with React and Tailwind CSS. The application features a clean, professional design with a focus on community interaction, study resources, and exam schedules.

## Core Mandates (Fixed)
1. **Never modify existing logic/structures arbitrarily.** All changes must be researched or approved.
2. **Pre-approval for all modifications.** Do not delete files or start implementation without user consent.
3. **Stability first.** User approval and project stability outweigh technical novelty.
4. **Server-Driven Feedback.** Trust and display `msg` fields from the backend directly.

## Features
- **Modern UI:** Clean, responsive interface using Tailwind CSS and `div`-based list layouts for maximum stability.
- **Security & Authorization:**
    - **Multi-level Roles:** `USER`, `ADMIN`, `SUPER_ADMIN` hierarchy with strict modification guards.
    - **Pre-emptive Auth Guard:** JWT expiration check before API requests and STOMP reconnections to prevent server error logs.
    - **Automatic Session Handling:** Dispatches `auth-error` events on expiration, triggering auto-logout and login modal.
- **Dynamic Board System:**
    - **Board Configuration:** All names, codes, and categories are dynamically synced from the backend.
    - **Sort Control:** Support for `sortOrder` in groups and detailed codes, manageable via Admin CMS.
    - **Dynamic Breadcrumbs:** Integrated [Home > Board > Category] pathing across list and detail pages.
- **Performance & Stability:**
    - **Flicker-Free Transitions:** `div`-based flexbox layouts replace rigid tables.
    - **Cross-fade Transitions:** Smooth data switching in lists to eliminate template afterimages.
    - **Optimized Loading:** Silent switching for fast-loading data by omitting or delaying spinners.
- **Notification System:**
    - **Unified Toast Strategy:** Shifted from intrusive modals to smooth toasts for almost all feedback.
    - **Global API Error Interceptor:** Automatically catches server exceptions and displays the detailed `msg` via global toast.
- **Content Management:**
    - **Admin CMS:** Enhanced group/board settings, including new `sortOrder` and `tagYn` (Hashtag) toggles.
    - **My Activity:** Dynamic filtering of user posts/scraps based on real board configurations.

## Architecture
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion (for toasts and list transitions)
- **API:** Custom Axios utility (`api.ts`) with advanced request/response interceptors for security and error handling.
- **WebSocket:** STOMP/SockJS with automatic reconnection guards.
