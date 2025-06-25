<?php
// database/seeders/UserSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'System Administrator',
            'email' => 'admin@schoolsupport.com',
            'password' => Hash::make('admin123'),
            'role' => User::ROLE_ADMIN,
            'status' => User::STATUS_ACTIVE,
            'employee_id' => 'EMP001',
            'email_verified_at' => now(),
        ]);

        // Create demo users for testing
        $demoUsers = [
            [
                'name' => 'Ada Balogun',
                'email' => 'student@university.edu',
                'password' => Hash::make('password'),
                'role' => User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
                'student_id' => 'STU001',
                'phone' => '+1234567890',
                'date_of_birth' => '2000-01-15',
            ],
            [
                'name' => 'Dr. Sarah Wilson',
                'email' => 'counselor@university.edu',
                'password' => Hash::make('password'),
                'role' => User::ROLE_COUNSELOR,
                'status' => User::STATUS_ACTIVE,
                'employee_id' => 'EMP002',
                'phone' => '+1234567891',
                'specializations' => ['Anxiety', 'Depression', 'Academic Stress'],
                'bio' => 'Licensed counselor with 10+ years of experience in student mental health.',
            ],
            [
                'name' => 'Prof. Michael Chen',
                'email' => 'advisor@university.edu',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADVISOR,
                'status' => User::STATUS_ACTIVE,
                'employee_id' => 'EMP003',
                'phone' => '+1234567892',
                'specializations' => ['Academic Planning', 'Career Guidance'],
                'bio' => 'Academic advisor specializing in student success and career development.',
            ],
            [
                'name' => 'Admin User',
                'email' => 'admin@university.edu',
                'password' => Hash::make('password'),
                'role' => User::ROLE_ADMIN,
                'status' => User::STATUS_ACTIVE,
                'employee_id' => 'EMP004',
                'phone' => '+1234567893',
            ],
        ];

        foreach ($demoUsers as $userData) {
            User::create(array_merge($userData, [
                'email_verified_at' => now(),
            ]));
        }

        // Create additional sample students
        $sampleStudents = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith@university.edu',
                'student_id' => 'STU002',
                'phone' => '+1234567894',
            ],
            [
                'name' => 'Emma Rodriguez',
                'email' => 'emma.rodriguez@university.edu',
                'student_id' => 'STU003',
                'phone' => '+1234567895',
            ],
            [
                'name' => 'David Johnson',
                'email' => 'david.johnson@university.edu',
                'student_id' => 'STU004',
                'phone' => '+1234567896',
            ],
            [
                'name' => 'Lisa Wang',
                'email' => 'lisa.wang@university.edu',
                'student_id' => 'STU005',
                'phone' => '+1234567897',
            ],
        ];

        foreach ($sampleStudents as $student) {
            User::create(array_merge($student, [
                'password' => Hash::make('password'),
                'role' => User::ROLE_STUDENT,
                'status' => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
                'date_of_birth' => fake()->dateTimeBetween('1995-01-01', '2005-12-31')->format('Y-m-d'),
            ]));
        }

        // Create additional counselors
        $sampleCounselors = [
            [
                'name' => 'Dr. Jennifer Brown',
                'email' => 'jennifer.brown@university.edu',
                'employee_id' => 'EMP005',
                'specializations' => ['Trauma Counseling', 'Group Therapy'],
                'bio' => 'Specialized in trauma-informed care and group counseling sessions.',
            ],
            [
                'name' => 'Dr. Robert Davis',
                'email' => 'robert.davis@university.edu',
                'employee_id' => 'EMP006',
                'specializations' => ['Crisis Intervention', 'Substance Abuse'],
                'bio' => 'Expert in crisis intervention and substance abuse counseling.',
            ],
        ];

        foreach ($sampleCounselors as $counselor) {
            User::create(array_merge($counselor, [
                'password' => Hash::make('password'),
                'role' => User::ROLE_COUNSELOR,
                'status' => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
                'phone' => fake()->phoneNumber(),
            ]));
        }

        $this->command->info('Users seeded successfully!');
        $this->command->info('Admin credentials: admin@schoolsupport.com / admin123');
        $this->command->info('Demo users: student@university.edu, counselor@university.edu, advisor@university.edu, admin@university.edu / password');
    }
}