import { ProjectRole } from '../enums/domain.enums';

export const OWNER_ROLES = [
  ProjectRole.MEMBER,
  ProjectRole.ADMIN,
  ProjectRole.OWNER,
];

export const ADMIN_ROLES = [ProjectRole.MEMBER, ProjectRole.ADMIN];

export const MEMBER_ROLES = [ProjectRole.MEMBER];

export function normalizeProjectRoles(roles: ProjectRole[]): ProjectRole[] {
  if (roles.includes(ProjectRole.OWNER)) {
    return OWNER_ROLES;
  }

  if (roles.includes(ProjectRole.ADMIN)) {
    return ADMIN_ROLES;
  }

  return MEMBER_ROLES;
}

export function hasProjectRole(
  roles: ProjectRole[] | undefined,
  role: ProjectRole,
): boolean {
  return Boolean(roles?.includes(role));
}

