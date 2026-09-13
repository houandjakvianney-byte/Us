import React, { useState } from 'react';
import { Sparkles, Plus, CheckCircle2, Circle, Calendar, Tag, Trash2, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BucketItem } from '../types';

interface BucketListTabProps {
  bucketList: BucketItem[];
  onAddBucketItem: (title: string, category: string, targetDate?: string, notes?: string) => Promise<void>;
  onToggleComplete: (itemId: string, currentState: boolean) => Promise<void>;
  onDeleteBucketItem: (itemId: string) => Promise<void>;
}

export const BucketListTab: React.FC<BucketListTabProps> = ({
  bucketList,
  onAddBucketItem,
  onToggleComplete,
  onDeleteBucketItem,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Voyage');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['Voyage', 'Expérience', 'Rendez-vous', 'Projet de vie', 'Folie'];

  const completedCount = bucketList.filter((b) => b.is_completed).length;

  const filteredItems = bucketList.filter((item) => {
    if (filter === 'pending') return !item.is_completed;
    if (filter === 'completed') return item.is_completed;
    return true;
  });

  const handleToggle = async (item: BucketItem) => {
    if (!item.is_completed) {
      // Celebrate completion!
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f43f5e', '#fbbf24', '#6366f1'],
      });
    }
    await onToggleComplete(item.id, item.is_completed);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddBucketItem(title.trim(), category, targetDate || undefined, notes.trim() || undefined);
      setTitle('');
      setTargetDate('');
      setNotes('');
      setShowAddModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="bucket-list-tab-view" className="space-y-4 pb-8">
      {/* Header & Stats */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Projets & Bucket List</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">Nos rêves et aventures à vivre ensemble</p>
            </div>
          </div>

          <button
            id="open-add-bucket-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xs hover:bg-rose-700 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 border-t border-stone-100 dark:border-white/10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-stone-700 dark:text-stone-300">Rêves accomplis</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {completedCount} sur {bucketList.length} (
              {bucketList.length > 0 ? Math.round((completedCount / bucketList.length) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-rose-100/60 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-rose-500 to-amber-500 transition-all duration-500"
              style={{
                width: `${bucketList.length > 0 ? (completedCount / bucketList.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 pt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              filter === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            Tous ({bucketList.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              filter === 'pending'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            À vivre ({bucketList.length - completedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              filter === 'completed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            Réalisés 🎉 ({completedCount})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-8 text-center border border-dashed border-rose-200 dark:border-rose-900/40 transition-colors">
            <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-stone-700 dark:text-stone-200">Aucun projet dans cette liste</p>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
              Ajoutez des voyages, restaurants ou activités que vous souhaitez faire à deux !
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-3xl border transition flex items-start justify-between gap-3 ${
                item.is_completed
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 shadow-2xs'
                  : 'bg-white dark:bg-[#1a121c] border-rose-100/70 dark:border-white/10 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  id={`toggle-bucket-${item.id}`}
                  onClick={() => handleToggle(item)}
                  className="mt-0.5 shrink-0 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                  title={item.is_completed ? 'Marquer comme à faire' : 'Marquer comme réalisé !'}
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" />
                  ) : (
                    <Circle className="w-5 h-5 hover:text-rose-500 dark:hover:text-rose-400" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      {item.category}
                    </span>
                    {item.target_date && (
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 flex items-center gap-0.5">
                        <Calendar className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                        {new Date(item.target_date + 'T00:00:00').toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug ${
                      item.is_completed ? 'line-through text-stone-400 dark:text-stone-500' : ''
                    }`}
                  >
                    {item.title}
                  </h4>

                  {item.notes && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 italic font-serif">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteBucketItem(item.id)}
                className="text-stone-300 dark:text-stone-600 hover:text-rose-500 dark:hover:text-rose-400 p-1 shrink-0 transition cursor-pointer"
                title="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Bucket Item Modal */}
      {showAddModal && (
        <div
          id="add-bucket-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-xs p-4"
        >
          <div
            id="add-bucket-dialog"
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1a121c] shadow-2xl border border-rose-100 dark:border-white/10 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Nouveau Projet à Deux</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/10 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Ce que nous voulons vivre <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="bucket-title-input"
                  required
                  placeholder="Ex: Voyage au Japon, Saut en parachute..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-white dark:bg-[#1a121c] text-stone-900 dark:text-stone-100">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Échéance cible</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Détails ou budget estimé</label>
                <textarea
                  rows={2}
                  placeholder="Idées d'hôtels, budget, liens..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                id="submit-bucket-btn"
                disabled={!title.trim() || isSubmitting}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 dark:shadow-none hover:bg-rose-700 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                Ajouter à notre Bucket List
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
