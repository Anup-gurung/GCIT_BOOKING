'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, User, LogOut, LayoutDashboard, Calendar, Users, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

function NavItem({ href, icon: Icon, children, isActive }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
        isActive 
          ? 'bg-[#10B981]/10 text-[#10B981] border-l-4 border-[#10B981]' 
          : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} className={isActive ? 'text-[#10B981]' : 'text-inherit'} />
      <span className="font-medium text-sm">{children}</span>
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      setUser(user);
      if (user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }: any) => setProfile(data));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }: any) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <>
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-white/5 flex-col z-50">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center">
              <Image src="/images/gcit-logo.svg" alt="GCIT Football" width={48} height={48} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white">GCIT</span>
              <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-widest">Football</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem href="/" icon={Calendar} isActive={pathname === '/'}>Book a Pitch</NavItem>
          <NavItem href="/referees" icon={Users} isActive={pathname === '/referees'}>Referees</NavItem>
          {profile?.role === 'admin' && (
            <NavItem href="/admin" icon={LayoutDashboard} isActive={pathname === '/admin'}>Admin Center</NavItem>
          )}
          {user && <NavItem href="/profile" icon={User} isActive={pathname === '/profile'}>My Profile</NavItem>}
        </nav>

        <div className="p-6 border-t border-white/5 bg-[#0A0A0A]">
          {user ? (
            <div className="flex items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-[#10B981]/30 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${user.id}/40/40`} alt="Profile" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{profile?.name || 'Player'}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Premium</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-white/20 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex w-full py-3 bg-[#10B981] text-black rounded-xl font-bold text-center items-center justify-center gap-2 hover:bg-[#0D9668] transition-colors"
            >
              Login
            </Link>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/40 font-semibold">Powered by <span className="text-[#10B981] font-bold">Namzoed</span></p>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-white/5 flex items-center justify-between px-6 z-[60]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 flex items-center justify-center">
            <Image src="/images/gcit-logo.svg" alt="GCIT Football" width={32} height={32} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">GCIT</span>
            <span className="text-[8px] text-[#10B981] font-bold uppercase">Football</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/40 font-semibold">Powered by <span className="text-[#10B981] font-bold">Namzoed</span></span>
          <button className="text-white/60" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="lg:hidden fixed inset-0 z-50 bg-[#050505] pt-20 p-6 flex flex-col"
          >
            <nav className="flex-1 space-y-2">
              <NavItem href="/" icon={Calendar} isActive={pathname === '/'}>Book a Pitch</NavItem>
              <NavItem href="/referees" icon={Users} isActive={pathname === '/referees'}>Referees</NavItem>
              {profile?.role === 'admin' && (
                <NavItem href="/admin" icon={LayoutDashboard} isActive={pathname === '/admin'}>Admin Center</NavItem>
              )}
              {user && <NavItem href="/profile" icon={User} isActive={pathname === '/profile'}>My Profile</NavItem>}
            </nav>
            <div className="mt-auto border-t border-white/5 pt-6">
              {user ? (
                <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 font-bold p-2">
                  <LogOut size={18} /> Logout
                </button>
              ) : (
                <Link href="/login" className="block w-full py-4 bg-[#10B981] text-black rounded-xl font-bold text-center">
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
