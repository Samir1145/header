/**
 * SQLite API Client
 * Replaces Firestore operations with SQLite-backed API calls
 */

import { api } from './sqliteAuth';

// ============================================
// NAVIGATION TABS API
// ============================================

export interface SubTab {
    title: string;
    path: string;
    loginUrl: string;
}

export interface TabEntry {
    public?: boolean;
    stakeholders?: boolean;
    team?: boolean;
    admin?: boolean;
    customHeading?: string;
    order?: number;
    loginUrl?: string;
    subtabs?: SubTab[];
    ipAddress?: string;
    filePath?: string;
    ipAddress1?: string;
    subtitle1?: string;
    url1?: string;
    subtitle2?: string;
    url2?: string;
    subtitle3?: string;
    url3?: string;
    subtitle4?: string;
    url4?: string;
    subtitle5?: string;
    url5?: string;
}

export interface SiteSettings {
    siteTitle?: string;
    siteHeader?: string;
}

export interface TabConfig {
    [key: string]: TabEntry | SiteSettings | unknown[] | undefined;
    siteSettings?: SiteSettings;
    resourceTypes?: unknown[];
}

let tabsCache: { data: TabConfig | null; timestamp: number } = {
    data: null,
    timestamp: 0,
};
const TABS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getNavigationTabs = async (): Promise<TabConfig> => {
    try {
        // Check cache
        const now = Date.now();
        if (tabsCache.data && now - tabsCache.timestamp < TABS_CACHE_TTL) {
            return tabsCache.data;
        }

        const response = await api.get<TabConfig>('/api/admin/tabs');

        // Update cache
        tabsCache = {
            data: response.data,
            timestamp: now,
        };

        return response.data;
    } catch (error) {
        console.error('❌ Failed to fetch navigation tabs:', error);

        // Return cached data if available, even if stale
        if (tabsCache.data) {
            return tabsCache.data;
        }

        return {};
    }
};

export const saveNavigationTabs = async (config: TabConfig): Promise<void> => {
    try {
        await api.put('/api/admin/tabs', config);

        // Invalidate caches
        tabsCache = { data: config, timestamp: Date.now() };
        invalidateSiteSettingsCache();

        // Notify components to refresh
        window.dispatchEvent(new CustomEvent('site-settings-updated'));

    } catch (error: any) {
        console.error('❌ Failed to save navigation tabs:', error);
        throw new Error(error.response?.data?.error || 'Failed to save tabs');
    }
};

export const invalidateTabsCache = (): void => {
    tabsCache = { data: null, timestamp: 0 };
};

// ============================================
// SITE SETTINGS API
// ============================================

let siteSettingsCache: { data: SiteSettings | null; timestamp: number } = {
    data: null,
    timestamp: 0,
};
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getSiteSettings = async (): Promise<SiteSettings> => {
    try {
        const now = Date.now();
        if (siteSettingsCache.data && now - siteSettingsCache.timestamp < SETTINGS_CACHE_TTL) {
            return siteSettingsCache.data;
        }

        const response = await api.get<SiteSettings>('/api/settings/site');
        siteSettingsCache = { data: response.data, timestamp: now };
        return response.data;
    } catch (error) {
        console.error('❌ Failed to fetch site settings:', error);
        return siteSettingsCache.data || {};
    }
};

export const invalidateSiteSettingsCache = (): void => {
    siteSettingsCache = { data: null, timestamp: 0 };
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    try {
        await api.put('/api/settings/site', settings);
        siteSettingsCache = { data: { ...siteSettingsCache.data, ...settings }, timestamp: Date.now() };
    } catch (error: any) {
        console.error('❌ Failed to save site settings:', error);
        throw new Error(error.response?.data?.error || 'Failed to save settings');
    }
};

// ============================================
// FORM MANAGEMENT API
// ============================================

export interface FormSchema {
    id?: number;
    title: string;
    description?: string;
    category: string;
    schema: Record<string, any>;
    ui_schema?: Record<string, any>;
    is_active: boolean;
    created_by?: number;
    updated_by?: number;
    version?: number;
    tags?: string[];
    page_assignments?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface FormSubmission {
    id?: number;
    form_id: number;
    form_title: string;
    form_data: Record<string, any>;
    submitted_by?: number;
    status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
    reviewer?: number;
    reviewed_at?: string;
    review_notes?: string;
    metadata?: Record<string, any>;
    submitted_at?: string;
}

export interface FormCategory {
    id?: number;
    name: string;
    description?: string;
    sort_order: number;
    is_active: boolean;
}

export class FormManagementAPI {
    // ===== FORM SCHEMAS =====

    static async createFormSchema(
        formData: Omit<FormSchema, 'id' | 'created_at' | 'updated_at' | 'version'>
    ): Promise<number> {
        try {
            const response = await api.post<{ id: number }>('/api/forms/schemas', {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                schema: formData.schema,
                uiSchema: formData.ui_schema,
                tags: formData.tags,
                pageAssignments: formData.page_assignments,
            });
            return response.data.id;
        } catch (error: any) {
            console.error('❌ Create form schema error:', error);
            throw new Error(error.response?.data?.error || 'Failed to create form schema');
        }
    }

    static async updateFormSchema(
        formId: number,
        updates: Partial<FormSchema>
    ): Promise<void> {
        try {
            await api.put(`/api/forms/schemas/${formId}`, {
                title: updates.title,
                description: updates.description,
                category: updates.category,
                schema: updates.schema,
                uiSchema: updates.ui_schema,
                isActive: updates.is_active,
                tags: updates.tags,
                pageAssignments: updates.page_assignments,
            });
        } catch (error: any) {
            console.error('❌ Update form schema error:', error);
            throw new Error(error.response?.data?.error || 'Failed to update form schema');
        }
    }

