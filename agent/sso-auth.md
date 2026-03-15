# Enterprise SSO → Server-Side Session Architecture in TanStack Start

## Overview

We are building an internal **TanStack Start** application for an enterprise environment. Authentication is handled entirely by a proprietary **BlueSSO** system — there is no email/password login. The SSO system authenticates users at the network/infrastructure level and exposes the user's identity and group memberships to our frontend via a client-side hook.

The challenge is taking that client-side identity data and creating a **secure, authoritative server-side session** that can be used to protect server functions, route loaders, and `beforeLoad` guards — while also resolving the user's role(s) from our database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start |
| Router | TanStack Router (file-based) |
| Database ORM | Drizzle ORM |
| Database | PostgreSQL (custom `ensemble` schema) |
| Auth Source | Enterprise BlueSSO (proprietary) |
| Language | TypeScript |

---

## Part 1: The SSO Hook

### `SSOUser` Type

The shape of data returned by the BlueSSO system, validated with Zod:

```ts
// lib/zod/auth.schema.ts
import { z } from "zod";

export const SSOAttributesSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  adsId: z.string(),         // Active Directory username
  guid: z.string(),          // Unique enterprise identifier
  employeeId: z.string(),    // HR employee ID
  email: z.string().email(),
});

export const SSOUserSchema = z.object({
  attributes: SSOAttributesSchema,
  groups: z.array(z.string()), // e.g. ["SSO_ENSEMBLE_E1", "SSO_ENSEMBLE_ADMIN"]
});

export type SSOUser = z.infer<typeof SSOUserSchema>;
```

### `useAuthBlueSSO` Hook

This hook runs **client-side only**. It simulates an async SSO callback (in production, BlueSSO injects user data through an enterprise mechanism). The hook returns `null` until the identity is resolved.

```ts
// lib/hooks/useAuthBlueSSO.ts
import { useEffect, useState } from "react";
import type { SSOUser } from "@/lib/zod/auth.schema";

// ─── Mock data used in local development only ────────────────────────────────
const mockSSOUser: SSOUser = {
  attributes: {
    firstName: "Ensemble",
    lastName: "Test",
    fullName: "Ensemble Test",
    adsId: "ensemble",
    guid: "@fca9376056149663519865855188315",
    employeeId: "8229989",
    email: "ensemble.tester-test@aexp.com",
  },
  groups: ["SSO_ENSEMBLE_E1"],
};
// ─────────────────────────────────────────────────────────────────────────────

export function useAuthBlueSSO(): SSOUser | null {
  const [user, setUser] = useState<SSOUser | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (process.env.NODE_ENV === "development") {
        // In dev: use mock data
        setUser(mockSSOUser);
      }
      // In production: BlueSSO populates user data here via its own mechanism
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  return user;
}
```

### Key Fields

| Field | Source | Purpose |
|---|---|---|
| `attributes.guid` | BlueSSO | Primary unique identifier for the user |
| `attributes.adsId` | BlueSSO | AD username, used for audit trails (`createdBy`, `updatedBy`) |
| `attributes.email` | BlueSSO | Display / contact info |
| `attributes.employeeId` | BlueSSO | HR reference |
| `groups` | BlueSSO | Array of group strings — drives all RBAC decisions |

> **Important:** The `groups` array is the single source of truth for authorization. A user's access to any team and their role within it is determined entirely by which groups they belong to.

---

## Part 2: Database Schema

The Postgres schema (`ensemble`) models a **team-based multi-tenant structure**. Each team maps its SSO groups directly onto `userGroup` and `adminGroup` columns.

### `teams` — Core RBAC entity

```ts
export const teams = ensembleSchema.table("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull().unique(),

  // These two columns are matched against the user's `groups` array at login
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),

  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  turnoverGroupingEnabled: boolean("turnover_grouping_enabled").notNull().default(false),

  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: varchar("updated_by", { length: 255 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
});
```

### `team_registration_requests` — Onboarding workflow

Tracks requests for new team registration. Uses an approval state machine:

```
pending → approved → processed
       ↘ rejected
```

