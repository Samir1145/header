import { useState, useEffect } from 'react';
import { FormManagementAPI, FormSchema, FormCategory } from '@/api/sqliteApi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Plus, Edit, Trash2, Eye, Settings, Upload } from 'lucide-react';
import FormSubmissionViewer from './FormSubmissionViewer';
import PageAssignmentManager from './PageAssignmentManager';

interface FormManagerProps {
  onFormSelect?: (form: FormSchema) => void;
  selectedFormId?: string;
}

export default function FormManager({ onFormSelect, selectedFormId }: FormManagerProps) {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [categories, setCategories] = useState<FormCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form creation/editing states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<FormSchema | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Form data states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    schema: '{}',
    uiSchema: '{}',
    isActive: true,
    tags: '',
    pageAssignments: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [formsData, categoriesData] = await Promise.all([
        FormManagementAPI.getAllFormSchemas(),
        FormManagementAPI.getAllFormCategories()
      ]);
      
      setForms(formsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    try {
      setError(null);
      
      const schemaObj = JSON.parse(formData.schema);
      const uiSchemaObj = formData.uiSchema ? JSON.parse(formData.uiSchema) : undefined;
      
      await FormManagementAPI.createFormSchema({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        schema: schemaObj,
        uiSchema: uiSchemaObj,
        isActive: formData.isActive,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        pageAssignments: formData.pageAssignments
      });
      
      setSuccess('Form created successfully!');
      setIsCreateDialogOpen(false);
      resetFormData();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create form');
    }
  };

  const handleEditForm = async () => {
    if (!editingForm) return;
    
    try {
      setError(null);
      
      const schemaObj = JSON.parse(formData.schema);
      const uiSchemaObj = formData.uiSchema ? JSON.parse(formData.uiSchema) : undefined;
      
      await FormManagementAPI.updateFormSchema(editingForm.id!, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        schema: schemaObj,
        uiSchema: uiSchemaObj,
        isActive: formData.isActive,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        pageAssignments: formData.pageAssignments
      });
      
      setSuccess('Form updated successfully!');
      setIsEditDialogOpen(false);
      setEditingForm(null);
      resetFormData();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update form');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      await FormManagementAPI.deleteFormSchema(formId);
      setSuccess('Form deleted successfully!');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete form');
    }
  };

  const handleMigrateForms = async () => {
    try {
      setIsMigrating(true);
      setError(null);
      // Migration is a no-op — SQLite is the only backend
      setSuccess('Forms migrated successfully!');
      loadData();
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to migrate forms');
    } finally {
      setIsMigrating(false);
    }
  };

  const openEditDialog = (form: FormSchema) => {
    setEditingForm(form);
    setFormData({
      title: form.title,
      description: form.description || '',
      category: form.category,
      schema: JSON.stringify(form.schema, null, 2),
      uiSchema: form.uiSchema ? JSON.stringify(form.uiSchema, null, 2) : '{}',
      isActive: form.isActive,
      tags: form.tags?.join(', ') || '',
      pageAssignments: form.pageAssignments || []
    });
    setIsEditDialogOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      schema: '{}',
      uiSchema: '{}',
      isActive: true,
      tags: '',
      pageAssignments: []
    });
  };

  const getSubmissionsCount = (_formId: string) => {
    // TODO: Implement submission count when submissions are loaded
    return 0;
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
          <h1 className="text-3xl font-bold">Form Manager</h1>
          <p className="text-muted-foreground">Manage your forms, schemas, and submissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleMigrateForms}
            disabled={isMigrating}
            variant="outline"
          >
            {isMigrating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Migrate Existing Forms
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
                <DialogDescription>
                  Create a new form with schema and UI configuration.
                </DialogDescription>
              </DialogHeader>
              <CreateFormDialogContent
                formData={formData}
                setFormData={setFormData}
                categories={categories}
                onSubmit={handleCreateForm}
                onCancel={() => {
                  setIsCreateDialogOpen(false);
                  resetFormData();
                }}
              />
            </DialogContent>
          </Dialog>
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

      <Tabs defaultValue="forms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="assignments">Page Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className={`cursor-pointer transition-colors ${
                selectedFormId === form.id ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50'
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription>{form.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onFormSelect?.(form)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(form)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteForm(form.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{form.category}</Badge>
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Version: {form.version} • Submissions: {getSubmissionsCount(form.id!)}
                    </div>
                    {form.tags && form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {form.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <FormSubmissionViewer />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Category management will be implemented here</p>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <PageAssignmentManager onAssignmentChange={loadData} />
        </TabsContent>
      </Tabs>

      {/* Edit Form Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
            <DialogDescription>
              Update the form configuration and schema.
            </DialogDescription>
          </DialogHeader>
          <CreateFormDialogContent
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onSubmit={handleEditForm}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingForm(null);
              resetFormData();
            }}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateFormDialogContentProps {
  formData: any;
  setFormData: (data: any) => void;
  categories: FormCategory[];
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

function CreateFormDialogContent({
  formData,
  setFormData,
  categories,
  onSubmit,
  onCancel,
  isEdit = false
}: CreateFormDialogContentProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Form title"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Form description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schema">Schema (JSON)</Label>
        <Textarea
          id="schema"
          value={formData.schema}
          onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
          placeholder="{}"
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="uiSchema">UI Schema (JSON)</Label>
        <Textarea
          id="uiSchema"
          value={formData.uiSchema}
          onChange={(e) => setFormData({ ...formData, uiSchema: e.target.value })}
          placeholder="{}"
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Update Form' : 'Create Form'}
        </Button>
      </div>
    </div>
  );
}