    static async deleteFormSchema(formId: number): Promise<void> {
        try {
            await api.delete(`/api/forms/schemas/${formId}`);
        } catch (error: any) {
            console.error('❌ Delete form schema error:', error);
            throw new Error(error.response?.data?.error || 'Failed to delete form schema');
        }
    }

    static async getFormSchema(formId: number): Promise<FormSchema | null> {
        try {
            const response = await api.get<FormSchema>(`/api/forms/schemas/${formId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('❌ Get form schema error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get form schema');
        }
    }

    static async getAllFormSchemas(): Promise<FormSchema[]> {
        try {
            const response = await api.get<FormSchema[]>('/api/forms/schemas');
            return response.data;
        } catch (error: any) {
            console.error('❌ Get all form schemas error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get form schemas');
        }
    }

    static async getFormSchemasByCategory(category: string): Promise<FormSchema[]> {
        try {
            const response = await api.get<FormSchema[]>(`/api/forms/schemas?category=${encodeURIComponent(category)}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get form schemas by category error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get form schemas');
        }
    }

    static async getFormSchemasByPage(pageId: string): Promise<FormSchema[]> {
        try {
            const response = await api.get<FormSchema[]>(`/api/forms/schemas?pageId=${encodeURIComponent(pageId)}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get form schemas by page error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get form schemas');
        }
    }

    // ===== FORM SUBMISSIONS =====

    static async createFormSubmission(
        submissionData: Omit<FormSubmission, 'id' | 'submitted_at'>
    ): Promise<number> {
        try {
            const response = await api.post<{ id: number }>('/api/forms/submissions', {
                formId: submissionData.form_id,
                formTitle: submissionData.form_title,
                formData: submissionData.form_data,
                status: submissionData.status,
                metadata: submissionData.metadata,
            });
            return response.data.id;
        } catch (error: any) {
            console.error('❌ Create form submission error:', error);
            throw new Error(error.response?.data?.error || 'Failed to create submission');
        }
    }

    static async updateFormSubmission(
        submissionId: number,
        updates: Partial<FormSubmission>
    ): Promise<void> {
        try {
            await api.put(`/api/forms/submissions/${submissionId}`, {
                status: updates.status,
                reviewNotes: updates.review_notes,
            });
        } catch (error: any) {
            console.error('❌ Update form submission error:', error);
            throw new Error(error.response?.data?.error || 'Failed to update submission');
        }
    }

    static async getFormSubmissionsByForm(formId: number): Promise<FormSubmission[]> {
        try {
            const response = await api.get<FormSubmission[]>(`/api/forms/submissions?formId=${formId}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get form submissions error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get submissions');
        }
    }

    static async getUserFormSubmissions(): Promise<FormSubmission[]> {
        try {
            const response = await api.get<FormSubmission[]>('/api/forms/submissions');
            return response.data;
        } catch (error: any) {
            console.error('❌ Get user form submissions error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get submissions');
        }
    }

    // ===== FORM CATEGORIES =====

    static async createFormCategory(
        categoryData: Omit<FormCategory, 'id'>
    ): Promise<number> {
        try {
            const response = await api.post<{ id: number }>('/api/forms/categories', {
                name: categoryData.name,
                description: categoryData.description,
                order: categoryData.sort_order,
            });
            return response.data.id;
        } catch (error: any) {
            console.error('❌ Create form category error:', error);
            throw new Error(error.response?.data?.error || 'Failed to create category');
        }
    }

    static async getAllFormCategories(): Promise<FormCategory[]> {
        try {
            const response = await api.get<FormCategory[]>('/api/forms/categories');
            return response.data;
        } catch (error: any) {
            console.error('❌ Get all form categories error:', error);
            throw new Error(error.response?.data?.error || 'Failed to get categories');
        }
    }

    // ===== PAGE ASSIGNMENTS =====

    static async assignFormToPage(
        formId: number,
        pageId: string,
        _pageName: string
    ): Promise<void> {
        try {
            const form = await this.getFormSchema(formId);
            if (!form) throw new Error('Form not found');

            const currentAssignments = form.page_assignments || [];
            if (!currentAssignments.includes(pageId)) {
                await this.updateFormSchema(formId, {
                    page_assignments: [...currentAssignments, pageId],
                });
            }
        } catch (error: any) {
            console.error('❌ Assign form to page error:', error);
            throw new Error(error.message || 'Failed to assign form to page');
        }
    }

    static async removeFormFromPage(formId: number, pageId: string): Promise<void> {
        try {
            const form = await this.getFormSchema(formId);
            if (!form) throw new Error('Form not found');

            const currentAssignments = form.page_assignments || [];
            await this.updateFormSchema(formId, {
                page_assignments: currentAssignments.filter((id) => id !== pageId),
            });
        } catch (error: any) {
            console.error('❌ Remove form from page error:', error);
            throw new Error(error.message || 'Failed to remove form from page');
        }
    }
}

// ============================================
// CHAT LOGS API
// ============================================

export interface ChatLog {
    id: number;
    user_id?: number;
    email?: string;
    question: string;
    answer?: string;
    ip_address?: string;
    created_at: string;
}

export const getChatLogs = async (): Promise<ChatLog[]> => {
    try {
        const response = await api.get<ChatLog[]>('/api/qna');
        return response.data;
    } catch (error: any) {
        console.error('❌ Failed to fetch chat logs:', error);
        throw new Error(error.response?.data?.error || 'Failed to fetch chat logs');
    }
};

export default FormManagementAPI;
