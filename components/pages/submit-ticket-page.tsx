// components/pages/submit-ticket-page.tsx - FINAL FIXED VERSION

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
  Calendar,
  Shield,
  Star,
  Flag,
  AlertTriangle,
  Phone,
  Paperclip,
} from 'lucide-react';

import { useTicketStore, CreateTicketRequest } from '@/stores/ticket-store';
import { ticketService } from '@/services/ticket.service';
import { authService } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface SubmitTicketPageProps {
  onNavigate: (page: string, params?: any) => void;
}

// FIXED: Proper category interface
interface CategoryOption {
  id: number;
  name: string;
  description: string;
  color: string;
  slaHours?: number;
  crisisDetection?: boolean;
  autoAssign?: boolean;
}

export function SubmitTicketPage({ onNavigate }: SubmitTicketPageProps) {
  const { toast } = useToast();

  // FIXED: Form state with proper typing
  const [formData, setFormData] = useState<CreateTicketRequest>({
    subject: '',
    category_id: 0,
    priority: 'Medium',
    description: '',
    attachments: [],
  });
  
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(8);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption | null>(null);
  const [availableCategories, setAvailableCategories] = useState<CategoryOption[]>([]);

  // FIXED: Current user with proper memoization
  const currentUser = useMemo(() => authService.getStoredUser(), []);

  // FIXED: Check permissions
  const canCreateTickets = useMemo(() => {
    return currentUser?.role === 'student' || currentUser?.role === 'admin';
  }, [currentUser?.role]);

  // Load categories from store
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('🔄 Loading categories from store...');
        
        const ticketStore = useTicketStore.getState();
        if (ticketStore?.actions?.fetchCategories) {
          await ticketStore.actions.fetchCategories();
          
          const storeCategories = ticketStore.categories;
          if (storeCategories && storeCategories.length > 0) {
            const processedCategories: CategoryOption[] = storeCategories
              .filter(c => c.is_active)
              .map(c => ({
                id: c.id,
                name: c.name,
                description: c.description || 'No description available',
                color: c.color,
                slaHours: c.sla_response_hours,
                crisisDetection: c.crisis_detection_enabled,
                autoAssign: c.auto_assign,
              }));
            
            console.log('✅ Successfully loaded categories from store:', processedCategories.length);
            setAvailableCategories(processedCategories);
          } else {
            console.warn('⚠️ No active categories found in store');
            setAvailableCategories([]);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load categories from store:', error);
        setAvailableCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Access denied check
  if (!canCreateTickets) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="w-full max-w-2xl mx-auto pt-8">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
                <p className="text-gray-600 mb-6">You do not have permission to create tickets.</p>
                <Button onClick={() => onNavigate('tickets')} className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Handle form input changes
  const handleInputChange = useCallback(
    (field: keyof CreateTicketRequest, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setLocalError(null);

      // Handle category selection
      if (field === 'category_id') {
        const category = availableCategories.find(c => c.id === value);
        setSelectedCategory(category || null);
        
        if (category?.crisisDetection && formData.description) {
          checkCrisisDetection(formData.description);
        }
      }
    },
    [availableCategories, formData.description]
  );

  // Crisis detection check
  const checkCrisisDetection = useCallback((text: string) => {
    const detected = ticketService.detectCrisisKeywords(text);
    setCrisisDetected(detected);
    
    if (detected) {
      // Auto-set urgent priority and select crisis category if available
      if (formData.priority !== 'Urgent') {
        setFormData(prev => ({ ...prev, priority: 'Urgent' }));
      }
      
      // Find crisis-enabled category if none selected
      if (!selectedCategory?.crisisDetection) {
        const crisisCategory = availableCategories.find(c => 
          c.name.toLowerCase().includes('crisis') || 
          c.name.toLowerCase().includes('mental') ||
          c.crisisDetection
        );
        if (crisisCategory) {
          setFormData(prev => ({ ...prev, category_id: crisisCategory.id }));
          setSelectedCategory(crisisCategory);
        }
      }
    }
  }, [formData.priority, selectedCategory, availableCategories]);

  // Handle description change with crisis detection
  const handleDescriptionChange = useCallback(
    (value: string) => {
      handleInputChange('description', value);
      checkCrisisDetection(value);
    },
    [handleInputChange, checkCrisisDetection]
  );

  // Handle file upload with enhanced validation
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      setLocalError(null);

      // Validate files using service
      const validation = ticketService.validateFiles(files, 5);
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '));
        return;
      }

      const currentAttachments = formData.attachments || [];
      if (currentAttachments.length + files.length > 5) {
        setLocalError('Maximum 5 attachments allowed');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...currentAttachments, ...files],
      }));

      event.target.value = '';
    },
    [formData.attachments]
  );

  // Remove file from attachments
  const removeFile = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((_, i) => i !== index),
    }));
  }, []);

  // Success screen countdown effect
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

  // CRITICAL FIX: Enhanced form submission with proper data structure
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (submitting) return;
      
      setLocalError(null);
      setSubmitting(true);

      // FIXED: Enhanced validation
      if (!formData.category_id || formData.category_id === 0) {
        setLocalError('Please select a category');
        setSubmitting(false);
        return;
      }

      // FIXED: Validate category exists in our available list
      const categoryExists = availableCategories.find(c => c.id === formData.category_id);
      if (!categoryExists) {
        setLocalError('Selected category is not valid. Please choose another category.');
        setSubmitting(false);
        return;
      }

      const validation = ticketService.validateTicketData(formData);
      if (!validation.valid) {
        setLocalError(validation.errors.join(', '));
        setSubmitting(false);
        return;
      }

      if (formData.attachments && formData.attachments.length > 0) {
        const fileValidation = ticketService.validateFiles(formData.attachments, 5);
        if (!fileValidation.valid) {
          setLocalError(fileValidation.errors.join(', '));
          setSubmitting(false);
          return;
        }
      }

      try {
        console.log('🎫 SubmitTicket: Creating ticket with data:', {
          ...formData,
          categoryName: categoryExists.name
        });
        
        // CRITICAL FIX: Send clean JSON data structure
        const ticketPayload = {
          subject: formData.subject.trim(),
          description: formData.description.trim(),
          category_id: Number(formData.category_id), // Ensure it's a number
          priority: formData.priority || 'Medium',
        };

        console.log('📤 Sending clean ticket payload:', ticketPayload);

        // FIXED: Use direct API call with proper JSON payload
        const response = await apiClient.post('/tickets', ticketPayload);
        
        if (response.success && response.data?.ticket) {
          const ticket = response.data.ticket;
          console.log('✅ SubmitTicket: Ticket created successfully:', ticket);
          
          // Handle attachments separately if any
          if (formData.attachments && formData.attachments.length > 0) {
            console.log('📎 Uploading attachments separately...');
            await uploadAttachmentsSeparately(ticket.id, formData.attachments);
          }
          
          setSuccess(true);
          setSuccessCountdown(10);
          
          toast({
            title: 'Success!',
            description: `Ticket #${ticket.ticket_number} created successfully in ${categoryExists.name} category`,
          });
        } else {
          throw new Error(response.message || 'Failed to create ticket');
        }
      } catch (err: any) {
        console.error('❌ SubmitTicket: Exception during ticket creation:', err);
        
        // FIXED: Handle specific error types
        let errorMessage = 'An unexpected error occurred. Please try again.';
        
        if (err.message?.includes('arrays and Traversables')) {
          errorMessage = 'Data format error. Please refresh the page and try again.';
        } else if (err.message?.includes('Server configuration error')) {
          errorMessage = 'Server configuration error. Please contact support or try a different category.';
        } else if (err.message?.includes('Server error occurred')) {
          errorMessage = 'Server error occurred. Please try again in a few minutes.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setLocalError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, submitting, availableCategories, toast]
  );

  // FIXED: Upload attachments separately to avoid FormData issues
  const uploadAttachmentsSeparately = useCallback(async (ticketId: number, attachments: File[]) => {
    try {
      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('ticket_id', ticketId.toString());
        
        await apiClient.post(`/tickets/${ticketId}/attachments`, formData);
        console.log(`✅ Uploaded attachment ${i + 1}/${attachments.length}: ${file.name}`);
      }
    } catch (uploadError: any) {
      console.warn('⚠️ Some attachments failed to upload:', uploadError);
      // Don't fail the whole operation for attachment issues
    }
  }, []);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      formData.subject.trim().length > 0 &&
      formData.category_id > 0 &&
      formData.description.trim().length >= 20 &&
      formData.description.trim().length <= 5000
    );
  }, [formData.subject, formData.category_id, formData.description]);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number) => {
    return ticketService.formatFileSize(bytes);
  }, []);

  // Enhanced success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="w-full max-w-4xl mx-auto pt-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => onNavigate('tickets')}
              className="hover:bg-green-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
          </div>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-green-50/50">
            <CardContent className="p-6 sm:p-12">
              <div className="text-center max-w-2xl mx-auto">
                <div className="relative mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                    <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  🎉 Ticket Created Successfully!
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
                  Your support request has been submitted and you will receive a confirmation email
                  shortly. Our team is ready to help you!
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-medium text-sm sm:text-base">
                    Redirecting to your tickets dashboard in {successCountdown} seconds...
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${((10 - successCountdown) / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => onNavigate('tickets')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                    size="lg"
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    View All Tickets
                  </Button>
                  <Button
                    onClick={() => {
                      setSuccess(false);
                      setFormData({
                        subject: '',
                        category_id: 0,
                        priority: 'Medium',
                        description: '',
                        attachments: [],
                      });
                      setSelectedCategory(null);
                      setCrisisDetected(false);
                    }}
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
      </div>
    );
  }

  // Form screen with mobile-friendly design
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-4xl mx-auto pt-8">
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submit Support Ticket</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Describe your issue and we'll get back to you as soon as possible
            </p>
          </div>
        </div>

        {availableCategories.length === 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="text-blue-800">
              Loading categories...
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b px-4 sm:px-6 py-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Ticket Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Display */}
              {localError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {localError}
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
                    value={formData.category_id?.toString() || ''}
                    onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                    disabled={submitting}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.length === 0 ? (
                        <SelectItem value="0" disabled>
                          Loading categories...
                        </SelectItem>
                      ) : (
                        availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center space-x-3 py-2">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{category.name}</span>
                                <span className="text-xs text-gray-500">{category.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Priority {crisisDetected && <span className="text-red-600">(Auto-set to Urgent)</span>}
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Urgent') =>
                      handleInputChange('priority', value)
                    }
                    disabled={submitting || crisisDetected}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Low - General inquiry
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          Medium - Standard support
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          High - Important issue
                        </div>
                      </SelectItem>
                      <SelectItem value="Urgent">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          Urgent - Crisis or emergency
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
              {crisisDetected && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <strong>Crisis Support Detected:</strong> Your message indicates you may need
                        immediate assistance. Your ticket has been automatically marked as urgent and will
                        be prioritized.
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => window.open('tel:911', '_self')}
                        className="bg-red-600 hover:bg-red-700 flex-shrink-0"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call 911
                      </Button>
                    </div>
                    <p className="text-sm mt-2">
                      If this is an emergency, please call our crisis hotline: <strong>(555) 123-4567</strong>
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Attachments Section */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors bg-gray-50/50">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    <div>
                      <p className="text-gray-600 font-medium text-sm sm:text-base">Drag and drop files here</p>
                      <p className="text-gray-500 text-xs sm:text-sm">or click to browse</p>
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
                      <Paperclip className="h-4 w-4 mr-2" />
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
              <div className="bg-blue-50 p-4 sm:p-5 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 text-sm sm:text-base">What happens next?</h4>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    You'll receive a confirmation email with your ticket number
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    Our team will review and respond within {selectedCategory?.slaHours || 24} hours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    You can track progress in your dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
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

              {/* Debug Info (only show in development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-600">
                  <p><strong>Debug Info:</strong></p>
                  <p>Available Categories: {availableCategories.length}</p>
                  <p>Selected Category ID: {formData.category_id}</p>
                  <p>Selected Category: {selectedCategory?.name || 'None'}</p>
                  <p>Crisis Detection: {crisisDetected ? 'Yes' : 'No'}</p>
                  <p>Form Valid: {isFormValid ? 'Yes' : 'No'}</p>
                  <p>Has Attachments: {(formData.attachments || []).length > 0 ? 'Yes' : 'No'}</p>
                  <p>Payload Structure: JSON with category_id as number</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}