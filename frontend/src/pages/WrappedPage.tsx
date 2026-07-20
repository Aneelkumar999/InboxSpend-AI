import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getWrappedStats } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Share2, DollarSign, Heart, Moon, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SLIDE_DURATION = 5000; // 5 seconds per slide

export default function WrappedPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['wrappedStats'],
    queryFn: getWrappedStats,
  });

  const totalSlides = 5;

  useEffect(() => {
    if (isLoading) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev === totalSlides - 1) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [currentSlide, isLoading]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide((prev) => prev - 1);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50 text-white">
        <div className="text-xl animate-pulse font-display">Generating your Wrapped...</div>
      </div>
    );
  }

  const stats = data;

  const slides = [
    // Slide 1: Intro
    <div key="slide-1" className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-8 text-center relative overflow-hidden">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="z-10">
        <h2 className="text-6xl font-display font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
          InboxSpend
        </h2>
        <h1 className="text-7xl font-display font-black tracking-tighter mb-8">
          WRAPPED
        </h1>
        <p className="text-2xl text-purple-200">Let's look back at where all your money went.</p>
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
    </div>,

    // Slide 2: Total Spent
    <div key="slide-2" className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-tr from-rose-600 to-orange-500 text-white p-8 text-center">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <DollarSign size={80} className="mx-auto mb-6 opacity-80" />
        <h3 className="text-3xl font-medium mb-4">This year, you spent</h3>
        <p className="text-7xl font-display font-black tracking-tighter mb-6 shadow-black drop-shadow-xl">
          ₹{Number(stats?.total_spent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
        <p className="text-xl opacity-90">We won't tell your accountant.</p>
      </motion.div>
    </div>,

    // Slide 3: Top Merchant
    <div key="slide-3" className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-b from-emerald-500 to-teal-900 text-white p-8 text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <Heart size={80} className="mx-auto mb-6 text-pink-400 fill-pink-400" />
        <h3 className="text-3xl font-medium mb-4">Your True Love was...</h3>
        <p className="text-6xl font-display font-black tracking-tighter text-yellow-300 mb-4 drop-shadow-lg uppercase">
          {stats?.top_merchant}
        </p>
        <p className="text-2xl font-bold mb-2">₹{Number(stats?.top_merchant_amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        <p className="text-lg opacity-80">You spent the most money here. Mostly on {stats?.top_category}.</p>
      </motion.div>
    </div>,

    // Slide 4: Toxic Trait
    <div key="slide-4" className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-900 to-blue-900 text-white p-8 text-center">
      <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex justify-center space-x-6 mb-8">
          <Moon size={64} className="text-blue-300" />
          <CalendarDays size={64} className="text-indigo-300" />
        </div>
        <h3 className="text-3xl font-medium mb-8">Your toxic traits:</h3>
        
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl mb-4">
          <p className="text-xl mb-2">You made</p>
          <p className="text-4xl font-black text-pink-400">{stats?.late_night_purchases}</p>
          <p className="text-lg">purchases between Midnight & 5 AM.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl">
          <p className="text-xl mb-2">Your busiest shopping day is</p>
          <p className="text-4xl font-black text-yellow-400">{stats?.busiest_day}</p>
        </div>
      </motion.div>
    </div>,

    // Slide 5: Summary
    <div key="slide-5" className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white p-8 text-center">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm mx-auto bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
        <h2 className="text-3xl font-display font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
          InboxSpend Wrapped
        </h2>
        
        <div className="space-y-4 text-left mb-8">
          <div>
            <p className="text-sm opacity-70 uppercase tracking-wider font-bold">Total Spent</p>
            <p className="text-2xl font-bold">₹{Number(stats?.total_spent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-sm opacity-70 uppercase tracking-wider font-bold">Top Merchant</p>
            <p className="text-2xl font-bold">{stats?.top_merchant}</p>
          </div>
          <div>
            <p className="text-sm opacity-70 uppercase tracking-wider font-bold">Top Category</p>
            <p className="text-2xl font-bold">{stats?.top_category}</p>
          </div>
        </div>

        <button 
          onClick={() => {
            alert('Screenshot this page to share it with your friends!');
          }}
          className="w-full py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <Share2 className="mr-2" size={20} /> Share
        </button>
      </motion.div>
    </div>
  ];

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 right-6 z-50 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Progress Bars */}
      <div className="absolute top-6 left-6 right-20 z-50 flex space-x-2">
        {slides.map((_, index) => (
          <div key={index} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: index < currentSlide ? '100%' : '0%' }}
              animate={{ 
                width: index < currentSlide ? '100%' : index === currentSlide ? '100%' : '0%' 
              }}
              transition={{ 
                duration: index === currentSlide ? SLIDE_DURATION / 1000 : 0,
                ease: 'linear'
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation Click Areas */}
      <div className="absolute inset-y-0 left-0 w-1/3 z-40 cursor-pointer" onClick={prevSlide}>
        {currentSlide > 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/10 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity">
            <ChevronLeft size={32} />
          </div>
        )}
      </div>
      
      <div className="absolute inset-y-0 right-0 w-1/3 z-40 cursor-pointer" onClick={nextSlide}>
        {currentSlide < totalSlides - 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/10 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity">
            <ChevronRight size={32} />
          </div>
        )}
      </div>

      {/* Slide Content */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full sm:max-w-md sm:h-[85vh] sm:rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {slides[currentSlide]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
