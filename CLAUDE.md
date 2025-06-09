# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

InkSync is a file synchronization system built as a Bun-based monorepo with multiple applications. It provides real-time file syncing between clients and servers with conflict resolution, similar to Git but for arbitrary files.

## Monorepo Structure

This is a Bun-based monorepo with packages located in the `packages/` directory:
- **`packages/server`** - Elysia.js HTTP server with SQLite database and REST API
- **`packages/cli`** - Command-line interface for server management and client sync operations  
- **`packages/mobile`** - React/Vite Capacitor mobile app with TanStack Router
- **`packages/libinksync`** - Shared TypeScript library used across all packages
- **`packages/admin-ui`** - React admin interface for server management

## Development Commands

### Root Level (Monorepo)
```bash
bun install           # Install all dependencies
```

### Server (`packages/server`)
```bash
bun run dev          # Start development server (runs main.ts)
bun run generate     # Generate Drizzle database migrations
```

### CLI (`packages/cli`) 
```bash
bun run build       # Build CLI using custom build script
bun run program     # Run CLI directly
```

### Mobile App (`packages/mobile`)
```bash
bun run dev         # Start Vite development server
bun run build       # TypeScript compile + Vite build
bun run sync        # Build and sync with Capacitor
bun run lint        # ESLint
```

### Shared Library (`packages/libinksync`)
```bash
bun run build       # Build library
```

## Architecture Patterns

### Database Layer
- **Drizzle ORM** with SQLite for data persistence
- Schema defines users, vaults, tokens, and access control
- Database migrations in `drizzle/` directory
- Configuration in `drizzle.config.ts`

### API Layer (Server)
- **Elysia.js** TypeScript web framework
- REST API endpoints for sync operations
- Bearer token authentication
- CORS enabled for cross-origin requests
- Admin UI integration with HTML plugin

### Client Architecture
- **CLI**: Commander.js for command parsing, supports server start/sync operations
- **Mobile**: React with TanStack Router, Jotai state management, Capacitor for native features
- **Shared**: libinksync package provides common sync logic and API clients

### File Synchronization
- Conflict resolution with timestamp-based merging
- Support for multiple vault types (directory, S3-bucket planned)
- Client-server sync protocol with status tracking
- Connectfile system for linking directories to vaults

## Key Configuration Files

- **Server config**: `inksync-server-config.yaml` (YAML-based configuration)
- **Capacitor config**: `capacitor.config.ts` (mobile app configuration)
- **Database**: `drizzle.config.ts` (ORM configuration)

## Build System

- **Bun** runtime throughout the monorepo
- Custom build scripts for CLI and library packages
- Vite for mobile app bundling
- TypeScript compilation with project references