# Product Requirements Document — LinkedIn Juice Analyzer

## Problem

LinkedIn feeds are increasingly filled with AI-generated or low-information posts
that waste readers' time. There is no quick way to assess post quality at a glance.

## Solution

A Chrome extension that automatically scores every post in the LinkedIn feed on three
dimensions: AI-likeness, Bullshit density, and informational Juice. All processing is
local, deterministic, and runs without any API calls.

## Target User

Professionals who use LinkedIn and want to filter signal from noise.

## Core Features (MVP)

- Automatic scoring of all visible feed posts
- Score card injected below each post with AI / BS / Juice metrics (0–100)
- One-line deterministic summary sentence per post
- Deduplication so each post is scored once
- Handles LinkedIn's infinite scroll

## Out of Scope (MVP)

- Popup UI or settings page
- Score filtering or feed sorting
- Cloud sync or analytics
- Support for non-feed LinkedIn pages (profile, search, etc.)

## Success Criteria

- Extension loads without errors on linkedin.com/feed
- Score cards appear on all visible posts within 1 second of page load
- New posts loaded by infinite scroll are scored within 1 second
- No post is scored twice
- Build passes `npm run build` with zero TypeScript errors
- Unit tests pass with `npm test`
