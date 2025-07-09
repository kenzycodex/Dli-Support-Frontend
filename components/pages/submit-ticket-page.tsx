// components/pages/submit-ticket-page.tsx (Fixed TypeScript issues)
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Upload,
  X,
  FileText,
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import {
  useTicketStore,
  useTicketLoading,
  useTicketError,
  useTicketPermissions,
  CreateTicketRequest,
} from '@/stores/ticket-store';
import { ticketService } from '@/services/ticket.service';

interface SubmitTicketPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export function SubmitTicketPage({ onNavigate }: SubmitTicketPageProps) {
  // Zustand store hooks
  const store = useTicketStore();
  const loading = useTicketLoading('create');
  const error = useTicketError('create');
  const permissions = useTicketPermissions();

  // Form state - Fix: Initialize attachments as empty array instead of undefined
  const [formData, setFormData] = useState<CreateTicketRequest>({
    subject: '',
    category: '',
    priority: 'Medium',
    description: '',
    attachments: [], // Fixed: Initialize as empty array
  });
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Check permissions
  if (!permissions.can_create) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
              <p className="text-gray-600 mb-6">You do not have permission to create tickets.</p>
              <Button onClick={() => onNavigate('tickets')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get available categories based on user role
  const categories = useMemo(() => ticketService.getRoleCategories('student'), []);

  // Handle form input changes
  const handleInputChange = useCallback(
    (field: keyof CreateTicketRequest, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setLocalError(null);
      if (error) {
        store.actions.clearError('create');
      }
    },
    [error, store.actions]
  );

  // Handle file upload with enhanced validation
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // Clear previous errors
      setLocalError(null);
      if (error) {
        store.actions.clearError('create');
      }

      // Validate files using service
      const validation = ticketService.validateFiles(files, 5);
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '));
        return;
      }

      // Fix: Ensure attachments is always an array
      const currentAttachments = formData.attachments || [];

      // Check total attachments limit
      if (currentAttachments.length + files.length > 5) {
        setLocalError('Maximum 5 attachments allowed');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...currentAttachments, ...files], // Fixed: Use currentAttachments
      }));

      // Reset file input
      event.target.value = '';
    },
    [formData.attachments, error, store.actions]
  );

  // Remove file from attachments
  const removeFile = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index), // Fixed: Handle undefined
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      // Client-side validation using service
      const validation = ticketService.validateTicketData(formData);
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '));
        return;
      }

      try {
        const ticket = await store.actions.createTicket(formData);

        if (ticket) {
          setSuccess(true);
          setTimeout(() => {
            onNavigate('tickets');
          }, 2500);
        }
      } catch (err) {
        console.error('Failed to create ticket:', err);
        setLocalError('Failed to create ticket. Please try again.');
      }
    },
    [formData, store.actions, onNavigate]
  );

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      formData.subject.trim() &&
      formData.category &&
      formData.description.trim() &&
      formData.description.length >= 20
    );
  }, [formData.subject, formData.category, formData.description]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number) => {
    return ticketService.formatFileSize(bytes);
  }, []);

  // Detect crisis keywords and auto-set priority
  const handleDescriptionChange = useCallback(
    (value: string) => {
      handleInputChange('description', value);

      // Auto-detect crisis keywords and set urgent priority
      if (ticketService.detectCrisisKeywords(value) && formData.priority !== 'Urgent') {
        handleInputChange('priority', 'Urgent');
        handleInputChange('category', 'crisis');
      }
    },
    [formData.priority, handleInputChange]
  );

  // Success screen
  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('tickets')}
            className="hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Ticket Created Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your support request has been submitted and you will receive a confirmation email
                shortly.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
                <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    You'll receive a confirmation email with your ticket number
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    Our team will review and respond within 24 hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    You can track progress in your tickets dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mt-2"></span>
                    Crisis-related tickets are prioritized immediately
                  </li>
                </ul>
              </div>
              <Button
                onClick={() => onNavigate('tickets')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                View All Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Form screen
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate('tickets')}
          className="hover:bg-blue-50 w-fit"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tickets
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Support Ticket</h1>
          <p className="text-gray-600 mt-1">
            Describe your issue and we'll get back to you as soon as possible
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Ticket Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {(error || localError) && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || localError}</AlertDescription>
              </Alert>
            )}

            {/* Subject Field */}
            <div className="space-y-3">
              <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                Subject *
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                required
                disabled={loading}
                maxLength={255}
                className="h-11 text-base"
              />
              <div className="text-xs text-gray-500 text-right">{formData.subject.length}/255</div>
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category *
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{category.label}</span>
                          <span className="text-xs text-gray-500">{category.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Urgent') =>
                    handleInputChange('priority', value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="Medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="Urgent">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                className="min-h-[180px] text-base resize-y"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                required
                disabled={loading}
                maxLength={5000}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  Minimum 20 characters required
                  {formData.description.length >= 20 && (
                    <CheckCircle className="inline h-3 w-3 text-green-500 ml-1" />
                  )}
                </span>
                <span
                  className={formData.description.length < 20 ? 'text-red-500' : 'text-gray-500'}
                >
                  {formData.description.length}/5000
                </span>
              </div>
            </div>

            {/* Crisis Detection Alert */}
            {ticketService.detectCrisisKeywords(formData.description) && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Crisis Support Detected:</strong> Your message indicates you may need
                  immediate assistance. Your ticket has been automatically marked as urgent and will
                  be prioritized. If this is an emergency, please call our crisis hotline:{' '}
                  <strong>(555) 123-4567</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Attachments Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Attachments (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-gray-600 font-medium">Drag and drop files here</p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-2 hover:bg-blue-50 hover:border-blue-200"
                    disabled={loading || (formData.attachments || []).length >= 5} // Fixed: Handle undefined
                  >
                    Choose Files ({(formData.attachments || []).length}/5){' '}
                    {/* Fixed: Handle undefined */}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  PDF, PNG, JPG, DOC, TXT files up to 10MB each (Max 5 files)
                </p>
              </div>

              {/* Uploaded Files Display */}
              {formData.attachments &&
                formData.attachments.length > 0 && ( // Fixed: Check for undefined
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Uploaded Files ({formData.attachments.length}/5)
                    </Label>
                    <div className="space-y-2">
                      {formData.attachments.map(
                        (
                          file,
                          index // Fixed: Now safe to iterate
                        ) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              {ticketService.isImage(file.type) ? (
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                              ) : (
                                <FileText className="h-5 w-5 text-gray-500" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Help Information */}
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  You'll receive a confirmation email with your ticket number
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  Our team will review and respond within 24 hours
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  You can track progress in your dashboard
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                  Crisis-related tickets are prioritized immediately
                </li>
              </ul>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('tickets')}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
