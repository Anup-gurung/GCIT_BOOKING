'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShieldCheck, Award, MessageCircle, StarHalf, Loader2, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';

export const dynamic = 'force-dynamic';

export default function RefereesPage() {
  const [referees, setReferees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReferee, setSelectedReferee] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => setUser(user));

    const fetchData = async () => {
      const { data: refData } = await supabase.from('referees').select('*');
      const { data: ratData } = await supabase.from('ratings').select('*, profiles(name)');
      
      if (refData) setReferees(refData);
      if (ratData) setRatings(ratData);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const handleRate = async () => {
    if (!user) {
      toast.error('Please log in to leave a review');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('ratings').insert([{
      user_id: user.id,
      referee_id: selectedReferee.id,
      rating,
      review
    }]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Review submitted!');
      // Update local state
      const { data: newRatings } = await supabase.from('ratings').select('*, profiles(name)');
      if (newRatings) setRatings(newRatings);
      setSelectedReferee(null);
      setRating(0);
      setReview('');
    }
    setSubmitting(false);
  };

  const getAvgRating = (refereeId: string) => {
    const refRatings = ratings.filter(r => r.referee_id === refereeId);
    if (refRatings.length === 0) return 0;
    return refRatings.reduce((acc, curr) => acc + curr.rating, 0) / refRatings.length;
  };

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#10B981] selection:text-black">
      <Navbar />
      <Toaster theme="dark" position="top-center" />

      <div className="pt-24 lg:pt-12 pb-20 px-6 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#10B981] mb-2">Our Community</h2>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white leading-none">Professional Referees</h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-white/20" size={40} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {referees.map(ref => {
              const avg = getAvgRating(ref.id);
              const count = ratings.filter(r => r.referee_id === ref.id).length;

              return (
                <motion.div
                  key={ref.id}
                  whileHover={{ y: -5 }}
                  className="glass p-10 flex flex-col group hover:border-[#10B981]/30 transition-all"
                >
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group-hover:scale-105 transition-transform">
                      <img src={`https://picsum.photos/seed/${ref.id}/80/80`} alt={ref.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-[#10B981]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{ref.name}</h3>
                      <p className="text-[10px] font-black text-[#10B981] flex items-center gap-1 uppercase tracking-widest mt-1">
                        <ShieldCheck size={12} />
                        {ref.experience} Exp.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex text-[#10B981]">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} fill={s <= Math.round(avg) ? 'currentColor' : 'none'} className={s <= avg ? '' : 'text-white/10'} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-white ml-auto">{avg.toFixed(1)}</span>
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">({count})</span>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    <button
                      onClick={() => setSelectedReferee(ref)}
                      className="w-full py-4 bg-[#10B981] text-black rounded-2xl font-bold hover:bg-[#0D9668] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#10B981]/10"
                    >
                      Rate Referee
                    </button>
                    
                    {count > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">
                          <MessageCircle size={12} />
                          Recent Reviews
                        </div>
                        <div className="space-y-4">
                          {ratings.filter(r => r.referee_id === ref.id).slice(0, 2).map(r => (
                            <div key={r.id} className="text-sm">
                              <p className="font-bold text-white/80">{r.profiles?.name || 'Anonymous'}</p>
                              <p className="text-white/40 mt-1 line-clamp-2 text-xs font-medium leading-relaxed italic">&quot;{r.review}&quot;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for Rating */}
      <AnimatePresence>
        {selectedReferee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReferee(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Rate {selectedReferee.name}</h2>
              <p className="text-gray-500 mb-8">Share your experience to help the community.</p>

              <div className="mb-8">
                <p className="text-sm font-bold text-gray-700 mb-3 ml-1">Overall Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className={`p-2 rounded-xl transition-all ${s <= rating ? 'text-yellow-400 scale-110' : 'text-gray-200'}`}
                    >
                      <Star size={32} fill={s <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="text-sm font-bold text-gray-700 mb-3 ml-1 block">Your Review</label>
                <textarea
                  rows={4}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-gray-200 outline-none transition-all resize-none"
                  placeholder="Tell us what you liked..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedReferee(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRate}
                  disabled={submitting}
                  className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group shadow-lg shadow-black/10 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : (
                    <>
                      Submit Review
                      <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
