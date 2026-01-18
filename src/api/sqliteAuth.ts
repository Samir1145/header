/**
 * SQLite Authentication API
 * Replaces Firebase Auth with SQLite-backed authentication
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('LIGHTRAG-API-TOKEN');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors - only clear token on explicit auth failures
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only remove token if it's an auth-related endpoint that returned 401
        // Don't remove token for other endpoints (like tabs, forms) as those might just need re-auth
        const isAuthEndpoint = error.config?.url?.includes('/api/auth/');
        const isUnauthorized = error.response?.status === 401;

        if (isAuthEndpoint && isUnauthorized) {
            // Token is definitely invalid, clear it
            localStorage.removeItem('LIGHTRAG-API-TOKEN');
            localStorage.removeItem('LIGHTRAG-ROLE');
            localStorage.removeItem('LIGHTRAG-PLAN');
            console.log('🔒 Auth token cleared due to authentication failure');
        }

        return Promise.reject(error);
    }
);

// Types
export interface User {
    id: number;
    email: string;
    fullName?: string;
    role: 'user' | 'stakeholder' | 'team' | 'admin';
    plan: 'free' | 'premium' | 'enterprise';
}

export interface AuthResponse {
    message: string;
    token: string;
    user: User;
}

export interface AuthStatusResponse {
    auth_configured: boolean;
    auth_mode: 'sqlite';
    access_token: string | null;
    core_version: string;
    api_version: string;
    webui_title?: string;
    webui_description?: string;
    role?: string | null;
    plan?: string | null;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

export const sqliteRegister = async (
    email: string,
    password: string,
    fullName?: string,
    phoneNumber?: string
): Promise<AuthResponse> => {
    try {
        console.log('📝 Attempting SQLite registration for:', email);

        const response = await api.post<AuthResponse>('/api/auth/register', {
            email,
            password,
            fullName,
            phoneNumber,
        });

        console.log('✅ SQLite registration successful for:', email);
        return response.data;
    } catch (error: any) {
        console.error('❌ SQLite registration error:', error);

        const errorMessage = error.response?.data?.error || 'Registration failed';
        throw new Error(errorMessage);
    }
};

export const sqliteLogin = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    try {
        console.log('🔐 Attempting SQLite login for:', email);

        const response = await api.post<AuthResponse>('/api/auth/login', {
            email,
            password,
        });

        console.log('✅ SQLite login successful for:', email);
        return response.data;
    } catch (error: any) {
        console.error('❌ SQLite login error:', error);

        const errorMessage = error.response?.data?.error || 'Login failed';
        throw new Error(errorMessage);
    }
};

export const sqliteLogout = async (): Promise<void> => {
    try {
        // Clear all auth data from localStorage
        localStorage.removeItem('LIGHTRAG-API-TOKEN');
        localStorage.removeItem('LIGHTRAG-ROLE');
        localStorage.removeItem('LIGHTRAG-PLAN');
        console.log('✅ SQLite logout successful');
    } catch (error) {
        console.error('❌ SQLite logout error:', error);
        throw error;
    }
};

export const sqliteForgotPassword = async (email: string): Promise<void> => {
    try {
        await api.post('/api/auth/forgot-password', { email });
        console.log('✅ Password reset request sent for:', email);
    } catch (error: any) {
        console.error('❌ Forgot password error:', error);
        const errorMessage = error.response?.data?.error || 'Password reset failed';
        throw new Error(errorMessage);
    }
};

export const getAuthStatus = async (): Promise<AuthStatusResponse> => {
    const token = localStorage.getItem('LIGHTRAG-API-TOKEN');

    if (!token) {
        return {
            auth_configured: false,
            auth_mode: 'sqlite',
            access_token: null,
            core_version: 'sqlite',
            api_version: 'v1',
            webui_title: 'Rezolution Bazar',
            webui_description: 'User not authenticated',
            role: null,
            plan: null,
        };
    }

    try {
        const response = await api.get('/api/auth/status');
        const { user } = response.data;

        return {
            auth_configured: true,
            auth_mode: 'sqlite',
            access_token: token,
            core_version: 'sqlite',
            api_version: 'v1',
            webui_title: 'Rezolution Bazar',
            webui_description: 'Powered by SQLite',
            role: user.role,
            plan: user.plan,
        };
    } catch (error) {
        console.error('❌ Auth status error:', error);
        return {
            auth_configured: false,
            auth_mode: 'sqlite',
            access_token: null,
            core_version: 'sqlite',
            api_version: 'v1',
            role: null,
            plan: null,
        };
    }
};

export const getUserMetadata = async (): Promise<{
    role: string;
    plan: string;
    fullName?: string;
}> => {
    try {
        const response = await api.get('/api/users/me');
        return {
            role: response.data.role,
            plan: response.data.plan,
            fullName: response.data.full_name,
        };
    } catch (error) {
        console.error('❌ Get user metadata error:', error);
        throw new Error('Failed to get user metadata');
    }
};

// ============================================
// Q&A LOGGING
// ============================================

export const saveUserQnA = async (
    question: string,
    answer: string,
    _userId: string,
    email: string
): Promise<void> => {
    try {
        await api.post('/api/qna', { question, answer, email });
        console.log('✅ Q&A logged successfully');
    } catch (error) {
        console.error('❌ Failed to log Q&A:', error);
        // Don't throw - Q&A logging is not critical
    }
};

export const saveUserQuestion = async (
    question: string,
    _userId: string
): Promise<void> => {
    try {
        await api.post('/api/qna', { question });
        console.log('✅ Question logged successfully');
    } catch (error) {
        console.error('❌ Failed to log question:', error);
        // Don't throw - logging is not critical
    }
};

// Export the api instance for other modules
export { api };
