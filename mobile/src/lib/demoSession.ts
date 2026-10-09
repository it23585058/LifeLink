/**
 * Module-level demo session store for Member 3.
 *
 * Temporary stand-in until real authentication is merged across team members.
 * Reads/writes current user demo role and user ID for development demonstration.
 */

export type DemoRole = 'donor' | 'patient' | 'volunteer' | 'hospital_staff';

export type DemoSession = {
  role: DemoRole;
  userId: string;
};

let currentSession: DemoSession = {
  role: 'donor',
  userId: 'demo_user_thisal',
};

const listeners = new Set<(session: DemoSession) => void>();

export function getDemoSession(): DemoSession {
  return { ...currentSession };
}

export function setDemoRole(role: DemoRole): void {
  currentSession = {
    ...currentSession,
    role,
  };
  listeners.forEach((listener) => {
    try {
      listener({ ...currentSession });
    } catch {
      // Ignore listener error
    }
  });
}

export function subscribeDemoSession(callback: (session: DemoSession) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
