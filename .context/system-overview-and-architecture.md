# System Overview & Architecture

## Purpose

The Policy Administration Platform is an internal tool used by underwriters, customer service representatives (CSRs), and operations managers to manage the full lifecycle of insurance policies across four lines of business: Auto, Home, Renters, and Life.

## Supported Lines of Business

| Line of Business | Policy Prefix | Coverage Types                     |
| ---------------- | ------------- | ---------------------------------- |
| Auto             | LM-AUTO-      | Comprehensive, Liability           |
| Home             | LM-HOME-      | Comprehensive, Standard, Basic     |
| Renters          | LM-RENT-      | Standard, Premium, Basic           |
| Life             | LM-LIFE-      | Term (20-year), Whole Life         |

## Architecture

- **Frontend:** React 17 single-page application with React Router 5 for client-side routing
- **Backend:** Express.js API server with JWT-based authentication
- **Build Tool:** Vite for fast development and production builds
- **Testing:** Jest + React Testing Library for unit/integration tests

## Key System Capabilities

- Policy CRUD (Create, Read, Update, Delete)
- Policy endorsements (mid-term modifications)
- Policy renewals (term extensions)
- Policy cancellations (with reason codes and audit trail)
- Claims tracking (read-only summary from external Claims Processing System)
- Document management (upload, download, retention)
- Audit logging (immutable activity trail per policy)
- Role-based access control (CSR, Underwriter, Admin)

## Environments

| Environment | URL                            | Purpose                  |
| ----------- | ------------------------------ | ------------------------ |
| Development | localhost:5173                 | Local developer testing  |
| Staging     | staging-policyadmin.internal   | Pre-production validation|
| Production  | policyadmin.internal           | Live production system   |

## Key Integrations

- **Document Storage:** File uploads (PDF, JPG, JPEG, PNG) stored server-side
- **Audit Logging:** All policy actions are immutably logged with timestamps, user IDs, and action details
- **Billing System:** Monthly billing history tracked per policy with paid/pending status
- **Claims Processing System (CPS):** External system; claims are surfaced read-only in the platform
