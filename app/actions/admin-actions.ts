'use server';

import { createClient } from '@/lib/supabase/server';

export async function createAdminUser(email: string, password: string, name: string) {
  const supabase = await createClient();

  try {
    // Check if user already exists in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', email)
      .single();

    if (existingUser) {
      return { error: 'User already exists' };
    }

    // Sign up the admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Failed to create user' };
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
      return { error: profileError.message };
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        email,
        name,
        role: 'admin',
      },
    };
  } catch (error: any) {
    return { error: error.message || 'An error occurred' };
  }
}

export async function preRegisterAdminsByEmail(admins: Array<{ email: string; name: string; password?: string }>) {
  const supabase = await createClient();
  const results = [];

  for (const admin of admins) {
    try {
      // Generate a random password if not provided
      const password = admin.password || generateSecurePassword();

      // Sign up the admin user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password,
        email_confirm: true,
      });

      if (authError) {
        results.push({
          email: admin.email,
          success: false,
          error: authError.message,
        });
        continue;
      }

      if (!authData.user) {
        results.push({
          email: admin.email,
          success: false,
          error: 'Failed to create user',
        });
        continue;
      }

      // Create profile with admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: admin.name,
            role: 'admin',
          },
        ]);

      if (profileError) {
        results.push({
          email: admin.email,
          success: false,
          error: profileError.message,
        });
        continue;
      }

      results.push({
        email: admin.email,
        name: admin.name,
        success: true,
        password: admin.password ? undefined : password, // Only return if auto-generated
      });
    } catch (error: any) {
      results.push({
        email: admin.email,
        success: false,
        error: error.message || 'An error occurred',
      });
    }
  }

  return results;
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
