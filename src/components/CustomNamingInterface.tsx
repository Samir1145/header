import { useState, useEffect } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Separator from './ui/Separator';
import { Edit2, Save, X, Plus, Folder, FileText } from 'lucide-react';
import { useCustomNames } from '../hooks/useCustomNames';

interface CustomNamingInterfaceProps {
  formsTree: any[];
  onCustomNamesChange: (customNames: any[]) => void;
}

export default function CustomNamingInterface({ 
  formsTree, 
  onCustomNamesChange 
}: CustomNamingInterfaceProps) {
  const { customNames, loading, error, setCustomName, removeCustomName, clearAllCustomNames } = useCustomNames();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'form' | 'folder'>('form');
  const [newItemId, setNewItemId] = useState<string>('');
  const [newItemName, setNewItemName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Notify parent when custom names change
  useEffect(() => {
    onCustomNamesChange(customNames);
  }, [customNames, onCustomNamesChange]);

  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingValue(currentName);
  };

  const saveEdit = async () => {
    if (editingId && editingValue.trim()) {
      try {
        setIsSubmitting(true);
        // Find the existing custom name to get its type
        const existingCustomName = customNames.find(item => item.id === editingId);
        const type = existingCustomName ? existingCustomName.type : 'form';
        await setCustomName(editingId, editingValue.trim(), type);
        setEditingId(null);
        setEditingValue('');
      } catch (err) {
        console.error('Error saving edit:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue('');
  };

  const deleteCustomName = async (id: string) => {
    try {
      setIsSubmitting(true);
      await removeCustomName(id);
    } catch (err) {
      console.error('Error deleting custom name:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCustomName = async () => {
    if (newItemId.trim() && newItemName.trim()) {
      try {
        setIsSubmitting(true);
        // Check if this ID already exists
        if (!customNames.find(item => item.id === newItemId.trim())) {
          await setCustomName(newItemId.trim(), newItemName.trim(), newItemType);
          setNewItemId('');
          setNewItemName('');
        } else {
          alert('A custom name for this ID already exists!');
        }
      } catch (err) {
        console.error('Error adding custom name:', err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert('Please select an item and enter a custom name!');
    }
  };

  const resetToDefaults = async () => {
    if (confirm('Are you sure you want to reset all custom names to defaults?')) {
      try {
        setIsSubmitting(true);
        await clearAllCustomNames();
      } catch (err) {
        console.error('Error resetting custom names:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Extract all form and folder IDs from the tree for suggestions
  const getAllIds = (tree: any[]): { id: string; type: 'form' | 'folder'; originalName: string }[] => {
    const ids: { id: string; type: 'form' | 'folder'; originalName: string }[] = [];
    
    tree.forEach(node => {
      if (node.type === 'folder') {
        ids.push({ id: node.title, type: 'folder', originalName: node.title });
        if (node.children) {
          node.children.forEach((child: any) => {
            if (child.type === 'form') {
              ids.push({ id: child.id, type: 'form', originalName: child.title });
            }
          });
        }
      } else if (node.type === 'form') {
        ids.push({ id: node.id, type: 'form', originalName: node.title });
      }
    });
    
    return ids;
  };

  const allIds = getAllIds(formsTree);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit2 className="h-5 w-5" />
          Custom Form & Folder Names
        </CardTitle>
        <p className="text-sm text-gray-600">
          Customize the display names for your forms and folders. Changes are saved to the database automatically.
        </p>
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Custom Name */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add Custom Name</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                id="itemType"
                value={newItemType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItemType(e.target.value as 'form' | 'folder')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="form">Form</option>
                <option value="folder">Folder</option>
              </select>
            </div>
            <div>
              <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <select
                id="itemId"
                value={newItemId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItemId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select {newItemType}...</option>
                {allIds
                  .filter(item => item.type === newItemType)
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.originalName} ({item.id})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="customName" className="block text-sm font-medium text-gray-700 mb-1">Custom Name</label>
              <Input
                id="customName"
                value={newItemName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemName(e.target.value)}
                placeholder="Enter custom name..."
                className="w-full"
              />
            </div>
            <div>
              <Button 
                onClick={addCustomName} 
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={!newItemId.trim() || !newItemName.trim() || isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Name
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Existing Custom Names */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Custom Names</h3>
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="border-red-300 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-400"
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Resetting...
                </>
              ) : (
                'Reset All'
              )}
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium mb-2">Loading custom names...</p>
              <p className="text-sm">Fetching data from database</p>
            </div>
          ) : customNames.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No custom names set yet</p>
              <p className="text-sm">Add some above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customNames.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0 flex-shrink-0">
                    {item.type === 'folder' ? (
                      <Folder className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-green-500" />
                    )}
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{item.id}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingValue}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValue(e.target.value)}
                          className="flex-1"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          onClick={saveEdit}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelEdit}
                          className="border-gray-300 hover:bg-gray-50"
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">{item.customName}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(item.id, item.customName)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          disabled={isSubmitting}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCustomName(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
