import { User, UserRole } from '@/types';

export interface AuthToken {
  token: string;
  expiresAt: number;
}

export class AuthService {
  private static readonly TOKEN_KEY = 'authToken';
  private static readonly USER_KEY = 'authUser';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      // Convert date strings back to Date objects
      if (user.createdAt) {
        user.createdAt = new Date(user.createdAt);
      }
      if (user.updatedAt) {
        user.updatedAt = new Date(user.updatedAt);
      }
      return user;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  static hasRole(requiredRole: UserRole): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    // Role hierarchy: admin > manager > trainer/staff > member
    const roleHierarchy = {
      [UserRole.ADMIN]: 4,
      [UserRole.MANAGER]: 3,
      [UserRole.TRAINER]: 2,
      [UserRole.STAFF]: 2,
      [UserRole.MEMBER]: 1,
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  static hasPermission(permission: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Define permissions by role
    const permissions = {
      [UserRole.ADMIN]: [
        'manage_users', 'manage_members', 'manage_staff', 'manage_classes',
        'manage_payments', 'manage_equipment', 'view_analytics', 'manage_settings'
      ],
      [UserRole.MANAGER]: [
        'manage_members', 'manage_staff', 'manage_classes', 'view_payments',
        'manage_equipment', 'view_analytics'
      ],
      [UserRole.TRAINER]: [
        'view_members', 'manage_own_classes', 'view_own_schedule', 'record_attendance'
      ],
      [UserRole.STAFF]: [
        'view_members', 'record_attendance', 'process_payments', 'manage_bookings'
      ],
      [UserRole.MEMBER]: [
        'view_own_profile', 'book_classes', 'view_own_payments', 'view_own_attendance'
      ],
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  }

  static canAccessRoute(route: string): boolean {
    const user = this.getUser();
    if (!user) return false;

    // Define route access by role
    const routeAccess = {
      '/dashboard': [UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.STAFF, UserRole.MEMBER],
      '/members': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      '/staff': [UserRole.ADMIN, UserRole.MANAGER],
      '/classes': [UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.STAFF, UserRole.MEMBER],
      '/payments': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      '/equipment': [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      '/analytics': [UserRole.ADMIN, UserRole.MANAGER],
      '/settings': [UserRole.ADMIN],
    };

    const allowedRoles = routeAccess[route] || [];
    return allowedRoles.includes(user.role);
  }

  static logout(): void {
    this.removeToken();
    window.location.href = '/login';
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  static shouldRefreshToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh if token expires in less than 5 minutes
      return timeUntilExpiry < 300;
    } catch {
      return false;
    }
  }
}

// Utility functions for role-based rendering
export const withRole = (allowedRoles: UserRole[]) => {
  return (component: React.ReactNode): React.ReactNode | null => {
    const user = AuthService.getUser();
    if (!user || !allowedRoles.includes(user.role)) {
      return null;
    }
    return component;
  };
};

export const withPermission = (permission: string) => {
  return (component: React.ReactNode): React.ReactNode | null => {
    if (!AuthService.hasPermission(permission)) {
      return null;
    }
    return component;
  };
};

// Mock data for development
export const mockUsers = {
  admin: {
    id: '1',
    email: 'admin@gym.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  manager: {
    id: '2',
    email: 'manager@gym.com',
    firstName: 'Manager',
    lastName: 'User',
    role: UserRole.MANAGER,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  trainer: {
    id: '3',
    email: 'trainer@gym.com',
    firstName: 'Trainer',
    lastName: 'User',
    role: UserRole.TRAINER,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  member: {
    id: '4',
    email: 'member@gym.com',
    firstName: 'Member',
    lastName: 'User',
    role: UserRole.MEMBER,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};