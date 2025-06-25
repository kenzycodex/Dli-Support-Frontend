<?php
// app/Http/Controllers/TicketController.php

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

class TicketController extends Controller
{
    /**
     * Get tickets based on user role
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = Ticket::with(['user', 'assignedTo', 'responses', 'attachments']);

            // Filter based on user role
            if ($user->isStudent()) {
                // Students can only see their own tickets
                $query->where('user_id', $user->id);
            } elseif ($user->isCounselor() || $user->isAdvisor()) {
                // Counselors and advisors see tickets assigned to them
                $query->where('assigned_to', $user->id);
            }
            // Admins can see all tickets (no additional filter)

            // Apply filters
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            if ($request->has('priority') && $request->priority !== 'all') {
                $query->where('priority', $request->priority);
            }

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('ticket_number', 'LIKE', "%{$search}%")
                      ->orWhere('subject', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
            }

            // Sort by creation date (newest first)
            $tickets = $query->orderBy('created_at', 'desc')
                            ->paginate($request->get('per_page', 15));

            // Get ticket statistics
            $stats = $this->getTicketStats($user);

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
            \Log::error('Tickets fetch failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch tickets.',
            ], 500);
        }
    }

    /**
     * Create new ticket
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'subject' => 'required|string|max:255',
            'description' => 'required|string|min:20',
            'category' => 'required|in:technical,academic,mental-health,administrative,other',
            'priority' => 'sometimes|in:Low,Medium,High',
            'attachments' => 'sometimes|array|max:5',
            'attachments.*' => 'file|max:10240|mimes:pdf,png,jpg,jpeg,doc,docx,txt', // 10MB max
        ], [
            'description.min' => 'Description must be at least 20 characters long.',
            'attachments.*.max' => 'Each file must not exceed 10MB.',
            'attachments.*.mimes' => 'Only PDF, images, and document files are allowed.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $user = $request->user();

            // Create ticket
            $ticket = Ticket::create([
                'user_id' => $user->id,
                'subject' => $request->subject,
                'description' => $request->description,
                'category' => $request->category,
                'priority' => $request->get('priority', 'Medium'),
                'status' => Ticket::STATUS_OPEN,
                'crisis_flag' => $this->detectCrisisKeywords($request->description),
            ]);

            // Handle file attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $this->storeAttachment($ticket, $file);
                }
            }

            // Auto-assign based on category (if counselors/advisors available)
            $this->autoAssignTicket($ticket);

            // Create initial response with ticket description
            TicketResponse::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => $request->description,
                'is_internal' => false,
            ]);

            // Create notification for admins about new ticket
            $this->notifyAdminsNewTicket($ticket);

            DB::commit();

            // Load relationships for response
            $ticket->load(['user', 'assignedTo', 'responses.user', 'attachments']);

            return response()->json([
                'success' => true,
                'message' => 'Ticket created successfully',
                'data' => ['ticket' => $ticket]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Ticket creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ticket. Please try again.',
            ], 500);
        }
    }

    /**
     * Get single ticket details
     */
    public function show(Request $request, Ticket $ticket): JsonResponse
    {
        try {
            $user = $request->user();

            // Check access permissions
            if (!$this->canAccessTicket($user, $ticket)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to ticket'
                ], 403);
            }

            // Load relationships
            $ticket->load([
                'user',
                'assignedTo',
                'responses' => function ($query) use ($user) {
                    // Filter internal responses based on user role
                    if ($user->isStudent()) {
                        $query->where('is_internal', false);
                    }
                    $query->with(['user', 'attachments']);
                },
                'attachments'
            ]);

