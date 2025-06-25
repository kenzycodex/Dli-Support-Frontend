<?php
// routes/api.php (Updated with notification and ticket routes)

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\TicketController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes (no authentication required)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/demo-login', [AuthController::class, 'demoLogin']);
});

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentication routes
    Route::prefix('auth')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // Notification routes (all authenticated users)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'getUnreadCount']);
        Route::get('/options', [NotificationController::class, 'getOptions']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::post('/bulk-action', [NotificationController::class, 'bulkAction']);
        Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('/{notification}/unread', [NotificationController::class, 'markAsUnread']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        
        // Admin only notification routes
        Route::middleware('role:admin')->group(function () {
            Route::post('/', [NotificationController::class, 'store']);
            Route::get('/stats', [NotificationController::class, 'getStats']);
        });
    });

    // Ticket routes (all authenticated users can access tickets)
    Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index']);
        Route::post('/', [TicketController::class, 'store']);
        Route::get('/options', [TicketController::class, 'getOptions']);
        Route::get('/{ticket}', [TicketController::class, 'show']);
        Route::post('/{ticket}/responses', [TicketController::class, 'addResponse']);
        Route::get('/attachments/{attachment}/download', [TicketController::class, 'downloadAttachment']);
        
        // Staff only ticket routes (counselor, advisor, admin)
        Route::middleware('role:counselor,advisor,admin')->group(function () {
            Route::patch('/{ticket}', [TicketController::class, 'update']);
        });
        
        // Admin only ticket routes
        Route::middleware('role:admin')->group(function () {
            Route::post('/{ticket}/assign', [TicketController::class, 'assign']);
        });
    });

    // Admin routes (admin only)
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        
        // User management
        Route::prefix('users')->group(function () {
            Route::get('/', [UserManagementController::class, 'index']);
            Route::post('/', [UserManagementController::class, 'store']);
            Route::get('/stats', [UserManagementController::class, 'getStats']);
            Route::get('/options', [UserManagementController::class, 'getOptions']);
            Route::post('/bulk-action', [UserManagementController::class, 'bulkAction']);
            Route::get('/export', [UserManagementController::class, 'export']);
            Route::get('/{user}', [UserManagementController::class, 'show']);
            Route::put('/{user}', [UserManagementController::class, 'update']);
            Route::delete('/{user}', [UserManagementController::class, 'destroy']);
            Route::post('/{user}/reset-password', [UserManagementController::class, 'resetPassword']);
            Route::post('/{user}/toggle-status', [UserManagementController::class, 'toggleStatus']);
        });

        // Admin can also register new users
        Route::post('/register', [AuthController::class, 'register']);
    });

    // Staff routes (counselor, advisor, admin)
    Route::middleware('role:counselor,advisor,admin')->prefix('staff')->group(function () {
        // Staff dashboard
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Staff dashboard access granted'
            ]);
        });

        // Staff can view their assigned tickets
        Route::get('/assigned-tickets', [TicketController::class, 'index']);
        
        // Staff can view ticket statistics
        Route::get('/ticket-stats', function (Request $request) {
            $user = $request->user();
            $query = \App\Models\Ticket::where('assigned_to', $user->id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'assigned_tickets' => $query->count(),
                    'open_tickets' => (clone $query)->where('status', 'Open')->count(),
                    'in_progress_tickets' => (clone $query)->where('status', 'In Progress')->count(),
                    'resolved_tickets' => (clone $query)->where('status', 'Resolved')->count(),
                    'high_priority_tickets' => (clone $query)->where('priority', 'High')->count(),
                    'crisis_tickets' => (clone $query)->where('crisis_flag', true)->count(),
                ]
            ]);
        });
    });

    // Student routes (student only)
    Route::middleware('role:student')->prefix('student')->group(function () {
        // Student dashboard
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Student dashboard access granted'
            ]);
        });

        // Student can view their own tickets
        Route::get('/my-tickets', [TicketController::class, 'index']);
        
        // Student ticket statistics
        Route::get('/ticket-stats', function (Request $request) {
            $user = $request->user();
            $query = \App\Models\Ticket::where('user_id', $user->id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_tickets' => $query->count(),
                    'open_tickets' => (clone $query)->where('status', 'Open')->count(),
                    'in_progress_tickets' => (clone $query)->where('status', 'In Progress')->count(),
                    'resolved_tickets' => (clone $query)->where('status', 'Resolved')->count(),
                    'closed_tickets' => (clone $query)->where('status', 'Closed')->count(),
                ]
            ]);
        });
    });

    // Common user routes (all authenticated users)
    Route::prefix('user')->group(function () {
        Route::get('/profile', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => ['user' => $request->user()]
            ]);
        });
        
        Route::put('/profile', function (Request $request) {
            // Update profile logic will be added here
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        });

        // User's notification summary
        Route::get('/notification-summary', function (Request $request) {
            $user = $request->user();
            return response()->json([
                'success' => true,
                'data' => [
                    'unread_notifications' => $user->notifications()->unread()->count(),
                    'total_notifications' => $user->notifications()->count(),
                    'high_priority_unread' => $user->notifications()->unread()->where('priority', 'high')->count(),
                ]
            ]);
        });

        // User's ticket summary
        Route::get('/ticket-summary', function (Request $request) {
            $user = $request->user();
            
            if ($user->isStudent()) {
                $tickets = $user->tickets();
            } elseif ($user->isStaff()) {
                $tickets = $user->assignedTickets();
            } else {
                $tickets = \App\Models\Ticket::query();
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'open_tickets' => (clone $tickets)->whereIn('status', ['Open', 'In Progress'])->count(),
                    'total_tickets' => $tickets->count(),
                    'recent_activity' => (clone $tickets)->where('updated_at', '>=', now()->subDays(7))->count(),
                ]
            ]);
        });
    });
});

// Health check route
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is running',
        'timestamp' => now(),
        'version' => '1.0.0',
        'features' => [
            'authentication' => 'active',
            'notifications' => 'active',
            'tickets' => 'active',
            'user_management' => 'active',
        ]
    ]);
});

// API documentation endpoint
Route::get('/docs', function () {
    return response()->json([
        'success' => true,
        'message' => 'School Support Platform API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/auth/*',
            'notifications' => '/api/notifications/*',
            'tickets' => '/api/tickets/*',
            'admin' => '/api/admin/*',
            'staff' => '/api/staff/*',
            'student' => '/api/student/*',
            'user' => '/api/user/*',
        ],
        'documentation' => 'Contact admin for detailed API documentation'
    ]);
});

// Fallback route for 404
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'API endpoint not found',
        'available_endpoints' => [
            'GET /api/health' => 'Health check',
            'GET /api/docs' => 'API documentation',
            'POST /api/auth/login' => 'User login',
            'POST /api/auth/demo-login' => 'Demo login',
        ]
    ], 404);
});