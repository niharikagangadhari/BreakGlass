import { supabase, isConfigured } from './supabase.js';
import { getOfflineDB, saveOfflineDB } from './mockData.js';

const CURRENT_USER_KEY = 'breakglass_current_session';

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email, password) {
    if (isConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      if (error) throw error;

      // Fetch profile
      const profile = await this.getProfile(data.user.id);
      return { user: data.user, profile, session: data.session };
    } else {
      // Offline mock authentication
      const db = getOfflineDB();
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error('Invalid credentials. Please verify email and password.');
      }

      const sessionUser = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
      };

      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
      return {
        user: sessionUser,
        profile: {
          id: user.id,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
        },
        session: { token: 'mock-jwt-token' }
      };
    }
  },

  /**
   * Register a new user
   */
  async register(email, password, fullName) {
    if (isConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'user', // Default role is always user
          },
        },
      });
      if (error) throw error;
      return data;
    } else {
      const db = getOfflineDB();
      const existing = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (existing) {
        throw new Error('A user with this email address already exists.');
      }

      const newUser = {
        id: 'usr-' + Math.random().toString(36).substring(2, 9),
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: 'user',
        created_at: new Date().toISOString(),
      };

      db.users.push(newUser);
      saveOfflineDB(db);

      return { user: newUser };
    }
  },

  /**
   * Retrieve user profile from profiles table
   */
  async getProfile(userId) {
    if (isConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Fallback: try to construct minimal profile if trigger was delayed
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          return {
            id: userId,
            full_name: userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0],
            role: userData.user.user_metadata?.role || 'user',
          };
        }
        throw error;
      }
      return data;
    } else {
      const db = getOfflineDB();
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error('User profile not found.');
      return {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        created_at: user.created_at,
      };
    }
  },

  /**
   * Get currently authenticated user and profile
   */
  async getCurrentUser() {
    if (isConfigured) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      try {
        const profile = await this.getProfile(session.user.id);
        return { user: session.user, profile, session };
      } catch (err) {
        console.error('Error fetching profile for current user:', err);
        return {
          user: session.user,
          profile: {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'user',
          },
          session,
        };
      }
    } else {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      if (!raw) return null;
      try {
        const user = JSON.parse(raw);
        const db = getOfflineDB();
        const latest = db.users.find((u) => u.id === user.id) || user;
        return {
          user: latest,
          profile: {
            id: latest.id,
            full_name: latest.full_name,
            role: latest.role,
            created_at: latest.created_at,
          },
          session: { token: 'mock-session-token' }
        };
      } catch {
        return null;
      }
    }
  },

  /**
   * Log out user
   */
  async logout() {
    if (isConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }
};
