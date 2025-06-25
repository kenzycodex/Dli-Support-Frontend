<?php
// app/Models/Ticket.php (Fixed with proper imports and model events)

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'user_id',
        'subject',
        'description',
        'category',
        'priority',
        'status',
        'assigned_to',
        'crisis_flag',
        'resolved_at',
    ];

    protected $casts = [
        'crisis_flag' => 'boolean',
        'resolved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Category constants
    const CATEGORY_TECHNICAL = 'technical';
    const CATEGORY_ACADEMIC = 'academic';
    const CATEGORY_MENTAL_HEALTH = 'mental-health';
    const CATEGORY_ADMINISTRATIVE = 'administrative';
    const CATEGORY_OTHER = 'other';

    // Priority constants
    const PRIORITY_LOW = 'Low';
    const PRIORITY_MEDIUM = 'Medium';
    const PRIORITY_HIGH = 'High';

    // Status constants
    const STATUS_OPEN = 'Open';
    const STATUS_IN_PROGRESS = 'In Progress';
    const STATUS_RESOLVED = 'Resolved';
    const STATUS_CLOSED = 'Closed';

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // Fixed: Use proper model event methods
        static::creating(function ($ticket) {
            if (!$ticket->ticket_number) {
                $ticket->ticket_number = self::generateTicketNumber();
            }
        });

        static::updated(function ($ticket) {
            // Create notification when ticket status changes
            if ($ticket->isDirty('status')) {
                $ticket->notifyStatusChange();
            }
        });
    }

    /**
     * Get the user that created the ticket
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the staff member assigned to the ticket
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get ticket responses
     */
    public function responses(): HasMany
    {
        return $this->hasMany(TicketResponse::class)->orderBy('created_at', 'asc');
    }

    /**
     * Get ticket attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    /**
     * Get public responses (not internal)
     */
    public function publicResponses(): HasMany
    {
        return $this->hasMany(TicketResponse::class)->where('is_internal', false)->orderBy('created_at', 'asc');
    }

    /**
     * Get internal responses (staff only)
     */
    public function internalResponses(): HasMany
    {
        return $this->hasMany(TicketResponse::class)->where('is_internal', true)->orderBy('created_at', 'asc');
    }

    /**
     * Scopes
     */
    public function scopeOpen($query)
    {
        return $query->whereIn('status', [self::STATUS_OPEN, self::STATUS_IN_PROGRESS]);
    }

    public function scopeClosed($query)
    {
        return $query->whereIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to', $userId);
    }

    public function scopeCrisis($query)
    {
        return $query->where('crisis_flag', true);
    }

    /**
     * Generate unique ticket number
     */
    public static function generateTicketNumber()
    {
        do {
            $number = 'T' . str_pad(rand(1, 9999), 3, '0', STR_PAD_LEFT);
        } while (self::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Get available categories
     */
    public static function getAvailableCategories(): array
    {
        return [
            self::CATEGORY_TECHNICAL => 'Technical Issues',
            self::CATEGORY_ACADEMIC => 'Academic Support',
            self::CATEGORY_MENTAL_HEALTH => 'Mental Health',
            self::CATEGORY_ADMINISTRATIVE => 'Administrative',
            self::CATEGORY_OTHER => 'Other',
        ];
    }

    /**
     * Get available priorities
     */
    public static function getAvailablePriorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
        ];
    }

    /**
     * Get available statuses
     */
    public static function getAvailableStatuses(): array
    {
        return [
            self::STATUS_OPEN => 'Open',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_RESOLVED => 'Resolved',
            self::STATUS_CLOSED => 'Closed',
        ];
    }

    /**
     * Check if ticket is open
     */
    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_OPEN, self::STATUS_IN_PROGRESS]);
    }

    /**
     * Check if ticket is closed
     */
    public function isClosed(): bool
    {
        return in_array($this->status, [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
    }

    /**
     * Assign ticket to a staff member
     */
    public function assignTo($userId)
    {
        $this->update([
            'assigned_to' => $userId,
            'status' => self::STATUS_IN_PROGRESS
        ]);

        // Create notification
        Notification::createForUser(
            $this->user_id,
            Notification::TYPE_TICKET,
            'Ticket Assigned',
            "Your ticket #{$this->ticket_number} has been assigned to a staff member.",
            Notification::PRIORITY_MEDIUM,
            ['ticket_id' => $this->id]
        );
    }

    /**
     * Resolve ticket
     */
    public function resolve()
    {
        $this->update([
            'status' => self::STATUS_RESOLVED,
            'resolved_at' => now()
        ]);
    }

    /**
     * Close ticket
     */
    public function close()
    {
        $this->update([
            'status' => self::STATUS_CLOSED,
            'resolved_at' => $this->resolved_at ?: now()
        ]);
    }

    /**
     * Notify about status change
     */
    private function notifyStatusChange()
    {
        $statusMessages = [
            self::STATUS_IN_PROGRESS => 'Your ticket is now being processed.',
            self::STATUS_RESOLVED => 'Your ticket has been resolved.',
            self::STATUS_CLOSED => 'Your ticket has been closed.',
        ];

        if (isset($statusMessages[$this->status])) {
            Notification::createForUser(
                $this->user_id,
                Notification::TYPE_TICKET,
                'Ticket Status Update',
                "Ticket #{$this->ticket_number}: {$statusMessages[$this->status]}",
                Notification::PRIORITY_MEDIUM,
                ['ticket_id' => $this->id]
            );
        }
    }
}