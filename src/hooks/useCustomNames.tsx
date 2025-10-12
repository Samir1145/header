import { useState, useEffect, useCallback } from 'react';
import { 
  getCustomNames, 
  createCustomName, 
  updateCustomName, 
  deleteCustomName as deleteCustomNameAPI, 
  deleteAllCustomNames as deleteAllCustomNamesAPI,
  CustomName 
} from '../api/customNames';

export function useCustomNames() {
  const [customNames, setCustomNames] = useState<CustomName[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load custom names from database on mount
  useEffect(() => {
    const loadCustomNames = async () => {
      try {
        setLoading(true);
        setError(null);
        const names = await getCustomNames();
        setCustomNames(names);
      } catch (err) {
        console.error('Error loading custom names:', err);
        setError(err instanceof Error ? err.message : 'Failed to load custom names');
      } finally {
        setLoading(false);
      }
    };

    loadCustomNames();
  }, []);

  const getCustomName = useCallback((id: string): string | null => {
    const customName = customNames.find(item => item.id === id);
    return customName ? customName.customName : null;
  }, [customNames]);

  const setCustomName = useCallback(async (id: string, customName: string, type: 'form' | 'folder') => {
    try {
      setError(null);
      
      // Check if custom name already exists
      const existingCustomName = customNames.find(item => item.id === id);
      
      if (existingCustomName) {
        // Update existing custom name
        const updatedCustomName = await updateCustomName(id, { customName, type });
        setCustomNames(prev => 
          prev.map(item => item.id === id ? updatedCustomName : item)
        );
      } else {
        // Create new custom name
        const newCustomName = await createCustomName({ id, customName, type });
        setCustomNames(prev => [...prev, newCustomName]);
      }
    } catch (err) {
      console.error('Error setting custom name:', err);
      setError(err instanceof Error ? err.message : 'Failed to save custom name');
    }
  }, [customNames]);

  const removeCustomName = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteCustomNameAPI(id);
      setCustomNames(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error removing custom name:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove custom name');
    }
  }, []);

  const clearAllCustomNames = useCallback(async () => {
    try {
      setError(null);
      await deleteAllCustomNamesAPI();
      setCustomNames([]);
    } catch (err) {
      console.error('Error clearing all custom names:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear all custom names');
    }
  }, []);

  return {
    customNames,
    loading,
    error,
    getCustomName,
    setCustomName,
    removeCustomName,
    clearAllCustomNames
  };
}
