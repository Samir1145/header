import React, { useState, useEffect } from 'react';
import { FormManagementAPI, FormSchema } from '@/api/sqliteApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import Checkbox from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Plus, Settings, Link, Unlink } from 'lucide-react';

interface PageAssignmentManagerProps {
  onAssignmentChange?: () => void;
}

interface Page {
  id: string;
  name: string;
  path: string;
  description?: string;
}

// Define available pages in your application
const AVAILABLE_PAGES: Page[] = [
  { id: 'home', name: 'Home', path: '/', description: 'Main landing page' },
  { id: 'forms', name: 'Forms', path: '/forms', description: 'Form builder page' },
  { id: 'appeals', name: 'Appeals', path: '/appeals', description: 'Appeals management' },
  { id: 'resources', name: 'Resources', path: '/resources', description: 'Resource center' },
  { id: 'agents', name: 'Agents', path: '/agents', description: 'Agent management' },
  { id: 'access', name: 'Access', path: '/access', description: 'Access control' },
  { id: 'chat-logs', name: 'Chat Logs', path: '/chat-logs', description: 'Chat log viewer' },
  { id: 'api-site', name: 'API Site', path: '/api-site', description: 'API documentation' },
];

export default function PageAssignmentManager({ onAssignmentChange }: PageAssignmentManagerProps) {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormSchema | null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const formsData = await FormManagementAPI.getAllFormSchemas();
      setForms(formsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignForm = (form: FormSchema) => {
    setSelectedForm(form);
    setSelectedPages(form.pageAssignments || []);
    setIsAssignDialogOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedForm) return;

    try {
      setError(null);
      
      // Get current assignments
      const currentAssignments = selectedForm.pageAssignments || [];
      
      // Find pages to add and remove
      const pagesToAdd = selectedPages.filter(pageId => !currentAssignments.includes(pageId));
      const pagesToRemove = currentAssignments.filter(pageId => !selectedPages.includes(pageId));

      // Add new assignments
      for (const pageId of pagesToAdd) {
        const page = AVAILABLE_PAGES.find(p => p.id === pageId);
        if (page) {
          await FormManagementAPI.assignFormToPage(selectedForm.id!, pageId, page.name);
        }
      }

      // Remove old assignments
      for (const pageId of pagesToRemove) {
        await FormManagementAPI.removeFormFromPage(selectedForm.id!, pageId);
      }

      setSuccess('Form assignments updated successfully!');
      setIsAssignDialogOpen(false);
      setSelectedForm(null);
      setSelectedPages([]);
      loadForms();
      onAssignmentChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignments');
    }
  };

  const getPageName = (pageId: string) => {
    return AVAILABLE_PAGES.find(p => p.id === pageId)?.name || pageId;
  };

  const getPageDescription = (pageId: string) => {
    return AVAILABLE_PAGES.find(p => p.id === pageId)?.description || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading forms...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Page Assignment Manager</h1>
          <p className="text-muted-foreground">Assign forms to different pages in your application</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{form.title}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAssignForm(form)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Assign
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{form.category}</Badge>
                  <Badge variant={form.isActive ? "default" : "secondary"}>
                    {form.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Assigned Pages:</Label>
                  {form.pageAssignments && form.pageAssignments.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {form.pageAssignments.map((pageId) => (
                        <div key={pageId} className="flex items-center gap-2">
                          <Link className="h-3 w-3 text-green-600" />
                          <span className="text-sm">{getPageName(pageId)}</span>
                          <Badge variant="outline" className="text-xs">
                            {pageId}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Unlink className="h-3 w-3" />
                      <span>No pages assigned</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Form to Pages</DialogTitle>
            <DialogDescription>
              Select which pages should display the form "{selectedForm?.title}".
            </DialogDescription>
          </DialogHeader>
          
          {selectedForm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Available Pages:</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {AVAILABLE_PAGES.map((page) => (
                    <div key={page.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        id={page.id}
                        checked={selectedPages.includes(page.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPages([...selectedPages, page.id]);
                          } else {
                            setSelectedPages(selectedPages.filter(id => id !== page.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={page.id} className="font-medium">
                          {page.name}
                        </Label>
                        <div className="text-sm text-muted-foreground">
                          {page.description}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {page.path}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAssignDialogOpen(false);
                    setSelectedForm(null);
                    setSelectedPages([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAssignment}>
                  Save Assignments
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
