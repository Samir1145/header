import React, { useState, useEffect } from 'react';
import { FormManagementAPI, FormSubmission, FormSchema } from '@/api/sqliteApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Loader2, Eye, Download, Filter, Search } from 'lucide-react';

interface FormSubmissionViewerProps {
  formId?: string;
  onSubmissionSelect?: (submission: FormSubmission) => void;
}

export default function FormSubmissionViewer({ formId, onSubmissionSelect }: FormSubmissionViewerProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formFilter, setFormFilter] = useState<string>(formId || 'all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [formId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [submissionsData, formsData] = await Promise.all([
        formId ? FormManagementAPI.getFormSubmissionsByForm(formId) : Promise.resolve([]),
        FormManagementAPI.getAllFormSchemas()
      ]);
      
      setSubmissions(submissionsData);
      setForms(formsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesForm = formFilter === 'all' || submission.formId === formFilter;
    const matchesSearch = searchTerm === '' || 
      submission.formTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.formId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesForm && matchesSearch;
  });

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setIsViewDialogOpen(true);
    onSubmissionSelect?.(submission);
  };

  const handleExportSubmission = (submission: FormSubmission) => {
    const dataStr = JSON.stringify(submission, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `submission-${submission.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'default';
      case 'reviewed': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'draft': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getFormTitle = (formId: string) => {
    return forms.find(form => form.id === formId)?.title || formId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading submissions...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Form Submissions</h1>
          <p className="text-muted-foreground">View and manage form submissions</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by form title or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="w-48">
          <Label htmlFor="status-filter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!formId && (
          <div className="w-48">
            <Label htmlFor="form-filter">Form</Label>
            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id!}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No submissions found matching your criteria.</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{submission.formTitle}</CardTitle>
                    <CardDescription>
                      Submitted on {formatDate(submission.submittedAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewSubmission(submission)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportSubmission(submission)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Form ID: {submission.formId}
                  </div>
                  {submission.reviewer && (
                    <div className="text-sm text-muted-foreground">
                      Reviewed by: {submission.reviewer}
                    </div>
                  )}
                  {submission.reviewNotes && (
                    <div className="text-sm">
                      <strong>Review Notes:</strong> {submission.reviewNotes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Submission Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              View the complete submission data for {selectedSubmission?.formTitle}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Form Title</Label>
                  <p className="text-sm">{selectedSubmission.formTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusColor(selectedSubmission.status)}>
                    {selectedSubmission.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted At</Label>
                  <p className="text-sm">{formatDate(selectedSubmission.submittedAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Submitted By</Label>
                  <p className="text-sm">{selectedSubmission.submittedBy}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Form Data</Label>
                <pre className="mt-2 p-4 bg-muted rounded-md text-sm overflow-x-auto">
                  {JSON.stringify(selectedSubmission.formData, null, 2)}
                </pre>
              </div>

              {selectedSubmission.metadata && (
                <div>
                  <Label className="text-sm font-medium">Metadata</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedSubmission.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExportSubmission(selectedSubmission)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
