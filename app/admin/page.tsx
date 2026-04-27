'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Shield, 
  Trash2, 
  Plus, 
  UserPlus, 
  Star, 
  Loader2, 
  X,
  Search,
  Filter,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'referees' | 'users'>('bookings');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data State
  const [bookings, setBookings] = useState<any[]>([]);
  const [referees, setReferees] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);

  // Modal State
  const [showAddReferee, setShowAddReferee] = useState(false);
  const [newRefName, setNewRefName] = useState('');
  const [newRefExp, setNewRefExp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    const [
      { data: bookData },
      { data: refData },
      { data: profData },
      { data: ratData }
    ] = await Promise.all([
      supabase.from('bookings').select('*, user_id, date, time_slot, created_at').order('created_at', { ascending: false }),
      supabase.from('referees').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('ratings').select('*')
    ]);

    if (bookData) {
      // Enrich bookings with profile data
      const enrichedBookings = await Promise.all(
        bookData.map(async (booking: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', booking.user_id)
            .single();
          return {
            ...booking,
            profiles: profile || { id: booking.user_id, name: 'Unknown User', email: 'N/A' }
          };
        })
      );
      setBookings(enrichedBookings);
    }
    if (refData) setReferees(refData);
    if (profData) setProfiles(profData);
    if (ratData) setRatings(ratData);
    setLoading(false);
  };

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
        toast.error('Access denied. Admin only.');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchData();
    };

    checkRole();
  }, [supabase, router]);

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Booking cancelled');
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  const addReferee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.from('referees').insert([{ name: newRefName, experience: newRefExp }]).select().single();
    if (error) toast.error(error.message);
    else {
      toast.success('Referee added');
      setReferees([...referees, data]);
      setShowAddReferee(false);
      setNewRefName('');
      setNewRefExp('');
    }
    setSubmitting(false);
  };

  const deleteReferee = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all their ratings.')) return;
    const { error } = await supabase.from('referees').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Referee removed');
      setReferees(referees.filter(r => r.id !== id));
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#10B981] selection:text-black pb-20">
      <Navbar />
      <Toaster theme="dark" position="top-center" />

      <div className="pt-24 lg:pt-12 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
          <div className="text-center lg:text-left">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10B981] mb-2">Central Operations</h2>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-none">Admin Command</h1>
          </div>
          
          <div className="flex bg-[#0A0A0A] p-2 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl">
             <TabButton active={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')} icon={<CalendarIcon size={14} />} label="Bookings" />
             <TabButton active={activeTab === 'referees'} onClick={() => setActiveTab('referees')} icon={<Shield size={14} />} label="Referees" />
             <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={14} />} label="Players" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-white/10" size={48} />
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass shadow-2xl shadow-black/50 overflow-hidden border-white/5"
          >
            {activeTab === 'bookings' && (
              <div className="p-8 lg:p-12">
                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-white/40 text-lg">No bookings requested yet</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10B981] mb-4">01. Bookings</p>
                      <h2 className="text-4xl font-bold text-white tracking-tighter">All Reservations</h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Player</th>
                            <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Date</th>
                            <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Time Slot</th>
                            <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Booked On</th>
                            <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {bookings.map(b => (
                            <tr key={b.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-10 py-8 font-bold text-white tracking-tight">{b.profiles?.name || 'Unknown User'}</td>
                              <td className="px-10 py-8 text-white/60 font-medium text-sm">{new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                              <td className="px-10 py-8">
                                <span className="px-4 py-2 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-full text-[10px] font-black uppercase tracking-widest block w-fit">
                                  {b.time_slot}
                                </span>
                              </td>
                              <td className="px-10 py-8 text-white/40 text-sm">{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td className="px-10 py-8">
                                <button 
                                  onClick={() => deleteBooking(b.id)}
                                  className="p-3 text-white/5 group-hover:text-red-400 hover:bg-white/5 rounded-xl transition-all"
                                  title="Cancel booking"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'referees' && (
              <div className="p-12">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Active Duty Roster</h3>
                    <button 
                      onClick={() => setShowAddReferee(true)}
                      className="flex items-center gap-2 px-8 py-4 bg-[#10B981] text-black rounded-2xl font-bold hover:bg-[#0D9668] transition-all shadow-lg shadow-[#10B981]/10"
                    >
                      <Plus size={20} />
                      Recruit Official
                    </button>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-8">
                    {referees.map(ref => {
                      const avg = ratings.filter(r => r.referee_id === ref.id).reduce((acc, curr) => acc + curr.rating, 0) / (ratings.filter(r => r.referee_id === ref.id).length || 1);
                      return (
                        <div key={ref.id} className="p-8 glass bg-white/[0.03] flex items-center justify-between group hover:border-[#10B981]/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 group-hover:text-[#10B981] transition-colors">
                               <Shield size={24} />
                             </div>
                             <div>
                               <p className="font-bold text-white text-xl tracking-tight">{ref.name}</p>
                               <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">{ref.experience} Combat Exp.</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <div className="flex text-[#10B981] justify-end items-center gap-1.5">
                                   <Star size={12} fill="currentColor" />
                                   <span className="text-sm font-bold text-white leading-none">{avg.toFixed(1)}</span>
                                </div>
                             </div>
                             <button 
                                onClick={() => deleteReferee(ref.id)}
                                className="p-3 text-white/10 hover:text-red-400 bg-white/5 border border-white/5 rounded-xl transition-all"
                             >
                               <Trash size={20} />
                             </button>
                          </div>
                        </div>
                      )
                    })}
                 </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Subscriber</th>
                      <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Enlisted</th>
                      <th className="px-10 py-6 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {profiles.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-10 py-8 font-bold text-white tracking-tight">{p.name || 'Anonymous Entity'}</td>
                        <td className="px-10 py-8 text-white/40 font-medium italic">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="px-10 py-8">
                           <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                             p.role === 'admin' 
                             ? 'bg-[#10B981]/5 border-[#10B981]/20 text-[#10B981]' 
                             : 'bg-white/5 border-white/10 text-white/40'
                           }`}>
                             {p.role}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Referee Modal */}
      <AnimatePresence>
        {showAddReferee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddReferee(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md glass p-12 border-white/10">
                <h2 className="text-4xl font-bold text-white mb-2 tracking-tighter">New Personnel</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10B981] mb-10">Add official field operative</p>
                
                <form onSubmit={addReferee} className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Codename</label>
                      <input 
                        required 
                        value={newRefName} 
                        onChange={e => setNewRefName(e.target.value)} 
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:bg-white/10 focus:border-[#10B981]/50 transition-all placeholder:text-white/10"
                        placeholder="OFFICIAL NAME"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Rank / Duration</label>
                      <input 
                        required 
                        value={newRefExp} 
                        onChange={e => setNewRefExp(e.target.value)} 
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:bg-white/10 focus:border-[#10B981]/50 transition-all placeholder:text-white/10"
                        placeholder="SERVICE YEARS"
                      />
                   </div>
                   <div className="flex gap-4 pt-6">
                      <button type="button" onClick={() => setShowAddReferee(false)} className="flex-1 py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Discard</button>
                      <button disabled={submitting} type="submit" className="flex-[2] py-4 bg-[#10B981] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/10">
                        {submitting ? <Loader2 className="animate-spin" /> : 'Confirm Recruit'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-[#10B981] text-black shadow-lg shadow-[#10B981]/20' : 'text-white/20 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
