import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Calendar, MapPin, Tag, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Memory } from '../types';

interface CreateMemoryModalProps {
  coupleId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemoryCreated: (memory: Memory) => void;
}

export const CreateMemoryModal: React.FC<CreateMemoryModalProps> = ({
  coupleId,
  userId,
  isOpen,
  onClose,
  onMemoryCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Date');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = ['Date', 'Voyage', 'Quotidien', 'Fête', 'Surprise', 'Cadeau', 'Autre'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Veuillez sélectionner un fichier image (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('Image trop volumineuse (max 20MB).');
      return;
    }

    setErrorMsg(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Veuillez donner un titre à ce souvenir.');
      return;
    }

    if (!imageFile && !imagePreview) {
      setErrorMsg('Veuillez sélectionner une photo pour ce souvenir.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      let finalMediaUrl = '';

      if (imageFile) {
        // Upload to Supabase Storage bucket 'memories'
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${coupleId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Storage upload error:', uploadError);
          // If storage bucket upload fails or offline, use data url as fallback
          finalMediaUrl = imagePreview || '';
        } else {
          // Get public url
          const { data: publicData } = supabase.storage
            .from('memories')
            .getPublicUrl(fileName);
          finalMediaUrl = publicData.publicUrl;
        }
      } else if (imagePreview) {
        finalMediaUrl = imagePreview;
      }

      // Insert memory row via server endpoint (bypasses RLS recursion)
      try {
        const res = await fetch('/api/memories/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            coupleId,
            userId,
            title: title.trim(),
            description: description.trim() || null,
            date,
            mediaUrl: finalMediaUrl,
            thumbnailUrl: finalMediaUrl,
            category,
            location: location.trim() || null,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.memory) {
            onMemoryCreated(json.memory as Memory);
            setTitle('');
            setDescription('');
            setImageFile(null);
            setImagePreview(null);
            setLocation('');
            onClose();
            return;
          }
        }
      } catch (e) {
        console.warn('Server memory creation failed, trying Supabase fallback:', e);
      }

      // Supabase fallback if server unreachable
      const { data, error: insertError } = await supabase
        .from('memories')
        .insert({
          couple_id: coupleId,
          user_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          date,
          media_url: finalMediaUrl,
          thumbnail_url: finalMediaUrl,
          category,
          location: location.trim() || null,
          is_favorite: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert memory error:', insertError);
        // Optimistic fallback
        const mockMemory: Memory = {
          id: 'temp_' + Date.now(),
          couple_id: coupleId,
          user_id: userId,
          title: title.trim(),
          description: description.trim() || undefined,
          date,
          media_url: finalMediaUrl,
          thumbnail_url: finalMediaUrl,
          category,
          location: location.trim() || undefined,
          is_favorite: false,
          created_at: new Date().toISOString(),
        };
        onMemoryCreated(mockMemory);
      } else if (data) {
        onMemoryCreated(data as Memory);
      }

      // Reset and close
      setTitle('');
      setDescription('');
      setLocation('');
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Une erreur est survenue lors de l’enregistrement.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="create-memory-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div
        id="create-memory-modal"
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1a121c] shadow-2xl border border-rose-100 dark:border-white/10 overflow-hidden my-auto transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-rose-50 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Nouveau Souvenir</h3>
          </div>
          <button
            id="close-create-memory-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-white/10 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/15 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Photo Picker */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Photo du souvenir <span className="text-rose-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {imagePreview ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-rose-200 dark:border-white/10 group">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Changer de photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="select-memory-image-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex flex-col items-center justify-center gap-2 text-stone-500 dark:text-stone-400 transition active:scale-98 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Prendre ou importer une photo</p>
                <p className="text-[10px] text-stone-400 dark:text-stone-500">JPG, PNG, WebP (jusqu'à 20MB)</p>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Titre <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="memory-title-input"
              required
              placeholder="Ex: Notre coucher de soleil à Rome"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                id="memory-date-input"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Catégorie</span>
              </label>
              <select
                id="memory-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-white/10 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-[#1a121c] text-stone-900 dark:text-stone-100">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400" />
              <span>Lieu (optionnel)</span>
            </label>
            <input
              type="text"
              id="memory-location-input"
              placeholder="Ex: Paris, Plage de Deauville..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Ce que vous avez ressenti / Anecdote
            </label>
            <textarea
              id="memory-desc-input"
              rows={2}
              placeholder="Racontez ce moment inoubliable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#140e16] text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="save-memory-btn"
              disabled={isUploading}
              className="w-full py-3 rounded-2xl bg-rose-600 text-white text-sm font-bold shadow-md shadow-rose-200 dark:shadow-none hover:bg-rose-700 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sauvegarde en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Enregistrer ce souvenir</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
