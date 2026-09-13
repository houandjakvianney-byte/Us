import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Calendar, Award } from 'lucide-react';

interface RelationshipCounterProps {
  startedAt: string; // YYYY-MM-DD
  coupleName: string;
}

export const RelationshipCounter: React.FC<RelationshipCounterProps> = ({
  startedAt,
  coupleName,
}) => {
  const [elapsed, setElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
    years: 0,
    months: 0,
  });

  const [anniversaryCountdown, setAnniversaryCountdown] = useState<{
    daysLeft: number;
    nextYear: number;
  }>({ daysLeft: 0, nextYear: 1 });

  useEffect(() => {
    if (!startedAt) return;

    const calculate = () => {
      const start = new Date(startedAt + 'T00:00:00');
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - start.getTime());

      const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      // Approximate years & months
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (now.getDate() < start.getDate()) {
        months--;
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      setElapsed({
        days: totalDays % 30,
        hours,
        minutes,
        seconds,
        totalDays,
        years,
        months,
      });

      // Next anniversary
      const thisYearAnniv = new Date(now.getFullYear(), start.getMonth(), start.getDate());
      let nextAnniv = thisYearAnniv;
      let targetAnnivCount = now.getFullYear() - start.getFullYear();

      if (now.getTime() > thisYearAnniv.getTime()) {
        nextAnniv = new Date(now.getFullYear() + 1, start.getMonth(), start.getDate());
        targetAnnivCount++;
      }

      const msToNext = nextAnniv.getTime() - now.getTime();
      const daysLeft = Math.ceil(msToNext / (1000 * 60 * 60 * 24));
      setAnniversaryCountdown({
        daysLeft,
        nextYear: Math.max(1, targetAnnivCount),
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const milestones = [
    { label: '100 jours', target: 100 },
    { label: '6 mois', target: 182 },
    { label: '1 an', target: 365 },
    { label: '500 jours', target: 500 },
    { label: '2 ans', target: 730 },
    { label: '1000 jours', target: 1000 },
    { label: '3 ans', target: 1095 },
    { label: '5 ans', target: 1826 },
  ];

  const nextMilestone = milestones.find((m) => m.target > elapsed.totalDays);
  const daysToNextMilestone = nextMilestone ? nextMilestone.target - elapsed.totalDays : 0;

  return (
    <div
      id="relationship-counter-card"
      className="relative overflow-hidden rounded-3xl bg-linear-to-br from-rose-500 via-rose-600 to-rose-700 p-6 text-white shadow-xl shadow-rose-500/20"
    >
      {/* Decorative subtle light accents */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-rose-900/20 blur-xl" />

      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-xs font-semibold text-rose-100 tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-rose-200" />
          Ensemble depuis
        </span>
        <div className="flex items-center gap-1.5 text-rose-200 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(startedAt + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Main big counter */}
      <div className="relative z-10 text-center my-4">
        <div className="inline-flex items-baseline gap-2">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-xs font-display">
            {elapsed.totalDays}
          </span>
          <span className="text-xl font-medium text-rose-100">jours</span>
        </div>
        <p className="text-sm font-medium text-rose-100/90 mt-1 flex items-center justify-center gap-2">
          <span>{elapsed.years > 0 ? `${elapsed.years} an${elapsed.years > 1 ? 's' : ''} ` : ''}</span>
          <span>{elapsed.months > 0 ? `${elapsed.months} mois ` : ''}</span>
          <span>d'amour partagé</span>
          <Heart className="w-4 h-4 fill-rose-300 text-rose-300 animate-pulse inline" />
        </p>
      </div>

      {/* Ticking time detail: hours, minutes, seconds */}
      <div className="relative z-10 grid grid-cols-3 gap-2 bg-black/15 backdrop-blur-md rounded-2xl p-2.5 text-center text-rose-100 border border-white/10 mb-4">
        <div>
          <span className="text-lg font-bold text-white block">{String(elapsed.hours).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-semibold text-rose-200">Heures</span>
        </div>
        <div className="border-x border-white/10">
          <span className="text-lg font-bold text-white block">{String(elapsed.minutes).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-semibold text-rose-200">Minutes</span>
        </div>
        <div>
          <span className="text-lg font-bold text-white block">{String(elapsed.seconds).padStart(2, '0')}</span>
          <span className="text-[10px] uppercase font-semibold text-rose-200">Secondes</span>
        </div>
      </div>

      {/* Next milestone / anniversary ribbon */}
      <div className="relative z-10 flex items-center justify-between text-xs bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2 text-rose-100 border border-white/5">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="truncate">
            {anniversaryCountdown.daysLeft === 0
              ? `🎉 C'est votre anniversaire de couple aujourd'hui !`
              : `Prochain anniversaire (${anniversaryCountdown.nextYear} an${anniversaryCountdown.nextYear > 1 ? 's' : ''}) dans ${anniversaryCountdown.daysLeft}j`}
          </span>
        </div>
        {nextMilestone && (
          <span className="hidden sm:inline-block font-semibold text-white text-[11px] bg-white/15 px-2 py-0.5 rounded-full shrink-0">
            Cap {nextMilestone.label} : -{daysToNextMilestone}j
          </span>
        )}
      </div>
    </div>
  );
};
