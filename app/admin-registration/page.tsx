'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Loader2, X, Check, AlertCircle, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AdminToAdd {
  id: string;
  email: string;
  name: string;
  password: string;
}

interface RegistrationResult {
  email: string;
  name?: string;
  success: boolean;
  error?: string;
  password?: string;
}

export const dynamic = 'force-dynamic';

export default function AdminRegistration() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminToAdd[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<RegistrationResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error('You do not have admin privileges');
        router.push('/');
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const addAdmin = () => {
    if (!email || !name) {
      toast.error('Please fill in all fields');
      return;
    }

    const newAdmin: AdminToAdd = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      password: password || generatePassword(),
    };

    setAdmins([...admins, newAdmin]);
    setEmail('');
    setName('');
    setPassword('');
    toast.success('Admin added to list');
  };

  const removeAdmin = (id: string) => {
    setAdmins(admins.filter((admin) => admin.id !== id));
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const registerAdmins = async () => {
    if (admins.length === 0) {
      toast.error('Add at least one admin');
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          admins: admins.map((a) => ({
            email: a.email,
            name: a.name,
            password: a.password,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to register admins');
        return;
      }

      setResults(data.results);
      setShowResults(true);
      setAdmins([]);
      toast.success(`Successfully registered ${data.results.filter((r: any) => r.success).length} admin(s)`);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#10B981]" size={40} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      <Toaster theme="dark" position="top-center" />

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-[#10B981]/10 rounded-2xl text-[#10B981]">
                <UserPlus size={32} />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-white">Admin Pre-Registration</h1>
            <p className="text-white/60">Create new admin accounts in bulk</p>
          </div>

          {/* Results Section */}
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Registration Results</h2>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border ${
                      result.success
                        ? 'bg-[#10B981]/5 border-[#10B981]/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <Check size={18} className="text-[#10B981]" />
                          ) : (
                            <AlertCircle size={18} className="text-red-500" />
                          )}
                          <span className="font-semibold text-white">{result.email}</span>
                        </div>
                        {result.name && <p className="text-sm text-white/60 mt-1">Name: {result.name}</p>}
                        {result.error && <p className="text-sm text-red-400 mt-1">{result.error}</p>}
                        {result.password && (
                          <div className="mt-3 p-2 bg-white/5 rounded border border-white/10 flex items-center justify-between">
                            <code className="text-xs text-white/80 font-mono">{result.password}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(result.password!);
                                toast.success('Password copied!');
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Add Admin Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 border-white/10 space-y-6">
            <h2 className="text-2xl font-bold text-white">Add New Admin</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:bg-white/10 focus:border-[#10B981]/50 outline-none transition-all placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:bg-white/10 focus:border-[#10B981]/50 outline-none transition-all placeholder:text-white/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/80">Password (optional)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Auto-generated if left empty"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:bg-white/10 focus:border-[#10B981]/50 outline-none transition-all placeholder:text-white/30"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={addAdmin}
                  className="w-full px-6 py-3 bg-[#10B981] hover:bg-[#10B981]/90 text-black font-semibold rounded-xl transition-colors"
                >
                  Add Admin
                </button>
              </div>
            </div>
          </motion.div>

          {/* Admin List */}
          {admins.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 border-white/10 space-y-6">
              <h2 className="text-2xl font-bold text-white">Admins to Register ({admins.length})</h2>

              <div className="space-y-3">
                {admins.map((admin) => (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{admin.name}</p>
                      <p className="text-sm text-white/60">{admin.email}</p>
                      {admin.password && (
                        <p className="text-xs text-white/40 mt-1">Password: {admin.password.substring(0, 6)}...</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeAdmin(admin.id)}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={registerAdmins}
                disabled={submitting}
                className="w-full px-6 py-4 bg-[#10B981] hover:bg-[#10B981]/90 disabled:bg-white/10 text-black disabled:text-white/50 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Registering...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Register All Admins
                  </>
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
