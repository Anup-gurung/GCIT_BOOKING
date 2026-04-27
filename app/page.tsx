'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  isBefore, 
  startOfDay,
  getDay,
  addDays
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  Info,
  Trophy,
  Activity
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role === 'admin') {
          router.push('/admin');
          return;
        }
        
        setUser(user);
      }
    };

    checkUserAndRedirect();

    const fetchBookings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .gte('date', format(startOfMonth(currentMonth), 'yyyy-MM-dd'))
        .lte('date', format(endOfMonth(currentMonth), 'yyyy-MM-dd'));
      
      if (!error && data) setBookings(data);
      setLoading(false);
    };

    fetchBookings();

    const channel = supabase
      .channel('bookings_changes_home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentMonth, supabase]);

  const handleBookingRequest = (slot?: string) => {
    if (!user) {
      toast.error('Identity required to reserve slot');
      router.push('/login');
      return;
    }

    setPendingBookingSlot(slot || customTime);
    setShowConfirmation(true);
  };

  const handleBooking = async (slot?: string) => {
    if (!user) {
      toast.error('Identity required to reserve slot');
      router.push('/login');
      return;
    }

    const timeSlot = useCustomTime ? customTime : (slot || pendingBookingSlot);
    
    if (!timeSlot || timeSlot.trim() === '') {
      toast.error('Please enter a valid time slot');
      return;
    }

    setBookingInProgress(true);
    const { error } = await supabase.from('bookings').insert([
      {
        user_id: user.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: timeSlot,
      }
    ]);

    if (error) {
      if (error.code === '23505') {
        toast.error('Slot already claimed by another athlete');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Battleground reserved successfully');
      setCustomTime('');
      setUseCustomTime(false);
    }
    setBookingInProgress(false);
  };

  const isMondaySelection = getDay(selectedDate) === 1;
  const slots = getAvailableSlots(selectedDate);

  return (
    <main className="min-h-screen bg-[#050505] font-sans selection:bg-[#10B981] selection:text-black">
      <Navbar />
      <Toaster theme="dark" position="top-center" />

      {/* Header section with minimal landing content that leads directly to booking */}
      <section className="pt-24 lg:pt-12 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-[10px] uppercase font-black tracking-widest border border-[#10B981]/20 mb-6 backdrop-blur-md">
            <Activity size={12} />
            <span>Real-time availability active</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white leading-none mb-4">
            Book Your Football <span className="text-[#10B981]">Ground.</span>
          </h1>
          <p className="text-white/40 text-lg font-medium leading-relaxed max-w-md">
            Professional turf, seamless booking, and instant confirmation.
          </p>
        </div>
      </section>

      {/* Booking Interface */}
      <section className="px-4 md:px-6 max-w-7xl mx-auto pb-20">
        <div className="grid lg:grid-cols-12 gap-6 md:gap-12">
          
          {/* Calendar */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-4 md:p-8 lg:p-12 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 md:p-8 opacity-[0.03] pointer-events-none">
                 <Trophy size={120} className="md:w-[180px] md:h-[180px]" />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 md:mb-16 relative z-10 gap-4 md:gap-8">
                <div>
                   <h2 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[#10B981] mb-2 md:mb-3">01. Choose Date</h2>
                   <p className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tighter">{format(currentMonth, 'MMM yyyy')}</p>
                </div>
                <div className="flex gap-1 md:gap-2 bg-white/5 p-2 md:p-3 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-md shrink-0">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 md:p-4 hover:bg-white/10 rounded-lg md:rounded-2xl transition-all text-white/40 hover:text-white group">
                    <ChevronLeft size={18} className="md:w-6 md:h-6 group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 md:p-4 hover:bg-white/10 rounded-lg md:rounded-2xl transition-all text-white/40 hover:text-white group">
                    <ChevronRight size={18} className="md:w-6 md:h-6 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 md:gap-4 mb-3 md:mb-6 place-items-center relative z-10">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                  <div key={d} className="text-center text-[7px] md:text-[10px] font-black text-white/30 uppercase tracking-[0.15em] md:tracking-[0.2em]">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-4 relative z-10">
                {renderCells(currentMonth, selectedDate, setSelectedDate, bookings)}
              </div>

              <div className="mt-6 md:mt-12 pt-4 md:pt-8 border-t border-white/10 flex flex-wrap gap-3 md:gap-8 text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-white/40 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 md:w-4 h-2.5 md:h-4 rounded-full bg-[#10B981]" /> Available
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 md:w-4 h-2.5 md:h-4 rounded-full bg-white/10 border border-white/20" /> Reserved
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 md:w-4 h-2.5 md:h-4 rounded-full border-2 border-red-500/40" /> Maintenance
                </div>
              </div>
            </motion.div>
          </div>

          {/* Slots */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass p-4 md:p-8 lg:p-10 shadow-2xl sticky top-20 md:top-24"
            >
              <div className="mb-6 md:mb-8 border-b border-white/5 pb-4 md:pb-6">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tighter">{format(selectedDate, 'EEE, MMM do')}</h3>
                {isMondaySelection ? (
                  <p className="text-red-400 font-bold text-[9px] md:text-[10px] mt-2 uppercase tracking-wider">Ground closed for maintenance</p>
                ) : (
                  <p className="text-xs md:text-sm text-white/40 mt-1 font-medium">Select your session</p>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isMondaySelection ? (
                  <motion.div
                    key="maint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 md:p-10 text-center bg-red-500/5 rounded-2xl md:rounded-3xl border border-red-500/10"
                  >
                    <ShieldAlert size={32} className="md:w-10 mx-auto text-red-500/20 mb-3 md:mb-4" />
                    <p className="text-[9px] md:text-[10px] text-red-400 font-black uppercase tracking-[0.2em]">Maintenance Day</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="slots"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2 md:space-y-3 max-h-[300px] md:max-h-[480px] overflow-y-auto pr-2 custom-scrollbar"
                  >
                    {slots.length > 0 ? slots.map(slot => {
                      const isBooked = bookings.some(b => b.date === format(selectedDate, 'yyyy-MM-dd') && b.time_slot === slot);
                      return (
                        <button
                          key={slot}
                          disabled={isBooked || bookingInProgress || useCustomTime}
                          onClick={() => {
                            setUseCustomTime(false);
                            handleBookingRequest(slot);
                          }}
                          className={`w-full p-3 md:p-5 rounded-lg md:rounded-2xl flex flex-col gap-1 transition-all text-left relative group ${
                            isBooked 
                              ? 'bg-white/5 opacity-30 grayscale cursor-not-allowed' 
                              : useCustomTime
                              ? 'bg-white/5 opacity-40 cursor-not-allowed'
                              : 'bg-white/5 border border-white/5 hover:border-[#10B981]/50 hover:bg-[#10B981]/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-sm md:text-lg ${isBooked || useCustomTime ? 'text-white/20' : 'text-white'}`}>{slot}</span>
                            {!isBooked && !useCustomTime && <CheckCircle2 size={14} className="md:w-4 md:h-4 text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                          <span className={`text-[8px] md:text-[9px] uppercase tracking-widest font-black ${isBooked || useCustomTime ? 'text-white/10' : 'text-[#10B981]/50'}`}>
                            {isBooked ? 'Reserved' : useCustomTime ? 'Custom Time Active' : 'Ready'}
                          </span>
                        </button>
                      );
                    }) : (
                      <div className="p-6 md:p-10 text-center text-white/10">
                        <Info size={24} className="md:w-8 mx-auto mb-2" />
                        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Full day available - set custom time</p>
                      </div>
                    )}
                    
                    {/* Custom Time Section */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={() => setUseCustomTime(!useCustomTime)}
                        className={`w-full p-3 md:p-4 rounded-lg md:rounded-2xl flex items-center justify-between transition-all ${
                          useCustomTime
                            ? 'bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981]'
                            : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-[#10B981]/30'
                        }`}
                      >
                        <span className="text-xs md:text-sm font-bold uppercase tracking-widest">
                          {useCustomTime ? '✓ Custom Time' : '+ Add Custom Time'}
                        </span>
                      </button>
                      
                      {useCustomTime && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-3"
                        >
                          <input
                            type="text"
                            placeholder="e.g., 09:00 - 11:00"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-white placeholder:text-white/30 text-xs md:text-sm outline-none focus:border-[#10B981]/50 focus:bg-white/10 transition-all"
                          />
                          <button
                            disabled={!customTime.trim() || bookingInProgress}
                            onClick={() => handleBookingRequest()}
                            className="w-full px-3 md:px-4 py-2 md:py-3 bg-[#10B981] text-black rounded-lg md:rounded-xl font-bold uppercase tracking-widest text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0D9668] transition-all"
                          >
                            {bookingInProgress ? 'Booking...' : 'Book Custom Time'}
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {bookingInProgress && (
                <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-white/30">
                  <Loader2 className="animate-spin text-[#10B981] w-3 md:w-4" size={12} />
                  Booking...
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ground Info Section */}
      <section className="px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 pb-20">
         <div className="glass p-10">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight">Weekly Schedule</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Tue - Fri</span>
                  <span className="text-sm font-bold text-[#10B981]">6-8 AM, 4-10 PM</span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sat - Sun</span>
                  <span className="text-sm font-bold text-white">All Day (6 AM - 10 PM)</span>
               </div>
               <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-red-500/10">
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Monday</span>
                  <span className="text-xs font-black uppercase text-red-400 tracking-widest">Maintenance</span>
               </div>
            </div>
         </div>
         <div className="glass p-10 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Protocol & Access</h3>
            <p className="text-white/40 text-sm font-medium leading-relaxed italic">
               &quot;Reservations are held for 15 minutes. Professional turf shoes only. Cancellations via profile dashboard.&quot;
            </p>
         </div>
      </section>

      {/* Booking Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmation(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md glass p-8 md:p-12 rounded-3xl border-2 border-[#10B981]/40 bg-gradient-to-br from-[#10B981]/10 to-white/[0.02]">
                <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tighter mb-2">Confirm Booking</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10B981] mb-6">Are you sure?</p>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Date</p>
                    <p className="text-lg font-bold text-white">{format(selectedDate, 'EEEE, MMM do, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Time</p>
                    <p className="text-lg font-bold text-[#10B981]">{pendingBookingSlot || customTime}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-6 py-3 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={bookingInProgress}
                    onClick={() => {
                      setShowConfirmation(false);
                      handleBooking(pendingBookingSlot || undefined);
                    }}
                    className="flex-1 px-6 py-3 bg-[#10B981] text-black rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#0D9668] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {bookingInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Yes, Book It!'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

function renderCells(currentMonth: Date, selectedDate: Date, onDateClick: (d: Date) => void, bookings: any[]) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const cells = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
        const d = day;
        const isSelected = isSameDay(d, selectedDate);
        const isToday = isSameDay(d, new Date());
        const isCurrentMonth = isSameMonth(d, monthStart);
        const isPast = isBefore(d, startOfDay(new Date()));
        const isMon = getDay(d) === 1;
        
        const dailySlots = getAvailableSlots(d);
        const dailyBookings = bookings.filter(b => b.date === format(d, 'yyyy-MM-dd'));
        const isFullyBooked = !isMon && dailySlots.length > 0 && dailyBookings.length >= dailySlots.length;

        cells.push(
          <motion.button
            key={day.toString()}
            whileHover={!isPast && isCurrentMonth ? { scale: 1.1 } : {}}
            disabled={isPast || !isCurrentMonth}
            onClick={() => onDateClick(d)}
            className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-xs md:text-base lg:text-lg font-black transition-all relative group ${
              !isCurrentMonth ? 'text-white/10 cursor-default' : 
              isSelected ? 'bg-[#10B981] text-black scale-110 z-20 shadow-[0_0_30px_rgba(16,185,129,0.4)] ring-4 ring-[#10B981]/30' :
              isToday ? 'bg-white/10 text-white border-2 border-[#10B981]/50' :
              isMon ? 'bg-red-500/10 text-red-500/30 border-2 border-red-500/20 cursor-not-allowed' :
              isFullyBooked ? 'bg-white/5 text-white/10 border-2 border-white/10' :
              'bg-white/5 border-2 border-white/10 hover:border-[#10B981]/60 text-white/60 hover:text-white hover:bg-white/[0.08]'
            } ${isPast ? 'opacity-20 grayscale pointer-events-none' : ''}`}
          >
            <span className="relative z-10 tracking-tight">{format(d, 'd')}</span>
            {isCurrentMonth && !isPast && !isMon && !isSelected && (
              <motion.div 
                className={`absolute bottom-1 md:bottom-2 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${isFullyBooked ? 'bg-white/20' : 'bg-[#10B981]'} transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]`}
                animate={!isFullyBooked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            {isMon && isCurrentMonth && !isPast && (
               <div className="absolute top-1 right-1 md:top-2 md:right-2 opacity-60">
                  <ShieldAlert size={8} className="md:w-3 text-red-500" />
               </div>
            )}
          </motion.button>
        );
        day = addDays(day, 1);
    }
  }
  return cells;
}

function getAvailableSlots(date: Date) {
  const day = getDay(date);
  if (day === 1) return []; // Monday
  if (day === 0 || day === 6) return generateTimeSlots('06:00', '19:00'); // Weekends
  const morning = generateTimeSlots('06:00', '08:00');
  const evening = generateTimeSlots('16:00', '19:00');
  return [...morning, ...evening];
}

function generateTimeSlots(start: string, end: string) {
  const slots = [];
  let current = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);
  while (current + 2 <= endHour) {
    const next = current + 2;
    const formatLabel = (h: number) => `${h.toString().padStart(2, '0')}:00`;
    slots.push(`${formatLabel(current)} - ${formatLabel(next)}`);
    current += 2;
  }
  return slots;
}
