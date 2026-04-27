import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if request has admin authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token and check if user is admin
    const { data: authData } = await supabase.auth.getUser(token);

    if (!authData.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create other admins' }, { status: 403 });
    }

    const body = await req.json();
    const { admins } = body;

    if (!Array.isArray(admins) || admins.length === 0) {
      return NextResponse.json({ error: 'Invalid admin list' }, { status: 400 });
    }

    const results = [];

    for (const admin of admins) {
      try {
        const { email, name, password } = admin;

        if (!email || !name) {
          results.push({
            email: email || 'unknown',
            success: false,
            error: 'Email and name are required',
          });
          continue;
        }

        // Check if user already exists
        const { data: existingAuth } = await supabase.auth.admin.getUserById(email);

        if (existingAuth?.user) {
          results.push({
            email,
            success: false,
            error: 'User already exists',
          });
          continue;
        }

        // Generate password if not provided
        const finalPassword = password || generateSecurePassword();

        // Create admin user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: finalPassword,
          email_confirm: true,
        });

        if (authError) {
          results.push({
            email,
            success: false,
            error: authError.message,
          });
          continue;
        }

        if (!authData.user) {
          results.push({
            email,
            success: false,
            error: 'Failed to create auth user',
          });
          continue;
        }

        // Create profile with admin role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              name,
              role: 'admin',
            },
          ]);

        if (profileError) {
          results.push({
            email,
            success: false,
            error: profileError.message,
          });
          continue;
        }

        results.push({
          email,
          name,
          success: true,
          password: password ? undefined : finalPassword,
        });
      } catch (error: any) {
        results.push({
          email: admin.email || 'unknown',
          success: false,
          error: error.message || 'An error occurred',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

function generateSecurePassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
