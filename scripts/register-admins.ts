#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🔐 Arena Hub Admin Pre-Registration CLI\n');

  const adminsJson = path.join(process.cwd(), 'admins.json');

  // Check if admins.json exists
  if (!fs.existsSync(adminsJson)) {
    console.log(
      '📝 No admins.json file found. Creating a template...\n'
    );

    const template = [
      {
        email: 'admin1@example.com',
        name: 'Admin One',
        password: 'SecurePassword123!',
      },
      {
        email: 'admin2@example.com',
        name: 'Admin Two',
        password: 'SecurePassword456!',
      },
    ];

    fs.writeFileSync(adminsJson, JSON.stringify(template, null, 2));
    console.log(
      `✅ Created admins.json template at: ${adminsJson}\n`
    );
    console.log(
      '📋 Edit this file with your admin details and run this script again.\n'
    );
    console.log(
      'Example format:\n[\n  {\n    "email": "admin@example.com",\n    "name": "Admin Name",\n    "password": "YourSecurePassword123!"\n  }\n]\n'
    );
    rl.close();
    process.exit(0);
  }

  try {
    const adminsList = JSON.parse(fs.readFileSync(adminsJson, 'utf-8'));

    if (!Array.isArray(adminsList) || adminsList.length === 0) {
      console.error(
        '❌ Invalid admins.json format. Must be an array with at least one admin.\n'
      );
      rl.close();
      process.exit(1);
    }

    // Validate admin entries
    for (const admin of adminsList) {
      if (!admin.email || !admin.name) {
        console.error('❌ Each admin must have email and name fields.\n');
        rl.close();
        process.exit(1);
      }
    }

    console.log(`📊 Found ${adminsList.length} admin(s) in admins.json:\n`);
    adminsList.forEach((admin: any, idx: number) => {
      console.log(`  ${idx + 1}. ${admin.name} (${admin.email})`);
    });

    const confirm = await question(
      '\n✓ Proceed with registration? (yes/no): '
    );

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Registration cancelled.\n');
      rl.close();
      process.exit(0);
    }

    console.log(
      '\n🚀 Starting admin registration via API...\n'
    );

    // You'll need to implement this with actual API call
    console.log(
      '📌 Note: API registration requires valid Supabase credentials.\n'
    );
    console.log(
      'To use this CLI script, you need to:\n'
    );
    console.log(
      '1. Set up environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)\n'
    );
    console.log(
      '2. Or manually run the registration via the /admin-registration page\n'
    );

    rl.close();
  } catch (error: any) {
    console.error('❌ Error reading admins.json:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
