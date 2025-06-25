<?php
// database/seeders/TicketSeeder.php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Ticket;
use App\Models\TicketResponse;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing users from your seeder
        $student = User::where('email', 'student@university.edu')->first();
        $counselor = User::where('email', 'counselor@university.edu')->first();
        $advisor = User::where('email', 'advisor@university.edu')->first();
        
        // Additional students
        $johnSmith = User::where('email', 'john.smith@university.edu')->first();
        $emmaRodriguez = User::where('email', 'emma.rodriguez@university.edu')->first();
        $davidJohnson = User::where('email', 'david.johnson@university.edu')->first();
        $lisaWang = User::where('email', 'lisa.wang@university.edu')->first();

        // Create sample tickets
        if ($student && $counselor) {
            // Ticket 1: Technical issue (In Progress)
            $ticket1 = Ticket::create([
                'user_id' => $student->id,
                'subject' => 'Unable to access course materials',
                'description' => 'I am having trouble accessing the course materials for Psychology 101. When I click on the link, it shows an error message saying "Access Denied". This has been happening for the past 2 days and I need to complete my assignment.',
                'category' => 'technical',
                'priority' => 'Medium',
                'status' => 'In Progress',
                'assigned_to' => $counselor->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subHours(4),
            ]);

            // Add responses to ticket 1
            TicketResponse::create([
                'ticket_id' => $ticket1->id,
                'user_id' => $student->id,
                'message' => 'I am having trouble accessing the course materials for Psychology 101. When I click on the link, it shows an error message saying "Access Denied". This has been happening for the past 2 days and I need to complete my assignment.',
                'is_internal' => false,
                'created_at' => now()->subDays(2),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket1->id,
                'user_id' => $counselor->id,
                'message' => 'Thank you for reporting this issue. I can see the problem and have escalated it to our technical team. You should have access restored within 24 hours. I will keep you updated on the progress.',
                'is_internal' => false,
                'created_at' => now()->subDays(1),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket1->id,
                'user_id' => $counselor->id,
                'message' => 'Student reports technical issue with Psychology 101 course materials. Escalated to IT department. Priority: Medium due to assignment deadline.',
                'is_internal' => true,
                'visibility' => 'counselors',
                'created_at' => now()->subHours(20),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket1->id,
                'user_id' => $counselor->id,
                'message' => 'Good news! Our technical team has identified and fixed the issue. The course materials should now be accessible. Please try logging in again and let me know if you continue to experience any problems.',
                'is_internal' => false,
                'created_at' => now()->subHours(4),
            ]);
        }

        if ($johnSmith && $advisor) {
            // Ticket 2: Academic planning (Open)
            $ticket2 = Ticket::create([
                'user_id' => $johnSmith->id,
                'subject' => 'Course selection guidance for next semester',
                'description' => 'I need help selecting courses for the spring semester. I want to make sure I am on track for graduation and taking the right prerequisites for my Computer Science major. I am particularly confused about the math requirements.',
                'category' => 'academic',
                'priority' => 'Low',
                'status' => 'Open',
                'assigned_to' => $advisor->id,
                'created_at' => now()->subDays(1),
                'updated_at' => now()->subDays(1),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket2->id,
                'user_id' => $johnSmith->id,
                'message' => 'I need help selecting courses for the spring semester. I want to make sure I am on track for graduation and taking the right prerequisites for my Computer Science major. I am particularly confused about the math requirements.',
                'is_internal' => false,
                'created_at' => now()->subDays(1),
            ]);
        }

        if ($emmaRodriguez && $counselor) {
            // Ticket 3: Mental health support (High priority, crisis flag)
            $ticket3 = Ticket::create([
                'user_id' => $emmaRodriguez->id,
                'subject' => 'Feeling overwhelmed with academic pressure',
                'description' => 'I have been feeling extremely overwhelmed lately with all my courses and assignments. I feel hopeless and like I cannot keep up. Sometimes I feel like I want to give up entirely. I need someone to talk to about these feelings.',
                'category' => 'mental-health',
                'priority' => 'High',
                'status' => 'In Progress',
                'assigned_to' => $counselor->id,
                'crisis_flag' => true,
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(2),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket3->id,
                'user_id' => $emmaRodriguez->id,
                'message' => 'I have been feeling extremely overwhelmed lately with all my courses and assignments. I feel hopeless and like I cannot keep up. Sometimes I feel like I want to give up entirely. I need someone to talk to about these feelings.',
                'is_internal' => false,
                'created_at' => now()->subHours(6),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket3->id,
                'user_id' => $counselor->id,
                'message' => 'Thank you for reaching out - that took courage. I want you to know that you are not alone and these feelings are valid. I have scheduled an urgent appointment for you today at 3:00 PM. Please call our crisis line at (555) 123-4567 if you need immediate support.',
                'is_internal' => false,
                'created_at' => now()->subHours(5),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket3->id,
                'user_id' => $counselor->id,
                'message' => 'CRISIS FLAG: Student expressing hopelessness and suicidal ideation. Immediate intervention scheduled. Following up with emergency protocols.',
                'is_internal' => true,
                'visibility' => 'counselors',
                'is_urgent' => true,
                'created_at' => now()->subHours(5),
            ]);
        }

        if ($davidJohnson) {
            // Ticket 4: Administrative (Resolved)
            $ticket4 = Ticket::create([
                'user_id' => $davidJohnson->id,
                'subject' => 'Transcript request processing delay',
                'description' => 'I submitted a transcript request 3 weeks ago for graduate school applications, but I have not received any updates. The deadline for my applications is approaching.',
                'category' => 'administrative',
                'priority' => 'Medium',
                'status' => 'Resolved',
                'resolved_at' => now()->subDays(2),
                'created_at' => now()->subWeeks(2),
                'updated_at' => now()->subDays(2),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket4->id,
                'user_id' => $davidJohnson->id,
                'message' => 'I submitted a transcript request 3 weeks ago for graduate school applications, but I have not received any updates. The deadline for my applications is approaching.',
                'is_internal' => false,
                'created_at' => now()->subWeeks(2),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket4->id,
                'user_id' => $counselor->id,
                'message' => 'I have contacted the registrar office about your transcript request. They confirmed it is being processed and will be completed within 2 business days. You will receive an email confirmation once it is sent.',
                'is_internal' => false,
                'created_at' => now()->subDays(3),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket4->id,
                'user_id' => $davidJohnson->id,
                'message' => 'Perfect! I received the transcript confirmation email this morning. Thank you so much for following up on this.',
                'is_internal' => false,
                'created_at' => now()->subDays(2),
            ]);
        }

        if ($lisaWang) {
            // Ticket 5: Other category (Closed)
            $ticket5 = Ticket::create([
                'user_id' => $lisaWang->id,
                'subject' => 'Parking permit renewal question',
                'description' => 'My parking permit expires next month and I am not sure how to renew it. The website is confusing and I cannot find the renewal form.',
                'category' => 'other',
                'priority' => 'Low',
                'status' => 'Closed',
                'resolved_at' => now()->subDays(5),
                'created_at' => now()->subWeek(),
                'updated_at' => now()->subDays(5),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket5->id,
                'user_id' => $lisaWang->id,
                'message' => 'My parking permit expires next month and I am not sure how to renew it. The website is confusing and I cannot find the renewal form.',
                'is_internal' => false,
                'created_at' => now()->subWeek(),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket5->id,
                'user_id' => $counselor->id,
                'message' => 'You can renew your parking permit online at parking.university.edu/renew or visit the parking office in the Student Services building. The renewal form is under "Current Students" section. Let me know if you need any other assistance!',
                'is_internal' => false,
                'created_at' => now()->subDays(6),
            ]);

            TicketResponse::create([
                'ticket_id' => $ticket5->id,
                'user_id' => $lisaWang->id,
                'message' => 'Found it! Thank you for the direct link. I was able to renew online successfully.',
                'is_internal' => false,
                'created_at' => now()->subDays(5),
            ]);
        }

        // Create some unassigned tickets for admin dashboard
        if ($student) {
            Ticket::create([
                'user_id' => $student->id,
                'subject' => 'Library access card not working',
                'description' => 'My student ID card is not working to access the library after hours. I tried multiple times but the scanner does not recognize it.',
                'category' => 'technical',
                'priority' => 'Low',
                'status' => 'Open',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ]);
        }

        if ($johnSmith) {
            Ticket::create([
                'user_id' => $johnSmith->id,
                'subject' => 'Financial aid documentation question',
                'description' => 'I received a request for additional financial aid documentation but I am not sure what specific documents they need. The email was not very clear.',
                'category' => 'administrative',
                'priority' => 'Medium',
                'status' => 'Open',
                'created_at' => now()->subMinutes(30),
                'updated_at' => now()->subMinutes(30),
            ]);
        }

        $this->command->info('Sample tickets and responses created successfully!');
        $this->command->info('Created tickets with various statuses: Open, In Progress, Resolved, Closed');
        $this->command->info('Included crisis-flagged ticket for testing emergency protocols');
    }
}