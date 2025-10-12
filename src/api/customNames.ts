import axios from 'axios';
import { backendFreeBaseUrl2, getTokenForServer } from '@/lib/constants';
import { useSettingsStore } from '@/stores/settings';

// Types for custom names
export interface CustomName {
  id: string;
  customName: string;
  type: 'form' | 'folder';
  created_at?: string;
  updated_at?: string;
}

export interface CustomNameResponse {
  success: boolean;
  data?: CustomName | CustomName[];
  message?: string;
}

// Get axios instance with proper configuration
const getAxiosInstance = () => {
  const instance = axios.create({
    baseURL: backendFreeBaseUrl2,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Source': 'vite'
    }
  });

  // Add interceptors for authentication and API key
  instance.interceptors.request.use(async (config) => {
    const apiKey = useSettingsStore.getState().apiKey;
    const token = await getTokenForServer(backendFreeBaseUrl2);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }

    return config;
  });

  return instance;
};

/**
 * Get all custom names from the database
 * @returns Promise<CustomName[]> - Array of all custom names
 */
export const getCustomNames = async (): Promise<CustomName[]> => {
  try {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get('/api/custom-names');
    
    if (response.data.success) {
      return response.data.data || [];
    }
    
    throw new Error(response.data.message || 'Failed to fetch custom names');
  } catch (error) {
    console.error('Error fetching custom names:', error);
    
    // Fallback to localStorage if database fails
    const fallbackData = localStorage.getItem('formCustomNames');
    if (fallbackData) {
      try {
        return JSON.parse(fallbackData);
      } catch (parseError) {
        console.error('Error parsing fallback data:', parseError);
      }
    }
    
    return [];
  }
};

/**
 * Create a new custom name
 * @param customName - The custom name data
 * @returns Promise<CustomName> - The created custom name
 */
export const createCustomName = async (customName: Omit<CustomName, 'created_at' | 'updated_at'>): Promise<CustomName> => {
  try {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.post('/api/custom-names', customName);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to create custom name');
  } catch (error) {
    console.error('Error creating custom name:', error);
    
    // Fallback to localStorage if database fails
    const newCustomName: CustomName = {
      ...customName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const existingData = localStorage.getItem('formCustomNames');
    const customNames = existingData ? JSON.parse(existingData) : [];
    customNames.push(newCustomName);
    localStorage.setItem('formCustomNames', JSON.stringify(customNames));
    
    return newCustomName;
  }
};

/**
 * Update an existing custom name
 * @param id - The ID of the custom name to update
 * @param customName - The updated custom name data
 * @returns Promise<CustomName> - The updated custom name
 */
export const updateCustomName = async (id: string, customName: Partial<Omit<CustomName, 'id' | 'created_at' | 'updated_at'>>): Promise<CustomName> => {
  try {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.put(`/api/custom-names/${id}`, customName);
    
    if (response.data.success) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to update custom name');
  } catch (error) {
    console.error('Error updating custom name:', error);
    
    // Fallback to localStorage if database fails
    const existingData = localStorage.getItem('formCustomNames');
    const customNames: CustomName[] = existingData ? JSON.parse(existingData) : [];
    
    const updatedCustomNames = customNames.map(item => 
      item.id === id 
        ? { ...item, ...customName, updated_at: new Date().toISOString() }
        : item
    );
    
    localStorage.setItem('formCustomNames', JSON.stringify(updatedCustomNames));
    
    const updatedItem = updatedCustomNames.find(item => item.id === id);
    if (!updatedItem) {
      throw new Error('Custom name not found');
    }
    
    return updatedItem;
  }
};

/**
 * Delete a custom name
 * @param id - The ID of the custom name to delete
 * @returns Promise<boolean> - True if deletion was successful
 */
export const deleteCustomName = async (id: string): Promise<boolean> => {
  try {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.delete(`/api/custom-names/${id}`);
    
    if (response.data.success) {
      return true;
    }
    
    throw new Error(response.data.message || 'Failed to delete custom name');
  } catch (error) {
    console.error('Error deleting custom name:', error);
    
    // Fallback to localStorage if database fails
    const existingData = localStorage.getItem('formCustomNames');
    const customNames: CustomName[] = existingData ? JSON.parse(existingData) : [];
    
    const filteredCustomNames = customNames.filter(item => item.id !== id);
    localStorage.setItem('formCustomNames', JSON.stringify(filteredCustomNames));
    
    return true;
  }
};

/**
 * Delete all custom names
 * @returns Promise<boolean> - True if deletion was successful
 */
export const deleteAllCustomNames = async (): Promise<boolean> => {
  try {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.delete('/api/custom-names');
    
    if (response.data.success) {
      return true;
    }
    
    throw new Error(response.data.message || 'Failed to delete all custom names');
  } catch (error) {
    console.error('Error deleting all custom names:', error);
    
    // Fallback to localStorage if database fails
    localStorage.removeItem('formCustomNames');
    
    return true;
  }
};

/**
 * Sync localStorage data to database (useful for migration)
 * @returns Promise<boolean> - True if sync was successful
 */
export const syncCustomNamesToDatabase = async (): Promise<boolean> => {
  try {
    const localData = localStorage.getItem('formCustomNames');
    if (!localData) {
      return true; // Nothing to sync
    }
    
    const customNames: CustomName[] = JSON.parse(localData);
    
    // Upload each custom name to database
    for (const customName of customNames) {
      await createCustomName(customName);
    }
    
    // Clear localStorage after successful sync
    localStorage.removeItem('formCustomNames');
    
    return true;
  } catch (error) {
    console.error('Error syncing custom names to database:', error);
    return false;
  }
};
