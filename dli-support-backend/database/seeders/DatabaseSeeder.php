<?php
// database/seeders/DatabaseSeeder.php (Updated to include our new seeders)

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            NotificationSeeder::class,
            TicketSeeder::class,
        ]);
    }
}