# Project Blueprint: SQLD Community

> **[IMPORTANT] Context Management**
> Every session MUST start by checking the latest log in the `history/` directory to maintain context of previous discussions, decisions, and mandatory rules (especially the 4 user-defined rules).

## Overview
A modern, responsive exam preparation portal for SQLD certification, built with React and Tailwind CSS. The application features a clean, professional design with a focus on community interaction, study resources, and exam schedules.

## Features
- **Modern UI:** Clean, responsive interface using Tailwind CSS.
- **Dark Mode Support:** Built-in support for light and dark themes.
- **Interactive Boards:**
    - **Performance:** Optimized rendering (`memo`, `useCallback`) to prevent flickering during comment input or media interaction.
    - **Security:** Enhanced file download system using **Axios Blob method** with JWT authentication.
    - **Navigation:** Intelligent history management (`go(-2)`) to handle complex back-navigation from edit pages.
- **Comment System:**
    - Nested parent-child (Reply) architecture.
    - Isolated input components (`MainCommentForm`) for high-performance typing.
    - Simplified UX: Removed redundant success alerts for common tasks.
- **Resource Boards:** Organized sections for Notices, Study Materials, and Greetings.
- **Search Functionality:** Prominent search bars with debounce logic.

## Architecture
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animation:** Framer Motion
- **State Management:** Local state & Context API.
- **API:** Custom `api.ts` utility (Axios) supporting `PUT` methods and `Blob` responses.

## Components
- **Header:** Navigation, Search, Auth buttons, Profile dropdown.
- **Hero:** Welcome message, Call to Actions.
- **Detailed Pages:** `ExamDetailPage` with optimized content/attachment/comment sections.
- **Write/Edit:** `WritePostPage` with auto-restore and history guard.
- **Footer:** Links, Copyright, Legal info.
