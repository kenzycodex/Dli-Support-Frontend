<?php
// routes/api.php (RELAXED RATE LIMITING - USER FRIENDLY)

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

    // Notification routes with RELAXED rate limiting for better UX
    Route::prefix('notifications')->group(function () {
        // Unread count - relaxed from 15 to 60 per minute
        Route::get('/unread-count', [NotificationController::class, 'getUnreadCount'])
             ->middleware('throttle:60,1'); // 60 requests per minute (1 per second)
        
        // List notifications - generous limit
        Route::get('/', [NotificationController::class, 'index'])
             ->middleware('throttle:120,1'); // 120 per minute (2 per second)
        
        // Static data endpoints - high limit since they're cached
        Route::get('/options', [NotificationController::class, 'getOptions'])
             ->middleware('throttle:30,1'); // 30 per minute
        
        // Action endpoints - reasonable limits
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])
             ->middleware('throttle:20,1'); // 20 per minute
        
        Route::post('/bulk-action', [NotificationController::class, 'bulkAction'])
             ->middleware('throttle:30,1'); // 30 per minute
        
        // Individual actions - high limits for smooth UX
        Route::patch('/{notification}/read', [NotificationController::class, 'markAsRead'])
             ->middleware('throttle:200,1'); // 200 per minute (generous for clicking)
        
        Route::patch('/{notification}/unread', [NotificationController::class, 'markAsUnread'])
             ->middleware('throttle:200,1'); // 200 per minute
        
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])
             ->middleware('throttle:100,1'); // 100 per minute
        
        // Admin only notification routes with reasonable limits
        Route::middleware('role:admin')->group(function () {
            Route::post('/', [NotificationController::class, 'store'])
                 ->middleware('throttle:10,1'); // 10 notifications creation per minute
            
            Route::get('/stats', [NotificationController::class, 'getStats'])
                 ->middleware('throttle:20,1'); // 20 per minute for stats
        });
    });

    // Ticket routes with generous limits
    Route::prefix('tickets')->group(function () {
        Route::get('/', [TicketController::class, 'index'])
             ->middleware('throttle:100,1'); // 100 per minute
        
        Route::post('/', [TicketController::class, 'store'])
             ->middleware('throttle:20,1'); // 20 ticket creations per minute
        
        Route::get('/options', [TicketController::class, 'getOptions'])
             ->middleware('throttle:30,1'); // Static data
        
        Route::get('/{ticket}', [TicketController::class, 'show'])
             ->middleware('throttle:150,1'); // 150 per minute for viewing
        
        Route::post('/{ticket}/responses', [TicketController::class, 'addResponse'])
             ->middleware('throttle:50,1'); // 50 responses per minute
        
        Route::get('/attachments/{attachment}/download', [TicketController::class, 'downloadAttachment'])
             ->middleware('throttle:60,1'); // 60 downloads per minute
        
        // Staff only ticket routes
        Route::middleware('role:counselor,advisor,admin')->group(function () {
            Route::patch('/{ticket}', [TicketController::class, 'update'])
                 ->middleware('throttle:100,1');
        });
        
        // Admin only ticket routes
        Route::middleware('role:admin')->group(function () {
            Route::post('/{ticket}/assign', [TicketController::class, 'assign'])
                 ->middleware('throttle:50,1');
        });
    });

    // Admin routes with reasonable limits
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        
        // User management
        Route::prefix('users')->group(function () {
            Route::get('/', [UserManagementController::class, 'index'])
                 ->middleware('throttle:60,1'); // 60 per minute for user lists
            
            Route::post('/', [UserManagementController::class, 'store'])
                 ->middleware('throttle:10,1'); // 10 user creations per minute
            
            Route::get('/stats', [UserManagementController::class, 'getStats'])
                 ->middleware('throttle:30,1'); // 30 per minute for stats
            
            Route::get('/options', [UserManagementController::class, 'getOptions'])
                 ->middleware('throttle:20,1'); // Static data
            
            Route::post('/bulk-action', [UserManagementController::class, 'bulkAction'])
                 ->middleware('throttle:5,1'); // 5 bulk operations per minute
            
            Route::get('/export', [UserManagementController::class, 'export'])
                 ->middleware('throttle:3,1'); // 3 exports per minute
            
            Route::get('/{user}', [UserManagementController::class, 'show'])
                 ->middleware('throttle:100,1');
            
            Route::put('/{user}', [UserManagementController::class, 'update'])
                 ->middleware('throttle:50,1');
            
            Route::delete('/{user}', [UserManagementController::class, 'destroy'])
                 ->middleware('throttle:20,1');
            
            Route::post('/{user}/reset-password', [UserManagementController::class, 'resetPassword'])
                 ->middleware('throttle:10,1');
            
            Route::post('/{user}/toggle-status', [UserManagementController::class, 'toggleStatus'])
                 ->middleware('throttle:50,1');
        });

        // Admin registration
        Route::post('/register', [AuthController::class, 'register'])
             ->middleware('throttle:5,1'); // 5 registrations per minute
    });

    // Staff routes with generous limits
    Route::middleware('role:counselor,advisor,admin')->prefix('staff')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Staff dashboard access granted'
            ]);
        })->middleware('throttle:60,1');

        Route::get('/assigned-tickets', [TicketController::class, 'index'])
             ->middleware('throttle:100,1');
        
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
        })->middleware('throttle:30,1');
    });

    // Student routes with user-friendly limits
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Student dashboard access granted'
            ]);
        })->middleware('throttle:60,1');

        Route::get('/my-tickets', [TicketController::class, 'index'])
             ->middleware('throttle:100,1');
        
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
        })->middleware('throttle:30,1');
    });

    // Common user routes with generous limits for good UX
    Route::prefix('user')->group(function () {
        Route::get('/profile', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => ['user' => $request->user()]
            ]);
        })->middleware('throttle:60,1');
        
        Route::put('/profile', function (Request $request) {
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        })->middleware('throttle:20,1');

        // User's notification summary with caching
        Route::get('/notification-summary', function (Request $request) {
            $user = $request->user();
            $cacheKey = "user_notification_summary.{$user->id}";
            
            $summary = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
                return [
                    'unread_notifications' => $user->notifications()->where('read', false)->count(),
                    'total_notifications' => $user->notifications()->count(),
                    'high_priority_unread' => $user->notifications()->where('read', false)->where('priority', 'high')->count(),
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        })->middleware('throttle:40,1');

        // User's ticket summary with caching
        Route::get('/ticket-summary', function (Request $request) {
            $user = $request->user();
            $cacheKey = "user_ticket_summary.{$user->id}";
            
            $summary = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
                if ($user->role === 'student') {
                    $tickets = $user->tickets();
                } elseif (in_array($user->role, ['counselor', 'advisor'])) {
                    $tickets = \App\Models\Ticket::where('assigned_to', $user->id);
                } else {
                    $tickets = \App\Models\Ticket::query();
                }
                
                return [
                    'open_tickets' => (clone $tickets)->whereIn('status', ['Open', 'In Progress'])->count(),
                    'total_tickets' => $tickets->count(),
                    'recent_activity' => (clone $tickets)->where('updated_at', '>=', now()->subDays(7))->count(),
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        })->middleware('throttle:40,1');
    });
});

// Health check route (no rate limiting for monitoring)
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
            'rate_limiting' => 'relaxed',
            'caching' => 'active',
        ]
    ]);
});

// API documentation endpoint
Route::get('/docs', function () {
    return response()->json([
        'success' => true,
        'message' => 'School Support Platform API',
        'version' => '1.0.0',
        'rate_limits' => [
            'notifications_unread_count' => '60 per minute',
            'notifications_list' => '120 per minute',
            'individual_actions' => '200 per minute',
            'bulk_operations' => '30 per minute',
            'ticket_operations' => '100-150 per minute',
        ],
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
})->middleware('throttle:20,1');

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