import React, { useState } from 'react';
import { Image, Plus, Heart, MapPin, Calendar, LayoutGrid, Rows, Trash2, X, Star } from 'lucide-react';
import { Memory } from '../types';

interface MemoriesTabProps {
  memories: Memory[];
  onOpenAddModal: () => void;
  onToggleFavorite: (memoryId: string, currentVal: boolean) => Promise<void>;
  onDeleteMemory: (memoryId: string) => Promise<void>;
}

export const MemoriesTab: React.FC<MemoriesTabProps> = ({
  memories,
  onOpenAddModal,
  onToggleFavorite,
  onDeleteMemory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);

  const categories = ['Tous', 'Date', 'Voyage', 'Quotidien', 'Fête', 'Surprise'];

  const filteredMemories = memories.filter((m) => {
    if (showOnlyFavorites && !m.is_favorite) return false;
    if (selectedCategory !== 'Tous' && m.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div id="memories-tab-view" className="space-y-4 pb-8">
      {/* Top Header & Filters */}
      <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-5 shadow-xs border border-rose-100/70 dark:border-white/10 transition-colors">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Journal de Souvenirs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                {memories.length}
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Nos moments précieux gravés ensemble</p>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              id="view-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-[#281b2b] text-rose-600 dark:text-rose-400 shadow-2xs' : 'text-stone-500 dark:text-stone-400'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="view-timeline-btn"
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'timeline' ? 'bg-white dark:bg-[#281b2b] text-rose-600 dark:text-rose-400 shadow-2xs' : 'text-stone-500 dark:text-stone-400'
              }`}
              title="Vue Chronologique"
            >
              <Rows className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
              showOnlyFavorites
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/10'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
            <span>Favoris</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memories Content */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-8 text-center border border-dashed border-rose-200 dark:border-rose-900/40 space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <Image className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">Aucun souvenir trouvé</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {showOnlyFavorites
                ? 'Vous n’avez pas encore de souvenirs marqués en favoris.'
                : 'Ajoutez une photo pour immortaliser votre premier souvenir !'}
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-200 dark:shadow-none hover:bg-rose-700 active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une photo</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredMemories.map((m) => (
            <div
              key={m.id}
              onClick={() => setActiveMemory(m)}
              className="group relative aspect-4/5 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-rose-100 dark:border-white/10 shadow-2xs cursor-pointer active:scale-98 transition"
            >
              <img
                src={m.thumbnail_url || m.media_url}
                alt={m.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
                referrerPolicy="no-referrer"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-2.5 text-white">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold bg-white/25 backdrop-blur-md px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {m.category}
                  </span>
                  {m.is_favorite && (
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center shadow-xs">
                      <Star className="w-3 h-3 fill-current" />
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold leading-snug line-clamp-1">{m.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-stone-200 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5" />
                        {m.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="space-y-4 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-rose-200 dark:before:bg-rose-900/40">
          {filteredMemories.map((m) => (
            <div
              key={m.id}
              onClick={() => setActiveMemory(m)}
              className="relative pl-10 cursor-pointer active:scale-98 transition"
            >
              {/* Timeline marker */}
              <div className="absolute left-2.5 top-5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-[#140e16] shadow-xs z-10" />

              <div className="bg-white dark:bg-[#1a121c] rounded-3xl p-4 shadow-2xs border border-rose-100 dark:border-white/10 overflow-hidden transition-colors">
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-3 bg-stone-100 dark:bg-stone-900">
                  <img
                    src={m.thumbnail_url || m.media_url}
                    alt={m.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-white/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-rose-700 dark:text-rose-300">
                      {m.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{m.title}</h4>
                    {m.is_favorite && (
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-rose-400" />
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        {m.location}
                      </span>
                    )}
                  </div>

                  {m.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 pt-1 line-clamp-2 italic font-serif">
                      "{m.description}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Add Memory Button */}
      <button
        id="fab-add-memory-btn"
        onClick={onOpenAddModal}
        className="fixed bottom-20 right-5 z-30 w-13 h-13 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-500/30 flex items-center justify-center hover:bg-rose-700 active:scale-95 transition cursor-pointer"
        title="Ajouter un souvenir"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Detail Memory Modal */}
      {activeMemory && (
        <div
          id="detail-memory-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 overflow-y-auto"
        >
          <div
            id="detail-memory-dialog"
            className="w-full max-w-md bg-white dark:bg-[#1a121c] rounded-3xl overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-200 border border-transparent dark:border-white/10 transition-colors"
          >
            {/* Image Preview */}
            <div className="relative aspect-4/3 bg-stone-900">
              <img
                src={activeMemory.media_url}
                alt={activeMemory.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setActiveMemory(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                    {activeMemory.category}
                  </span>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-1">{activeMemory.title}</h3>
                </div>

                <button
                  id="toggle-memory-favorite-btn"
                  onClick={() => {
                    onToggleFavorite(activeMemory.id, !!activeMemory.is_favorite);
                    setActiveMemory({ ...activeMemory, is_favorite: !activeMemory.is_favorite });
                  }}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition cursor-pointer ${
                    activeMemory.is_favorite
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                      : 'border-stone-200 dark:border-white/10 text-stone-400 hover:text-rose-600'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${activeMemory.is_favorite ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  {new Date(activeMemory.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                {activeMemory.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    {activeMemory.location}
                  </span>
                )}
              </div>

              {activeMemory.description && (
                <p className="text-xs text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-white/5 p-3 rounded-2xl leading-relaxed italic font-serif">
                  "{activeMemory.description}"
                </p>
              )}

              <div className="pt-2 border-t border-stone-100 dark:border-white/10 flex items-center justify-between">
                <button
                  id="delete-memory-btn"
                  onClick={async () => {
                    if (confirm('Voulez-vous vraiment supprimer ce souvenir ?')) {
                      await onDeleteMemory(activeMemory.id);
                      setActiveMemory(null);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer</span>
                </button>

                <button
                  onClick={() => setActiveMemory(null)}
                  className="px-4 py-1.5 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-200 dark:hover:bg-white/15 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
