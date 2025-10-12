import { useState, useEffect, useCallback } from 'react';
import { FormManagementAPI, FormSchema, FormSubmission, FormCategory } from '@/api/formManagement';

export function useFormManagement() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [categories, setCategories] = useState<FormCategory[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      setError(null);
      const formsData = await FormManagementAPI.getAllFormSchemas();
      setForms(formsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      const categoriesData = await FormManagementAPI.getAllFormCategories();
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  }, []);

  const loadSubmissions = useCallback(async (formId?: string) => {
    try {
      setError(null);
      let submissionsData: FormSubmission[];
      
      if (formId) {
        submissionsData = await FormManagementAPI.getFormSubmissionsByForm(formId);
      } else {
        // Load all submissions (you might want to implement this in the API)
        submissionsData = [];
      }
      
      setSubmissions(submissionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    }
  }, []);

  const createForm = useCallback(async (formData: Omit<FormSchema, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'version'>) => {
    try {
      setError(null);
      const formId = await FormManagementAPI.createFormSchema(formData);
      await loadForms();
      return formId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
      throw err;
    }
  }, [loadForms]);

  const updateForm = useCallback(async (formId: string, updates: Partial<Omit<FormSchema, 'id' | 'createdAt' | 'createdBy' | 'version'>>) => {
    try {
      setError(null);
      await FormManagementAPI.updateFormSchema(formId, updates);
      await loadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update form');
      throw err;
    }
  }, [loadForms]);

  const deleteForm = useCallback(async (formId: string) => {
    try {
      setError(null);
      await FormManagementAPI.deleteFormSchema(formId);
      await loadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete form');
      throw err;
    }
  }, [loadForms]);

  const submitForm = useCallback(async (submissionData: Omit<FormSubmission, 'id' | 'submittedAt'>) => {
    try {
      setError(null);
      const submissionId = await FormManagementAPI.createFormSubmission(submissionData);
      return submissionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
      throw err;
    }
  }, []);

  const assignFormToPage = useCallback(async (formId: string, pageId: string, pageName: string) => {
    try {
      setError(null);
      await FormManagementAPI.assignFormToPage(formId, pageId, pageName);
      await loadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign form to page');
      throw err;
    }
  }, [loadForms]);

  const removeFormFromPage = useCallback(async (formId: string, pageId: string) => {
    try {
      setError(null);
      await FormManagementAPI.removeFormFromPage(formId, pageId);
      await loadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove form from page');
      throw err;
    }
  }, [loadForms]);

  const getFormById = useCallback((formId: string) => {
    return forms.find(form => form.id === formId);
  }, [forms]);

  const getFormsByCategory = useCallback((category: string) => {
    return forms.filter(form => form.category === category);
  }, [forms]);

  const getFormsByPage = useCallback((pageId: string) => {
    return forms.filter(form => form.pageAssignments?.includes(pageId));
  }, [forms]);

  const migrateExistingForms = useCallback(async () => {
    try {
      setError(null);
      await FormManagementAPI.migrateExistingFormsToFirebase();
      await loadForms();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to migrate forms');
      throw err;
    }
  }, [loadForms, loadCategories]);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadForms(),
        loadCategories()
      ]);
      setLoading(false);
    };

    loadAllData();
  }, [loadForms, loadCategories]);

  return {
    // Data
    forms,
    categories,
    submissions,
    loading,
    error,
    
    // Actions
    loadForms,
    loadCategories,
    loadSubmissions,
    createForm,
    updateForm,
    deleteForm,
    submitForm,
    assignFormToPage,
    removeFormFromPage,
    migrateExistingForms,
    
    // Helpers
    getFormById,
    getFormsByCategory,
    getFormsByPage,
    
    // State setters
    setError
  };
}

export default useFormManagement;
