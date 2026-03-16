/**
 * Query Key Factory
 *
 * Centralized query key management for consistent cache handling.
 */

export const queryKeys = {
  admin: {
    all: ["admin"] as const,
    pendingRequests: () => [...queryKeys.admin.all, "pendingRequests"] as const,
    allTeams: () => [...queryKeys.admin.all, "allTeams"] as const,
    requestStats: () => [...queryKeys.admin.all, "requestStats"] as const,
  },
  teams: {
    all: ["teams"] as const,
    byIds: (ids: string[]) => [...queryKeys.teams.all, "byIds", ids] as const,
    myRequests: () => [...queryKeys.teams.all, "myRequests"] as const,
    requestById: (id: string) => [...queryKeys.teams.all, "requestById", id] as const,
    checkName: (name: string) => [...queryKeys.teams.all, "checkName", name] as const,
  },
  user: {
    all: ["user"] as const,
    myTeams: (teamIds: string[]) => [...queryKeys.user.all, "myTeams", teamIds] as const,
  },
} as const;

export type QueryKeyFactory = typeof queryKeys;
