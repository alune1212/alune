# Simplified Chinese UI Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the web application user-facing copy to Simplified Chinese through a lightweight centralized copy layer.

**Architecture:** Add `apps/web/src/config/ui-copy.ts` for shared labels and messages. Update existing React pages, layout, navigation, and tests to consume Chinese copy while preserving technical identifiers and API values.

**Tech Stack:** React 19, TypeScript, TanStack Router, TanStack Query, Vitest, Testing Library.

---

### Task 1: Add Shared Copy Layer

**Files:**

- Create: `apps/web/src/config/ui-copy.ts`
- Test: `apps/web/src/config/navigation.test.ts`

- [ ] Create `ui-copy.ts` with Chinese shared labels for modules, actions, statuses, yes/no, empty states, and common errors.
- [ ] Update `navigation.ts` to use module labels from `uiCopy`.
- [ ] Update navigation tests to assert Chinese menu labels.
- [ ] Run `pnpm --filter @alune/web test -- navigation`.

### Task 2: Translate Auth, Layout, And Dashboard

**Files:**

- Modify: `apps/web/src/features/auth/login-page.tsx`
- Modify: `apps/web/src/features/auth/forbidden-page.tsx`
- Modify: `apps/web/src/features/auth/require-auth.tsx`
- Modify: `apps/web/src/components/layout/sidebar.tsx`
- Modify: `apps/web/src/components/layout/topbar.tsx`
- Modify: `apps/web/src/features/dashboard/dashboard-page.tsx`
- Test: auth and dashboard related web tests

- [ ] Update visible login, session-expired, forbidden, loading, sidebar, topbar, and dashboard copy to Simplified Chinese.
- [ ] Preserve technical values such as `admin`, `username`, API service names, and status fields.
- [ ] Update affected tests.
- [ ] Run focused web tests.

### Task 3: Translate Internal System Pages

**Files:**

- Modify: `apps/web/src/features/users/users-page.tsx`
- Modify: `apps/web/src/features/roles/roles-page.tsx`
- Modify: `apps/web/src/features/departments/departments-page.tsx`
- Modify: `apps/web/src/features/audit/audit-page.tsx`
- Modify: `apps/web/src/features/dictionaries/dictionaries-page.tsx`
- Modify: `apps/web/src/features/files/files-page.tsx`
- Test: matching `*.test.tsx` files

- [ ] Translate table headers, buttons, placeholders, page titles, descriptions, empty states, toast messages, form labels, and confirmation text.
- [ ] Keep raw data values and technical identifiers unchanged where users inspect codes, IDs, filenames, content types, and permission codes.
- [ ] Update tests to find Chinese text.
- [ ] Run focused web tests for each feature.

### Task 4: Verify No User-Facing English Remains

**Files:**

- Modify only files that still contain user-facing English.

- [ ] Search `apps/web/src` for visible English strings and classify technical identifiers versus user-facing copy.
- [ ] Run `pnpm --filter @alune/web test`.
- [ ] Run `pnpm --filter @alune/web typecheck`.
