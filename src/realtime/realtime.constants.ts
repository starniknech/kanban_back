export const REALTIME_GATEWAY_OPTIONS = {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
};

export function getProjectRoom(projectId: string) {
  return `project:${projectId}`;
}

export function getDashboardUserRoom(userId: string) {
  return `dashboard:user:${userId}`;
}

export function getDashboardEmailRoom(email: string) {
  return `dashboard:email:${email.toLowerCase()}`;
}
