# Accessing User Session — Client & Server Guide

## Overview

The session system bridges BlueSSO (client-side identity) into a signed, HTTP-only cookie session. Once established, user details are available on **both client and server** through different mechanisms.

---

## Session Shape (`SessionUser`)

```ts
// src/lib/zod/auth.schema.ts
type SessionUser = {
  userId: string;      // BlueSSO guid
  adsId: string;       // Active Directory username
  email: string;       // User email
  fullName: string;    // Display name
  employeeId: string;  // HR employee ID
  groups: string[];    // SSO group memberships
  accessibleTeamIds: string[]; // Teams where user has any access
  adminTeamIds: string[];      // Teams where user is admin
  iat: number;         // Issued at (unix seconds)
  exp: number;         // Expiration (unix seconds)
};
```

---

## Client-Side Access

### Option 1: Route Context (Recommended)

The root route's `beforeLoad` fetches the session and puts it in router context. Any route component can access it:

```tsx
// In any route component
import { Route } from "./my-route";

function MyComponent() {
  const { session } = Route.useRouteContext();

  if (!session) {
    return <p>Not authenticated</p>;
  }

  return (
    <div>
      <p>Welcome, {session.fullName}</p>
      <p>Email: {session.email}</p>
      <p>Teams: {session.accessibleTeamIds.length}</p>
      <p>Admin on: {session.adminTeamIds.length} teams</p>
    </div>
  );
}
```

### Option 2: Call `getSessionFn` directly

You can call the server function from any client component:

```tsx
import { getSessionFn } from "@/actions/auth.fn";

async function loadUser() {
  const session = await getSessionFn();
  // session is SessionUser | null
}
```

### Option 3: Raw SSO data (before session is created)

If you need the raw BlueSSO identity (before session creation):

```tsx
import { useAuthBlueSSO } from "@/components/use-authblue-sso";

function MyComponent() {
  const ssoUser = useAuthBlueSSO();
  // ssoUser is SSOUser | null
  // Has: ssoUser.attributes.fullName, ssoUser.groups, etc.
}
```

---

## Server-Side Access

### Option 1: In `beforeLoad` / `loader` (Route Context)

The session is loaded in the root route's `beforeLoad` and flows to child routes:

```ts
// src/routes/admin.tsx
export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    // context.session is SessionUser | null
    if (!context.session) {
      throw redirect({ to: "/" });
    }
    // Check admin role for a specific team
    const teamId = "some-team-uuid";
    if (!context.session.adminTeamIds.includes(teamId)) {
      throw redirect({ to: "/unauthorized" });
    }
  },
  loader: ({ context }) => {
    // Use session in loader too
    console.log("Loading data for:", context.session?.adsId);
  },
});
```

### Option 2: In `createServerFn` handlers

```ts
import { createServerFn } from "@tanstack/react-start";

export const myProtectedAction = createServerFn({ method: "POST" })
  .handler(async () => {
    // Dynamic import to keep server-only modules off the client
    const { useAppSession } = await import("@/lib/session");
    const session = await useAppSession();

    if (!session.data.userId) {
      throw new Error("Unauthorized");
    }

    // session.data has the full SessionUser shape
    const userId = session.data.userId;
    const adsId = session.data.adsId;
    const isAdmin = session.data.adminTeamIds?.includes("some-team-id");

    return { userId, adsId, isAdmin };
  });
```

---

## Available Server Actions

All actions live in `src/actions/auth.fn.ts`:

| Action | Method | Description |
|---|---|---|
| `createSessionFn` | POST | Accepts `SSOUser` payload, resolves team memberships, mints session cookie |
| `getSessionFn` | GET | Reads session cookie, returns `SessionUser \| null` (checks expiry) |
| `refreshSessionFn` | POST | Re-resolves team memberships from DB using stored groups |
| `clearSessionFn` | POST | Clears the session cookie (logout) |

### Usage examples

```ts
import {
  createSessionFn,
  getSessionFn,
  refreshSessionFn,
  clearSessionFn,
} from "@/actions/auth.fn";

// Get current session
const session = await getSessionFn();

// Refresh memberships (e.g., after group change)
const updated = await refreshSessionFn();

// Logout
await clearSessionFn();
```

---

## Role Checking Helpers

Common patterns for checking roles:

```ts
// Check if user has access to a specific team
function hasTeamAccess(session: SessionUser, teamId: string): boolean {
  return session.accessibleTeamIds.includes(teamId);
}

// Check if user is admin of a specific team
function isTeamAdmin(session: SessionUser, teamId: string): boolean {
  return session.adminTeamIds.includes(teamId);
}

// Check if user has any admin role
function isAnyAdmin(session: SessionUser): boolean {
  return session.adminTeamIds.length > 0;
}
```

---

## File Structure

```
src/
├── actions/
│   └── auth.fn.ts          # All auth server functions (createServerFn)
├── components/
│   ├── auth-guard.tsx       # SSO → session bridge (root-level wrapper)
│   └── use-authblue-sso.tsx # BlueSSO client-side hook
├── lib/
│   ├── session.ts           # useAppSession() — cookie config
│   └── zod/
│       └── auth.schema.ts   # SSOUser & SessionUser types + schemas
└── routes/
    └── __root.tsx            # beforeLoad fetches session into context
```