```ts
export const teamRegistrationRequests = ensembleSchema.table("team_registration_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamName: varchar("team_name", { length: 100 }).notNull(),
  userGroup: varchar("user_group", { length: 100 }).notNull(),
  adminGroup: varchar("admin_group", { length: 100 }).notNull(),
  contactName: varchar("contact_name", { length: 100 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  status: approvalStatus("status").notNull().default("pending"),
  requestedBy: varchar("requested_by", { length: 255 }).notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedBy: varchar("reviewed_by", { length: 255 }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  comments: text("comments"),
});
```

### `applications` — Team-owned resources

Each application belongs to exactly one team. Contains rich ownership metadata and lifecycle/sync state.

```ts
export const applications = ensembleSchema.table("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, {
    onDelete: "restrict",
    onUpdate: "cascade",
  }),
  applicationName: varchar("application_name", { length: 255 }).notNull(),
  tla: varchar("tla", { length: 12 }).notNull(),
  status: applicationStatus("status").notNull().default("active"),
  // ... many owner/contact fields omitted for brevity
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull(),
});
```

---

## Part 3: RBAC Logic

Role resolution happens by querying all teams and cross-referencing against the user's `groups` array:

```
For each team in the database:
  if user.groups includes team.adminGroup  →  role = "admin"  for this team
  if user.groups includes team.userGroup   →  role = "user"   for this team
  otherwise                                →  no access to this team
```

**A user can belong to multiple teams simultaneously, with different roles on each.**

Example:

```
User groups: ["SSO_ENSEMBLE_E1", "SSO_PLATFORM_ADMIN"]

Team A: userGroup = "SSO_ENSEMBLE_E1",   adminGroup = "SSO_ENSEMBLE_ADMIN"
  → role: "user"

Team B: userGroup = "SSO_PLATFORM_USER", adminGroup = "SSO_PLATFORM_ADMIN"
  → role: "admin"

Team C: userGroup = "SSO_OTHER_GROUP",   adminGroup = "SSO_OTHER_ADMIN"
  → no access
```

The resolved structure we want to work with server-side:

```ts
type ResolvedSession = {
  user: {
    guid: string;
    adsId: string;
    email: string;
    fullName: string;
    employeeId: string;
  };
  memberships: Array<{
    teamId: string;
    teamName: string;
    role: "admin" | "user";
  }>;
};
```

---

## Part 4: The Problem

We need to design a **secure, end-to-end session architecture** that bridges the client-side BlueSSO identity with server-side authorization in **TanStack Start**.

### Requirements

1. **Session creation** — After `useAuthBlueSSO` resolves on the client, we need to securely send the SSO payload to the server, resolve team memberships from the DB, and create a signed session.
2. **Session security** — The session must be signed/encrypted so it cannot be tampered with on the client.
3. **Server-side access** — The session must be readable inside TanStack Start **server functions** (`createServerFn`) and route **`beforeLoad`** / **`loader`** hooks.
4. **Role enforcement** — Routes and data access must be gateable by team membership and role (`user` vs `admin`) without a DB round-trip on every request.
5. **Session lifecycle** — The session should expire and refresh in a way that stays in sync with the underlying SSO state.

### Open Design Questions

**Q1 — Session handoff:** The SSO user object arrives on the client from `useAuthBlueSSO`. What is the correct pattern to securely send it to the server to mint a session in TanStack Start? Should we use a `createServerFn` call triggered from a client component on first load, or handle it differently?

**Q2 — Session storage:** Should the resolved session (with memberships) be stored entirely in a signed JWT cookie, or should only a minimal token be stored client-side with full session data kept server-side (e.g., in Redis or the DB)? What are the size, security, and invalidation tradeoffs in the context of TanStack Start's SSR model?

**Q3 — Role modeling:** Since roles are team-scoped, how should the session encode memberships? Should it embed the full `memberships` array in the cookie payload, or store just the raw `groups` array and re-resolve roles on each server function call?

**Q4 — Route protection with `beforeLoad`:** What is the recommended pattern in TanStack Router for protecting routes by role? How do we read and verify the session cookie inside `beforeLoad`, and what does the route tree look like for separating public, user-only, and admin-only route groups?

**Q5 — Session invalidation:** If a user's SSO group membership changes, how do we ensure their session reflects the updated roles without forcing a full logout? Is there a recommended refresh strategy within TanStack Start's lifecycle?