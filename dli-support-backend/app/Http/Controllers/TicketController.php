<?php
// app/Http/Controllers/TicketController.php (COMPLETE UPDATED VERSION)

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketResponse;
use App\Models\TicketAttachment;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketController extends Controller
{
    /**
     * Get tickets based on user role - OPTIMIZED
     */
    public function index(Request $request): JsonResponse
    {
        try {
            Log::info('=== FETCHING TICKETS ===');
            Log::info('User: ' . $request->user()->id . ' (' . $request->user()->role . ')');
            
            $user = $request->user();
            
            // Start with optimized query using eager loading
            $query = Ticket::with([
                'user:id,name,email,role', 
                'assignedTo:id,name,email,role'
            ])->select([
                'id', 'ticket_number', 'user_id', 'subject', 'description',
                'category', 'priority', 'status', 'assigned_to', 'crisis_flag',
                'created_at', 'updated_at', 'resolved_at'
            ]);

            // Apply role-based filtering
            if ($user->isStudent()) {
                Log::info('Filtering tickets for student: ' . $user->id);
                $query->where('user_id', $user->id);
            } elseif ($user->isCounselor() || $user->isAdvisor()) {
                Log::info('Filtering tickets for staff: ' . $user->id);
                $query->where('assigned_to', $user->id);
            } else {
                Log::info('Admin user - showing all tickets');
            }

            // Apply search and filters efficiently
            $this->applyFilters($query, $request);

            // Get paginated results
            $tickets = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            Log::info('Found ' . $tickets->total() . ' tickets');

            // Get stats efficiently
            $stats = $this->getTicketStatsOptimized($user);

            // Add response and attachment counts efficiently
            if ($tickets->count() > 0) {
                $ticketIds = $tickets->pluck('id');
                
                $responseCounts = TicketResponse::whereIn('ticket_id', $ticketIds)
                    ->selectRaw('ticket_id, count(*) as count')
                    ->groupBy('ticket_id')
                    ->pluck('count', 'ticket_id');
                
                $attachmentCounts = TicketAttachment::whereIn('ticket_id', $ticketIds)
                    ->selectRaw('ticket_id, count(*) as count')
                    ->groupBy('ticket_id')
                    ->pluck('count', 'ticket_id');

                // Add counts to tickets
                foreach ($tickets as $ticket) {
                    $ticket->response_count = $responseCounts->get($ticket->id, 0);
                    $ticket->attachment_count = $attachmentCounts->get($ticket->id, 0);
                }
            }

            Log::info('=== TICKETS FETCH SUCCESS ===');

            return response()->json([
                'success' => true,
                'data' => [
                    'tickets' => $tickets->items(),
                    'pagination' => [
                        'current_page' => $tickets->currentPage(),
                        'last_page' => $tickets->lastPage(),
                        'per_page' => $tickets->perPage(),
                        'total' => $tickets->total(),
                    ],
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('=== TICKETS FETCH FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets.',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Create new ticket - COMPLETE WITH ENHANCED LOGGING
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('=== TICKET CREATION START ===');
        Log::info('User ID: ' . $request->user()->id);
        Log::info('User Role: ' . $request->user()->role);
        Log::info('Content Type: ' . $request->header('Content-Type'));
        Log::info('Request Method: ' . $request->method());
        Log::info('Has Files: ' . ($request->hasFile('attachments') ? 'YES' : 'NO'));
        
        // Log all request data (excluding files for brevity)
        $requestData = $request->except(['attachments']);
        Log::info('Request Data: ' . json_encode($requestData));
        
        // Log file information if present
        if ($request->hasFile('attachments')) {
            $files = $request->file('attachments');
            if (!is_array($files)) {
                $files = [$files];
            }
            
            Log::info('File count: ' . count($files));
            foreach ($files as $index => $file) {
                if ($file && $file->isValid()) {
                    Log::info("File {$index}: {$file->getClientOriginalName()} ({$file->getSize()} bytes, {$file->getMimeType()})");
                } else {
                    Log::warning("File {$index}: Invalid or missing");
                }
            }
        }

        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'description' => 'required|string|min:20',
            'category' => 'required|in:technical,academic,mental-health,administrative,other',
            'priority' => 'sometimes|in:Low,Medium,High',
            'attachments' => 'sometimes|array|max:5',
            'attachments.*' => 'file|max:10240|mimes:pdf,png,jpg,jpeg,gif,doc,docx,txt',
        ], [
            'description.min' => 'Description must be at least 20 characters long.',
            'attachments.*.max' => 'Each file must not exceed 10MB.',
            'attachments.*.mimes' => 'Only PDF, images, and document files are allowed.',
        ]);

        if ($validator->fails()) {
            Log::warning('=== TICKET VALIDATION FAILED ===');
            Log::warning('Errors: ' . json_encode($validator->errors()));
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            Log::info('Starting database transaction...');
            DB::beginTransaction();

            $user = $request->user();
            Log::info('Creating ticket for user: ' . $user->id . ' (' . $user->name . ')');

            // Create ticket
            $ticketData = [
                'user_id' => $user->id,
                'subject' => $request->subject,
                'description' => $request->description,
                'category' => $request->category,
                'priority' => $request->get('priority', 'Medium'),
                'status' => Ticket::STATUS_OPEN,
                'crisis_flag' => $this->detectCrisisKeywords($request->description),
            ];
            
            Log::info('Ticket data to create: ' . json_encode($ticketData));
            $ticket = Ticket::create($ticketData);
            Log::info('✅ Ticket created with ID: ' . $ticket->id . ', Number: ' . $ticket->ticket_number);

            // Handle file attachments
            if ($request->hasFile('attachments')) {
                Log::info('Processing file attachments...');
                $attachments = $request->file('attachments');
                if (!is_array($attachments)) {
                    $attachments = [$attachments];
                }
                
                foreach ($attachments as $index => $file) {
                    if ($file && $file->isValid()) {
                        Log::info("Processing file {$index}: " . $file->getClientOriginalName());
                        $this->storeAttachment($ticket, $file);
                        Log::info("✅ File {$index} stored successfully");
                    } else {
                        Log::warning("❌ File {$index} is invalid or missing");
                    }
                }
            }

            // Auto-assign based on category
            Log::info('Auto-assigning ticket...');
            $this->autoAssignTicket($ticket);

            // Create initial response
            Log::info('Creating initial response...');
            $response = TicketResponse::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => $request->description,
                'is_internal' => false,
            ]);
            Log::info('✅ Initial response created with ID: ' . $response->id);

            // Create notification for admins
            Log::info('Creating admin notifications...');
            $this->notifyAdminsNewTicket($ticket);

            Log::info('Committing database transaction...');
            DB::commit();

            // Load relationships for response
            Log::info('Loading ticket relationships...');
            $ticket->load(['user', 'assignedTo', 'responses.user', 'attachments']);

            Log::info('=== TICKET CREATION SUCCESS ===');
            Log::info('Final ticket ID: ' . $ticket->id);

            return response()->json([
                'success' => true,
                'message' => 'Ticket created successfully',
                'data' => ['ticket' => $ticket]
            ], 201);

        } catch (\Exception $e) {
            Log::error('=== TICKET CREATION FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ' Line: ' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket. Please try again.',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get single ticket details - OPTIMIZED
     */
    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        try {
            Log::info('=== FETCHING TICKET DETAILS ===');
            Log::info('Ticket ID: ' . $ticket->id);
            Log::info('User: ' . $request->user()->id . ' (' . $request->user()->role . ')');
            
            $user = $request->user();

            // Check access permissions
            if (!$this->canAccessTicket($user, $ticket)) {
                Log::warning('Unauthorized access attempt to ticket: ' . $ticket->id . ' by user: ' . $user->id);
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to ticket'
                ], 403);
            }

            // Load relationships efficiently
            $ticket->load([
                'user:id,name,email,role',
                'assignedTo:id,name,email,role',
                'responses' => function ($query) use ($user) {
                    if ($user->isStudent()) {
                        $query->where('is_internal', false);
                    }
                    $query->with(['user:id,name,email,role', 'attachments'])
                          ->orderBy('created_at', 'asc');
                },
                'attachments'
            ]);

            Log::info('✅ Ticket details loaded successfully');

            return response()->json([
                'success' => true,
                'data' => ['ticket' => $ticket]
            ]);
        } catch (\Exception $e) {
            Log::error('=== TICKET DETAILS FETCH FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket details.',
            ], 500);
        }
    }

    /**
     * Update ticket (staff only)
     */
    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        Log::info('=== UPDATING TICKET ===');
        Log::info('Ticket ID: ' . $ticket->id);
        Log::info('User: ' . $request->user()->id . ' (' . $request->user()->role . ')');
        
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:Open,In Progress,Resolved,Closed',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
            'priority' => 'sometimes|in:Low,Medium,High',
            'crisis_flag' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            if (!$user->isStaff()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only staff members can update tickets'
                ], 403);
            }

            $updateData = $request->only(['status', 'assigned_to', 'priority', 'crisis_flag']);
            Log::info('Update data: ' . json_encode($updateData));

            // Set resolved_at timestamp when resolving
            if (isset($updateData['status']) && in_array($updateData['status'], ['Resolved', 'Closed'])) {
                $updateData['resolved_at'] = now();
            }

            $ticket->update($updateData);
            Log::info('✅ Ticket updated successfully');

            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully',
                'data' => ['ticket' => $ticket->fresh(['user', 'assignedTo'])]
            ]);
        } catch (\Exception $e) {
            Log::error('=== TICKET UPDATE FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ticket.',
            ], 500);
        }
    }

    /**
     * Add response to ticket - ENHANCED WITH LOGGING
     */
    public function addResponse(Request $request, Ticket $ticket): JsonResponse
    {
        Log::info('=== ADDING TICKET RESPONSE ===');
        Log::info('Ticket ID: ' . $ticket->id);
        Log::info('User: ' . $request->user()->id . ' (' . $request->user()->role . ')');
        Log::info('Has files: ' . ($request->hasFile('attachments') ? 'YES' : 'NO'));

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:5',
            'is_internal' => 'sometimes|boolean',
            'visibility' => 'sometimes|in:all,counselors,admins',
            'is_urgent' => 'sometimes|boolean',
            'attachments' => 'sometimes|array|max:3',
            'attachments.*' => 'file|max:10240|mimes:pdf,png,jpg,jpeg,gif,doc,docx,txt',
        ]);

        if ($validator->fails()) {
            Log::warning('Response validation failed: ' . json_encode($validator->errors()));
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = $request->user();

            // Check access permissions
            if (!$this->canAccessTicket($user, $ticket)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to ticket'
                ], 403);
            }

            $isInternal = $request->get('is_internal', false);
            if ($user->isStudent() && $isInternal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Students cannot create internal responses'
                ], 403);
            }

            DB::beginTransaction();

            // Create response
            $responseData = [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => $request->message,
                'is_internal' => $isInternal,
                'visibility' => $request->get('visibility', 'all'),
                'is_urgent' => $request->get('is_urgent', false),
            ];
            
            Log::info('Creating response with data: ' . json_encode($responseData));
            $response = TicketResponse::create($responseData);
            Log::info('✅ Response created with ID: ' . $response->id);

            // Handle attachments
            if ($request->hasFile('attachments')) {
                $attachments = $request->file('attachments');
                if (!is_array($attachments)) {
                    $attachments = [$attachments];
                }
                
                foreach ($attachments as $index => $file) {
                    if ($file && $file->isValid()) {
                        Log::info("Processing response file {$index}: " . $file->getClientOriginalName());
                        $this->storeAttachment($ticket, $file, $response->id);
                        Log::info("✅ Response file {$index} stored successfully");
                    }
                }
            }

            // Update ticket status if needed
            if ($ticket->status === Ticket::STATUS_OPEN && $user->isStaff()) {
                $ticket->update(['status' => Ticket::STATUS_IN_PROGRESS]);
                Log::info('✅ Ticket status updated to In Progress');
            }

            DB::commit();

            // Load relationships for response
            $response->load(['user:id,name,email,role', 'attachments']);

            Log::info('=== RESPONSE ADDED SUCCESS ===');

            return response()->json([
                'success' => true,
                'message' => 'Response added successfully',
                'data' => ['response' => $response]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('=== RESPONSE CREATION FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add response.',
            ], 500);
        }
    }

    /**
     * Get ticket options
     */
    public function getOptions(): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => Ticket::getAvailableCategories(),
                    'priorities' => Ticket::getAvailablePriorities(),
                    'statuses' => Ticket::getAvailableStatuses(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get ticket options: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch ticket options.',
            ], 500);
        }
    }

    /**
     * Assign ticket to staff member (admin only)
     */
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        Log::info('=== ASSIGNING TICKET ===');
        Log::info('Ticket ID: ' . $ticket->id);
        Log::info('Admin: ' . $request->user()->id);
        
        $validator = Validator::make($request->all(), [
            'assigned_to' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if assigned user is staff
            $assignedUser = User::find($request->assigned_to);
            if (!$assignedUser->isStaff()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only assign tickets to staff members'
                ], 422);
            }

            Log::info('Assigning ticket to: ' . $assignedUser->name . ' (ID: ' . $assignedUser->id . ')');
            $ticket->assignTo($request->assigned_to);
            Log::info('✅ Ticket assigned successfully');

            return response()->json([
                'success' => true,
                'message' => 'Ticket assigned successfully',
                'data' => ['ticket' => $ticket->fresh(['user', 'assignedTo'])]
            ]);
        } catch (\Exception $e) {
            Log::error('=== TICKET ASSIGNMENT FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign ticket.',
            ], 500);
        }
    }

    /**
     * Download attachment
     */
    public function downloadAttachment(TicketAttachment $attachment): mixed
    {
        try {
            Log::info('=== DOWNLOADING ATTACHMENT ===');
            Log::info('Attachment ID: ' . $attachment->id);
            Log::info('File: ' . $attachment->original_name);
            
            if (!Storage::disk('private')->exists($attachment->file_path)) {
                Log::warning('File not found: ' . $attachment->file_path);
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            Log::info('✅ File download initiated');
            return Storage::disk('private')->download($attachment->file_path, $attachment->original_name);
        } catch (\Exception $e) {
            Log::error('=== FILE DOWNLOAD FAILED ===');
            Log::error('Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to download file.',
            ], 500);
        }
    }

    /**
     * Apply filters efficiently
     */
    private function applyFilters($query, $request)
    {
        $filters = [];
        
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
            $filters['status'] = $request->status;
        }

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
            $filters['category'] = $request->category;
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
            $filters['priority'] = $request->priority;
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'LIKE', "%{$search}%")
                  ->orWhere('subject', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
            $filters['search'] = $search;
        }
        
        if (!empty($filters)) {
            Log::info('Applied filters: ' . json_encode($filters));
        }
    }

    /**
     * Get ticket statistics efficiently
     */
    private function getTicketStatsOptimized($user): array
    {
        try {
            $query = Ticket::query();

            // Apply role-based filtering
            if ($user->isStudent()) {
                $query->where('user_id', $user->id);
            } elseif ($user->isCounselor() || $user->isAdvisor()) {
                $query->where('assigned_to', $user->id);
            }

            // Get all stats in one query
            $stats = $query->selectRaw('
                COUNT(*) as total_tickets,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as open_tickets,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as in_progress_tickets,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as resolved_tickets,
                SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as closed_tickets,
                SUM(CASE WHEN priority = ? THEN 1 ELSE 0 END) as high_priority_tickets,
                SUM(CASE WHEN crisis_flag = 1 THEN 1 ELSE 0 END) as crisis_tickets
            ', [
                Ticket::STATUS_OPEN,
                Ticket::STATUS_IN_PROGRESS,
                Ticket::STATUS_RESOLVED,
                Ticket::STATUS_CLOSED,
                Ticket::PRIORITY_HIGH
            ])->first();

            $result = [
                'total_tickets' => $stats->total_tickets ?? 0,
                'open_tickets' => $stats->open_tickets ?? 0,
                'in_progress_tickets' => $stats->in_progress_tickets ?? 0,
                'resolved_tickets' => $stats->resolved_tickets ?? 0,
                'closed_tickets' => $stats->closed_tickets ?? 0,
                'high_priority_tickets' => $stats->high_priority_tickets ?? 0,
                'crisis_tickets' => $stats->crisis_tickets ?? 0,
            ];

            Log::info('Stats calculated: ' . json_encode($result));
            return $result;
        } catch (\Exception $e) {
            Log::error('Stats calculation failed: ' . $e->getMessage());
            
            // Return empty stats on error
            return [
                'total_tickets' => 0,
                'open_tickets' => 0,
                'in_progress_tickets' => 0,
                'resolved_tickets' => 0,
                'closed_tickets' => 0,
                'high_priority_tickets' => 0,
                'crisis_tickets' => 0,
            ];
        }
    }

    /**
     * Check if user can access ticket
     */
    private function canAccessTicket($user, $ticket): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isStudent()) {
            return $ticket->user_id === $user->id;
        }

        if ($user->isCounselor() || $user->isAdvisor()) {
            return $ticket->assigned_to === $user->id;
        }

        return false;
    }

    /**
     * Store attachment with enhanced error handling
     */
    private function storeAttachment($ticket, $file, $responseId = null): void
    {
        try {
            Log::info("Storing attachment: {$file->getClientOriginalName()}");
            
            // Generate unique filename to prevent conflicts
            $filename = time() . '_' . str_replace(' ', '_', $file->getClientOriginalName());
            
            // Store file in private disk with organized structure
            $path = $file->storeAs(
                'ticket-attachments/' . date('Y/m'), 
                $filename, 
                'private'
            );
            
            Log::info("File stored at path: {$path}");
            
            // Create attachment record
            $attachment = TicketAttachment::create([
                'ticket_id' => $ticket->id,
                'response_id' => $responseId,
                'original_name' => $file->getClientOriginalName(),
                'file_path' => $path,
                'file_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
            ]);
            
            Log::info("✅ Attachment record created with ID: {$attachment->id}");
        } catch (\Exception $e) {
            Log::error("❌ Failed to store attachment: " . $e->getMessage());
            throw new \Exception("Failed to store attachment: {$file->getClientOriginalName()}");
        }
    }

    /**
     * Detect crisis keywords in text
     */
    private function detectCrisisKeywords($text): bool
    {
        $crisisKeywords = [
            // Suicide-related
            'suicide', 'kill myself', 'end my life', 'want to die', 'take my life',
            'suicidal', 'killing myself', 'ending it all', 'better off dead',
            
            // Self-harm related
            'self harm', 'hurt myself', 'cutting', 'cut myself', 'self injury',
            'burning myself', 'hitting myself', 'self mutilation',
            
            // Crisis/emergency
            'crisis', 'emergency', 'urgent help', 'immediate help', 'desperate',
            'can\'t cope', 'overwhelmed', 'breakdown', 'mental breakdown',
            
            // Substance abuse
            'overdose', 'too many pills', 'drink to death', 'alcohol poisoning',
            
            // Emotional distress
            'hopeless', 'worthless', 'no point', 'give up', 'can\'t go on',
            'nobody cares', 'hate myself', 'failed at everything'
        ];

        $text = strtolower($text);
        foreach ($crisisKeywords as $keyword) {
            if (strpos($text, $keyword) !== false) {
                Log::warning("🚨 CRISIS KEYWORD DETECTED: '{$keyword}' in ticket");
                return true;
            }
        }

        return false;
    }

    /**
     * Auto-assign ticket based on category
     */
    private function autoAssignTicket($ticket): void
    {
        try {
            $roleMap = [
                'mental-health' => 'counselor',
                'academic' => 'advisor',
                'technical' => 'admin',
                'administrative' => 'admin',
            ];

            if (isset($roleMap[$ticket->category])) {
                $targetRole = $roleMap[$ticket->category];
                
                // Find available staff with least assigned tickets for load balancing
                $availableStaff = User::where('role', $targetRole)
                                     ->where('status', 'active')
                                     ->withCount(['assignedTickets' => function ($query) {
                                         $query->whereIn('status', ['Open', 'In Progress']);
                                     }])
                                     ->orderBy('assigned_tickets_count', 'asc')
                                     ->first();

                if ($availableStaff) {
                    Log::info("🎯 Auto-assigning ticket to: {$availableStaff->name} (ID: {$availableStaff->id}, Current load: {$availableStaff->assigned_tickets_count})");
                    $ticket->update(['assigned_to' => $availableStaff->id]);
                    
                    // Create notification for assigned staff
                    Notification::createForUser(
                        $availableStaff->id,
                        Notification::TYPE_TICKET,
                        'New Ticket Assigned',
                        "You have been assigned ticket #{$ticket->ticket_number}: {$ticket->subject}",
                        $ticket->crisis_flag ? Notification::PRIORITY_HIGH : Notification::PRIORITY_MEDIUM,
                        ['ticket_id' => $ticket->id]
                    );
                } else {
                    Log::info("⚠️ No available {$targetRole} staff found for category: {$ticket->category}");
                }
            } else {
                Log::info("ℹ️ No auto-assignment rule for category: {$ticket->category}");
            }
        } catch (\Exception $e) {
            Log::error("❌ Auto-assignment failed: " . $e->getMessage());
            // Don't throw, as this is not critical for ticket creation
        }
    }

    /**
     * Notify admins about new ticket
     */
    private function notifyAdminsNewTicket($ticket): void
    {
        try {
            $admins = User::where('role', 'admin')
                         ->where('status', 'active')
                         ->pluck('id')
                         ->toArray();
            
            if (!empty($admins)) {
                Log::info("📧 Notifying {count($admins)} admins about new ticket");
                
                $priority = $ticket->crisis_flag ? Notification::PRIORITY_HIGH : Notification::PRIORITY_MEDIUM;
                $title = $ticket->crisis_flag ? '🚨 CRISIS TICKET CREATED' : 'New Support Ticket';
                $message = $ticket->crisis_flag 
                    ? "URGENT: Crisis ticket #{$ticket->ticket_number} created by {$ticket->user->name}. Immediate attention required!"
                    : "New ticket #{$ticket->ticket_number} created by {$ticket->user->name}";
                
                Notification::createForUsers(
                    $admins,
                    Notification::TYPE_TICKET,
                    $title,
                    $message,
                    $priority,
                    ['ticket_id' => $ticket->id, 'crisis' => $ticket->crisis_flag]
                );
                
                Log::info("✅ Admin notifications created successfully");
            } else {
                Log::warning("⚠️ No active admins found to notify");
            }
        } catch (\Exception $e) {
            Log::error("❌ Failed to create admin notifications: " . $e->getMessage());
            // Don't throw, as this is not critical for ticket creation
        }
    }
}