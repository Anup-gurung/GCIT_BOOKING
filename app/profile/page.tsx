'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  Trash2, 
  ShieldCheck, 
  ChevronRight,
  Loader2,
  Trophy,
  History
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const [
        { data: profData },
        { data: bookData }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('bookings').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      if (profData) setProfile(profData);
      if (bookData) setBookings(bookData);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const cancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Booking cancelled');
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBFBFB]">
       <Loader2 className="animate-spin text-gray-300" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#10B981] selection:text-black pb-20">
      <Navbar />
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <section className="pt-24 lg:pt-12 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
           <div className="w-32 h-32 rounded-[2rem] bg-white/5 overflow-hidden shadow-2xl border border-white/10 relative group">
              <img src={`https://picsum.photos/seed/${user.id}/128/128`} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#10B981]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>
           <div className="text-center md:text-left">
              <h1 className="text-5xl font-bold tracking-tighter text-white mb-4 leading-none">{profile?.name || 'Elite Player'}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                 <span className="text-[10px] font-black px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 shadow-sm flex items-center gap-2 uppercase tracking-widest">
                    <History size={12} />
                    {bookings.length} Games
                 </span>
                 <span className="text-[10px] font-black px-4 py-2 bg-[#10B981]/10 border border-[#10B981]/20 rounded-full text-[#10B981] shadow-sm flex items-center gap-2 uppercase tracking-widest">
                    <ShieldCheck size={12} />
                    Verified Academy
                 </span>
              </div>
           </div>
        </div>
      </section>

      {/* Content */}
      <div className="px-6 max-w-7xl mx-auto grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Match History</h2>
           </div>

           {bookings.length === 0 ? (
             <div className="glass p-20 text-center">
                <CalendarIcon size={48} className="mx-auto text-white/5 mb-6" />
                <p className="text-white/20 font-bold uppercase tracking-widest mb-6">No records found in current season</p>
                <button 
                  onClick={() => router.push('/book')}
                  className="px-10 py-4 bg-[#10B981] text-black rounded-2xl font-bold hover:bg-[#0D9668] transition-all"
                >
                  Book Your First Slot
                </button>
             </div>
           ) : (
             <div className="space-y-4">
               {bookings.map((b) => (
                 <motion.div
                   key={b.id}
                   layout
                   className="glass p-8 flex items-center justify-between shadow-sm hover:bg-white/5 transition-all group"
                 >
                   <div className="flex items-center gap-8">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:bg-[#10B981]/10 group-hover:text-[#10B981] transition-colors">
                        <CalendarIcon size={24} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white tracking-tight">{format(new Date(b.date), 'EEEE, MMM do')}</p>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {b.time_slot}</span>
                        </div>
                      </div>
                   </div>
                   <button
                     onClick={() => cancelBooking(b.id)}
                     className="p-3 text-white/5 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 size={20} />
                   </button>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

        <div className="space-y-8">
           <div className="bg-[#0A0A0A] p-10 rounded-[2.5rem] border border-white/5 text-white overflow-hidden relative group">
              <Trophy size={140} className="absolute -bottom-10 -right-10 text-[#10B981]/5 group-hover:scale-110 transition-transform duration-700" />
              <h3 className="text-2xl font-bold mb-6 tracking-tight relative z-10">Athletic Index</h3>
              <div className="space-y-8 relative z-10">
                 <div className="flex justify-between items-end border-b border-white/5 pb-6">
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Active Time</span>
                    <span className="text-4xl font-bold text-[#10B981]">{bookings.length}h</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-white/5 pb-6">
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Skill Level</span>
                    <span className="text-xl font-black uppercase tracking-widest">Unranked</span>
                 </div>
                 <div className="bg-white/5 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                    <p className="text-[10px] font-black text-[#10B981] uppercase tracking-widest mb-1">Global Standing</p>
                    <p className="text-xs font-medium text-white/40 leading-relaxed italic">Compete in 5 more matches to reveal your position in the city leaderboard.</p>
                 </div>
              </div>
           </div>

           <div className="glass p-10">
              <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Arena Protocol</h3>
              <p className="text-white/40 text-sm leading-relaxed mb-8 font-medium italic">
                Reservations are strict. 24h window for adjustments. Late arrivals risk losing slot priority.
              </p>
              <button className="w-full py-4 border border-white/5 rounded-2xl text-[10px] uppercase font-black tracking-widest text-white/60 hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                Ground Rules
                <ChevronRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
