// components/pages/submit-ticket-page.tsx (IMPROVED - Better UI consistency and success screen)
'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  Heart,
  Calendar,
  Clock,
  Shield,
  Star,
} from 'lucide-react';
import {
  useTicketStore,
  useTicketLoading,
  useTicketError,
  useTicketPermissions,
  CreateTicketRequest,
} from '@/stores/ticket-store';
import { ticketService } from '@/services/ticket.service';
import { authService } from '@/services/auth.service';

interface SubmitTicketPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export function SubmitTicketPage({ onNavigate }: SubmitTicketPageProps) {
  // FIXED: Get store actions properly
  const actions = useTicketStore(state => state?.actions);
  const loading = useTicketLoading('create');
  const error = useTicketError('create');
  const permissions = useTicketPermissions();

  // Form state - FIXED: Initialize attachments as empty array
  const [formData, setFormData] = useState<CreateTicketRequest>({
    subject: '',
    category: '',
    priority: 'Medium',
    description: '',
    attachments: [],
  });
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false); // FIXED: Local submitting state
  const [successCountdown, setSuccessCountdown] = useState(8); // IMPROVED: Longer countdown

  // Check permissions
  if (!permissions.can_create) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
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
      if (error && actions?.clearError) {
        actions.clearError('create');
      }
    },
    [error, actions]
  );

  // Handle file upload with enhanced validation
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // Clear previous errors
      setLocalError(null);
      if (error && actions?.clearError) {
        actions.clearError('create');
      }

      // Validate files using service
      const validation = ticketService.validateFiles(files, 5);
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '));
        return;
      }

      // FIXED: Ensure attachments is always an array
      const currentAttachments = formData.attachments || [];

      // Check total attachments limit
      if (currentAttachments.length + files.length > 5) {
        setLocalError('Maximum 5 attachments allowed');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...currentAttachments, ...files],
      }));

      // Reset file input
      event.target.value = '';
    },
    [formData.attachments, error, actions]
  );

  // Remove file from attachments
  const removeFile = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  }, []);

  // IMPROVED: Success screen countdown effect
  useEffect(() => {
    if (success && successCountdown > 0) {
      const timer = setTimeout(() => {
        setSuccessCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && successCountdown === 0) {
      onNavigate('tickets');
    }
  }, [success, successCountdown, onNavigate]);

  // FIXED: Enhanced form submission with comprehensive error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Prevent double submission
      if (submitting || loading) return;
      
      setLocalError(null);
      setSubmitting(true);

      if (!actions?.createTicket) {
        setLocalError('System not ready. Please try again.');
        setSubmitting(false);
        return;
      }

      // FIXED: Enhanced validation
      const validation = ticketService.validateTicketData(formData);
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '));
        setSubmitting(false);
        return;
      }

      // Validate files if present
      if (formData.attachments && formData.attachments.length > 0) {
        const fileValidation = ticketService.validateFiles(formData.attachments, 5);
        if (!fileValidation.valid) {
          setLocalError(fileValidation.errors.join(', '));
          setSubmitting(false);
          return;
        }
      }

      try {
        console.log('🎫 SubmitTicketPage: Creating ticket with data:', formData);
        
        // FIXED: Clear any existing errors before submission
        if (actions.clearError) {
          actions.clearError('create');
        }
        
        // Create the ticket
        const result = await actions.createTicket(formData);

        // FIXED: Better success/error detection
        const currentError = useTicketStore.getState().errors.create;
        
        if (result && !currentError) {
          console.log('✅ SubmitTicketPage: Ticket created successfully:', result);
          setSuccess(true);
          setSuccessCountdown(10); // IMPROVED: Start 10-second countdown
        } else {
          // Handle submission errors
          const errorMessage = currentError || 'Failed to create ticket. Please check all fields and try again.';
          console.error('❌ SubmitTicketPage: Ticket creation failed:', errorMessage);
          setLocalError(errorMessage);
        }
      } catch (err: any) {
        console.error('❌ SubmitTicketPage: Exception during ticket creation:', err);
        setLocalError(err.message || 'An unexpected error occurred. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [formData, actions, onNavigate, submitting, loading]
  );

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      formData.subject.trim().length > 0 &&
      formData.category &&
      formData.description.trim().length >= 20 &&
      formData.description.trim().length <= 5000
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

  // IMPROVED: Enhanced success screen with better design and countdown
  if (success) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
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

        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/50">
          <CardContent className="p-12">
            <div className="text-center max-w-2xl mx-auto">
              {/* Success Animation */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <Star className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Success Message */}
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Ticket Created Successfully!
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Your support request has been submitted and you will receive a confirmation email
                shortly. Our team is ready to help you!
              </p>

              {/* Key Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
                  <p className="text-sm text-gray-600">Our team responds within 24 hours</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
                  <p className="text-sm text-gray-600">Your information is completely confidential</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Heart className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">24/7 Support</h3>
                  <p className="text-sm text-gray-600">Crisis support available anytime</p>
                </div>
              </div>

              {/* What's Next Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8 text-left">
                <h3 className="font-semibold text-green-800 mb-4 text-center">What happens next?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Email Confirmation</p>
                      <p className="text-sm text-green-700">You'll receive a confirmation email with your ticket number</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Team Review</p>
                      <p className="text-sm text-green-700">Our counselors will review and prioritize your request</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Personalized Response</p>
                      <p className="text-sm text-green-700">You'll receive a detailed response within 24 hours</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-800">Ongoing Support</p>
                      <p className="text-sm text-green-700">Continue the conversation until your issue is resolved</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-redirect notice with countdown */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  Redirecting to your tickets dashboard in {successCountdown} seconds...
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((8 - successCountdown) / 8) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => onNavigate('tickets')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  size="lg"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  View All Tickets
                </Button>
                <Button
                  onClick={() => onNavigate('submit-ticket')}
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  size="lg"
                >
                  Submit Another Ticket
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // IMPROVED: Form screen with consistent spacing (matching ticket-details-page)
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => onNavigate('tickets')}
          className="hover:bg-blue-50 w-fit"
          disabled={submitting}
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
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-6 py-4">
          <CardTitle className="text-lg font-semibold text-gray-800">Ticket Information</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {(error || localError) && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || localError}
                </AlertDescription>
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
                disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                disabled={submitting}
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
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-2 hover:bg-blue-50 hover:border-blue-200"
                    disabled={submitting || (formData.attachments || []).length >= 5}
                  >
                    Choose Files ({(formData.attachments || []).length}/5)
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  PDF, PNG, JPG, DOC, TXT files up to 10MB each (Max 5 files)
                </p>
              </div>

              {/* Uploaded Files Display */}
              {formData.attachments &&
                formData.attachments.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Uploaded Files ({formData.attachments.length}/5)
                    </Label>
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
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
                            disabled={submitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
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
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || submitting}
                className={`w-full sm:w-auto transition-all duration-200 ${
                  submitting 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="animate-pulse">Creating Ticket...</span>
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