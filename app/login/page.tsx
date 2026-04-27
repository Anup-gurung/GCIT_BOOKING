'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Successfully logged in!');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
            email, 
            password,
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, name, role: 'user' }]);
          if (profileError) throw profileError;
        }
        toast.success('Account created! You can now login.');
      }
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 selection:bg-[#10B981] selection:text-black">
      <Toaster theme="dark" position="top-center" />
      
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-10 border-white/10"
        >
          <div className="mb-10 flex flex-col items-center">
            <Link href="/" className="mb-8 p-3 bg-[#10B981] rounded-2xl text-black shadow-lg shadow-[#10B981]/20">
              <Shield size={32} />
            </Link>
            <h1 className="text-4xl font-bold tracking-tighter text-white leading-none mb-2">
              {isLogin ? 'Login' : 'Register'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10B981]">
              {isLogin ? 'Enter your details' : 'Create a new account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:border-[#10B981]/50 outline-none transition-all placeholder:text-white/10"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:border-[#10B981]/50 outline-none transition-all placeholder:text-white/10"
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:bg-white/10 focus:border-[#10B981]/50 outline-none transition-all placeholder:text-white/10"
                placeholder="••••••••"
              />
            </div>

            <button
              disabled={loading}
              className="w-full mt-8 py-5 bg-[#10B981] text-black rounded-2xl font-bold hover:bg-[#0D9668] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-[#10B981]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                  <span className="uppercase tracking-widest text-sm font-black">{isLogin ? 'Login' : 'Register'}</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-white/20">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#10B981] hover:text-white transition-colors ml-1"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </div>
        </motion.div>
        
        <Link 
          href="/" 
          className="mt-10 mx-auto flex items-center justify-center gap-2 text-white/20 hover:text-[#10B981] transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ChevronLeft size={14} />
          Go Back
        </Link>
      </div>
    </div>
  );
}
