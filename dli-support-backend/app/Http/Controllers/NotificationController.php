<?php
// app/Http/Controllers/NotificationController.php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Get user's notifications
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $query = $user->notifications();

            // Apply filters
            if ($request->has('type') && $request->type !== 'all') {
                $query->where('type', $request->type);
            }

            if ($request->has('read_status')) {
                if ($request->read_status === 'unread') {
                    $query->unread();
                } elseif ($request->read_status === 'read') {
                    $query->read();
                }
            }

            if ($request->has('priority') && $request->priority !== 'all') {
                $query->where('priority', $request->priority);
            }

            // Sort by creation date
            $notifications = $query->orderBy('created_at', 'desc')
                                 ->paginate($request->get('per_page', 20));

            // Get counts
            $unreadCount = $user->notifications()->unread()->count();
            $totalCount = $user->notifications()->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'notifications' => $notifications->items(),
                    'pagination' => [
                        'current_page' => $notifications->currentPage(),
                        'last_page' => $notifications->lastPage(),
                        'per_page' => $notifications->perPage(),
                        'total' => $notifications->total(),
                    ],
                    'counts' => [
                        'unread' => $unreadCount,
                        'total' => $totalCount,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Notifications fetch failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications.',
            ], 500);
        }
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount(Request $request): JsonResponse
    {
        try {
            $count = $request->user()->notifications()->unread()->count();

            return response()->json([
                'success' => true,
                'data' => ['unread_count' => $count]
            ]);
        } catch (\Exception $e) {
            \Log::error('Unread count fetch failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch unread count.',
            ], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        try {
            // Check if notification belongs to authenticated user
            if ($notification->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to notification'
                ], 403);
            }

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
                'data' => ['notification' => $notification->fresh()]
            ]);
        } catch (\Exception $e) {
            \Log::error('Mark as read failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read.',
            ], 500);
        }
    }

    /**
     * Mark notification as unread
     */
    public function markAsUnread(Request $request, Notification $notification): JsonResponse
    {
        try {
            // Check if notification belongs to authenticated user
            if ($notification->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to notification'
                ], 403);
            }

            $notification->markAsUnread();

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as unread',
                'data' => ['notification' => $notification->fresh()]
            ]);
        } catch (\Exception $e) {
            \Log::error('Mark as unread failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as unread.',
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        try {
            $updated = $request->user()
                              ->notifications()
                              ->unread()
                              ->update([
                                  'read' => true,
                                  'read_at' => now()
                              ]);

            return response()->json([
                'success' => true,
                'message' => "Marked {$updated} notifications as read"
            ]);
        } catch (\Exception $e) {
            \Log::error('Mark all as read failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read.',
            ], 500);
        }
    }

    /**
     * Delete notification
     */
    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        try {
            // Check if notification belongs to authenticated user
            if ($notification->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to notification'
                ], 403);
            }

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Notification deletion failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification.',
            ], 500);
        }
    }

    /**
     * Bulk actions on notifications
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:read,unread,delete',
            'notification_ids' => 'required|array|min:1',
            'notification_ids.*' => 'exists:notifications,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $notificationIds = $request->notification_ids;
            $action = $request->action;

            // Get notifications that belong to the authenticated user
            $notifications = $request->user()
                                   ->notifications()
                                   ->whereIn('id', $notificationIds);

            switch ($action) {
                case 'read':
                    $updated = $notifications->update([
                        'read' => true,
                        'read_at' => now()
                    ]);
                    $message = "Marked {$updated} notifications as read";
                    break;
                    
                case 'unread':
                    $updated = $notifications->update([
                        'read' => false,
                        'read_at' => null
                    ]);
                    $message = "Marked {$updated} notifications as unread";
                    break;
                    
                case 'delete':
                    $updated = $notifications->delete();
                    $message = "Deleted {$updated} notifications";
                    break;
            }

            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            \Log::error('Bulk action failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to perform bulk action.',
            ], 500);
        }
    }

    /**
     * Create notification (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
            'type' => 'required|in:appointment,ticket,system,reminder',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'sometimes|in:low,medium,high',
            'data' => 'sometimes|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userIds = $request->user_ids;
            $type = $request->type;
            $title = $request->title;
            $message = $request->message;
            $priority = $request->get('priority', 'medium');
            $data = $request->get('data');

            // Create notifications for multiple users
            Notification::createForUsers($userIds, $type, $title, $message, $priority, $data);

            return response()->json([
                'success' => true,
                'message' => 'Notifications created successfully'
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Notification creation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create notifications.',
            ], 500);
        }
    }

    /**
     * Get notification types and priorities (for admin)
     */
    public function getOptions(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'types' => Notification::getAvailableTypes(),
                'priorities' => Notification::getAvailablePriorities()
            ]
        ]);
    }

    /**
     * Get notification statistics (for admin)
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $stats = [
                'total_notifications' => Notification::count(),
                'unread_notifications' => Notification::unread()->count(),
                'notifications_by_type' => [
                    'appointment' => Notification::byType('appointment')->count(),
                    'ticket' => Notification::byType('ticket')->count(),
                    'system' => Notification::byType('system')->count(),
                    'reminder' => Notification::byType('reminder')->count(),
                ],
                'notifications_by_priority' => [
                    'high' => Notification::byPriority('high')->count(),
                    'medium' => Notification::byPriority('medium')->count(),
                    'low' => Notification::byPriority('low')->count(),
                ],
                'recent_notifications' => Notification::where('created_at', '>=', now()->subDays(7))->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => ['stats' => $stats]
            ]);
        } catch (\Exception $e) {
            \Log::error('Notification stats failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve notification statistics.',
            ], 500);
        }
    }
}