            return response()->json([
                'success' => true,
                'data' => ['ticket' => $ticket]
            ]);
        } catch (\Exception $e) {
            \Log::error('Ticket fetch failed: ' . $e->getMessage());
            
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

            // Check permissions
            if (!$user->isStaff()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only staff members can update tickets'
                ], 403);
            }

            $updateData = $request->only(['status', 'assigned_to', 'priority', 'crisis_flag']);

            // Set resolved_at timestamp when resolving
            if (isset($updateData['status']) && in_array($updateData['status'], ['Resolved', 'Closed'])) {
                $updateData['resolved_at'] = now();
            }

            $ticket->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Ticket updated successfully',
                'data' => ['ticket' => $ticket->fresh(['user', 'assignedTo'])]
            ]);
        } catch (\Exception $e) {
            \Log::error('Ticket update failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update ticket.',
            ], 500);
        }
    }

    /**
     * Add response to ticket
     */
    public function addResponse(Request $request, Ticket $ticket): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|min:5',
            'is_internal' => 'sometimes|boolean',
            'visibility' => 'sometimes|in:all,counselors,admins',
            'is_urgent' => 'sometimes|boolean',
            'attachments' => 'sometimes|array|max:3',
            'attachments.*' => 'file|max:10240|mimes:pdf,png,jpg,jpeg,doc,docx,txt',
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

            // Check access permissions
            if (!$this->canAccessTicket($user, $ticket)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to ticket'
                ], 403);
            }

            // Students cannot create internal responses
            $isInternal = $request->get('is_internal', false);
            if ($user->isStudent() && $isInternal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Students cannot create internal responses'
                ], 403);
            }

            DB::beginTransaction();

            // Create response
            $response = TicketResponse::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'message' => $request->message,
                'is_internal' => $isInternal,
                'visibility' => $request->get('visibility', 'all'),
                'is_urgent' => $request->get('is_urgent', false),
            ]);

            // Handle attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $this->storeAttachment($ticket, $file, $response->id);
                }
            }

            // Update ticket status if it was Open and response is from staff
            if ($ticket->status === Ticket::STATUS_OPEN && $user->isStaff()) {
                $ticket->update(['status' => Ticket::STATUS_IN_PROGRESS]);
            }

            DB::commit();

            // Load relationships for response
            $response->load(['user', 'attachments']);

            return response()->json([
                'success' => true,
                'message' => 'Response added successfully',
                'data' => ['response' => $response]
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Response creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to add response.',
            ], 500);
        }
    }

    /**
     * Get ticket options (categories, priorities, statuses)
     */
    public function getOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'categories' => Ticket::getAvailableCategories(),
                'priorities' => Ticket::getAvailablePriorities(),
                'statuses' => Ticket::getAvailableStatuses(),
            ]
        ]);
    }

    /**
     * Assign ticket to staff member (admin only)
     */
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
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

            $ticket->assignTo($request->assigned_to);

            return response()->json([
                'success' => true,
                'message' => 'Ticket assigned successfully',
                'data' => ['ticket' => $ticket->fresh(['user', 'assignedTo'])]
            ]);
        } catch (\Exception $e) {
            \Log::error('Ticket assignment failed: ' . $e->getMessage());
            
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
            if (!Storage::exists($attachment->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            return Storage::download($attachment->file_path, $attachment->original_name);
        } catch (\Exception $e) {
            \Log::error('File download failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to download file.',
            ], 500);
        }
    }

    /**
     * Private helper methods
     */
    private function getTicketStats($user): array
    {
        $query = Ticket::query();

        // Filter based on user role
        if ($user->isStudent()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isCounselor() || $user->isAdvisor()) {
            $query->where('assigned_to', $user->id);
        }

        return [
            'total_tickets' => $query->count(),
            'open_tickets' => (clone $query)->where('status', Ticket::STATUS_OPEN)->count(),
            'in_progress_tickets' => (clone $query)->where('status', Ticket::STATUS_IN_PROGRESS)->count(),
            'resolved_tickets' => (clone $query)->where('status', Ticket::STATUS_RESOLVED)->count(),
            'closed_tickets' => (clone $query)->where('status', Ticket::STATUS_CLOSED)->count(),
            'high_priority_tickets' => (clone $query)->where('priority', Ticket::PRIORITY_HIGH)->count(),
            'crisis_tickets' => (clone $query)->where('crisis_flag', true)->count(),
        ];
    }

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

    private function storeAttachment($ticket, $file, $responseId = null): void
    {
        $path = $file->store('ticket-attachments', 'private');
        
        TicketAttachment::create([
            'ticket_id' => $ticket->id,
            'response_id' => $responseId,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);
    }

    private function detectCrisisKeywords($text): bool
    {
        $crisisKeywords = [
            'suicide', 'kill myself', 'end my life', 'want to die',
            'self harm', 'hurt myself', 'crisis', 'emergency',
            'cutting', 'overdose', 'hopeless', 'worthless'
        ];

        $text = strtolower($text);
        foreach ($crisisKeywords as $keyword) {
            if (strpos($text, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    private function autoAssignTicket($ticket): void
    {
        // Auto-assign based on category
        $roleMap = [
            'mental-health' => 'counselor',
            'academic' => 'advisor',
        ];

        if (isset($roleMap[$ticket->category])) {
            $availableStaff = User::where('role', $roleMap[$ticket->category])
                                 ->where('status', 'active')
                                 ->inRandomOrder()
                                 ->first();

            if ($availableStaff) {
                $ticket->assignTo($availableStaff->id);
            }
        }
    }

    private function notifyAdminsNewTicket($ticket): void
    {
        $admins = User::where('role', 'admin')->where('status', 'active')->pluck('id')->toArray();
        
        if (!empty($admins)) {
            Notification::createForUsers(
                $admins,
                Notification::TYPE_TICKET,
                'New Support Ticket',
                "New ticket #{$ticket->ticket_number} created by {$ticket->user->name}",
                $ticket->crisis_flag ? Notification::PRIORITY_HIGH : Notification::PRIORITY_MEDIUM,
                ['ticket_id' => $ticket->id]
            );
        }
    }
}