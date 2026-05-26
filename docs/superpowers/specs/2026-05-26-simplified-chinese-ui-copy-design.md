# Simplified Chinese UI Copy Design

## Goal

Make the web application user-facing interface read as Simplified Chinese while keeping code identifiers, API fields, permission codes, test account values, and other technical markers unchanged.

## Scope

Translate visible frontend copy in `apps/web/src`, including navigation labels, page titles, table headers, buttons, placeholders, validation messages, toasts, empty states, error messages, and route guard messages.

Do not translate internal identifiers such as `username`, `email`, `permission.code`, query keys, route paths, permission codes like `menu:users`, API response values, or seeded account names like `e2e_admin`.

## Approach

Add a lightweight copy layer at `apps/web/src/config/ui-copy.ts`. It centralizes shared Chinese labels, module names, button text, status values, empty states, and common messages without adding an i18n dependency or language switcher.

Feature pages can keep one-off sentence copy local when it is tightly coupled to that page. Shared vocabulary should come from `uiCopy` so terms such as users, roles, departments, enabled, disabled, and actions remain consistent.

## Testing

Update frontend interaction tests and navigation tests to assert the Simplified Chinese user-facing copy. Run focused web tests first, then web typecheck.
