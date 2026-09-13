import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' | 'banner' }> = ({
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div
          id="pwa-install-banner"
          className="bg-linear-to-r from-rose-500 to-rose-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-between gap-3 mb-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Installer l'application Deux</p>
              <p className="text-[11px] text-rose-100">Accès hors-ligne & notifications directes</p>
            </div>
          </div>
          <button
            id="pwa-install-banner-btn"
            onClick={install}
            className="px-3.5 py-1.5 rounded-xl bg-white text-rose-600 text-xs font-bold shadow-xs hover:bg-rose-50 transition active:scale-95 shrink-0"
          >
            Installer
          </button>
        </div>
      );
    }

    return (
      <button
        id="pwa-install-action-btn"
        onClick={install}
        className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-200/80 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500 hover:text-white transition active:scale-95 shadow-2xs"
        title="Installer l'application sur l'écran d'accueil"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        {variant === 'banner' ? (
          <div
            id="pwa-ios-banner"
            className="bg-linear-to-r from-rose-500 to-rose-600 text-white p-3 rounded-2xl shadow-md flex items-center justify-between gap-3 mb-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold">Installer sur iPhone / iPad</p>
                <p className="text-[11px] text-rose-100">Ajouter Deux à l'écran d'accueil</p>
              </div>
            </div>
            <button
              id="pwa-ios-guide-banner-btn"
              onClick={() => setShowIOSGuide(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-rose-600 text-xs font-bold shadow-xs hover:bg-rose-50 transition active:scale-95 shrink-0"
            >
              Guide
            </button>
          </div>
        ) : (
          <button
            id="pwa-ios-install-btn"
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-200/80 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-500 hover:text-white transition active:scale-95 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer (iOS)</span>
          </button>
        )}

        {showIOSGuide && (
          <div
            id="pwa-ios-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4"
          >
            <div
              id="pwa-ios-modal"
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-rose-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">Installer Deux</h3>
                    <p className="text-xs text-stone-500">Sur iPhone & iPad</p>
                  </div>
                </div>
                <button
                  id="pwa-ios-close-btn"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm text-stone-600 mb-5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/50 border border-rose-100/60">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-xs leading-relaxed">
                    Dans <strong>Safari</strong>, appuyez sur le bouton de partage{' '}
                    <Share className="inline w-4 h-4 text-blue-600 mx-1 align-sub" /> en bas de l'écran.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/50 border border-rose-100/60">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-xs leading-relaxed">
                    Faites défiler le menu et appuyez sur{' '}
                    <strong className="inline-flex items-center gap-1">
                      <PlusSquare className="inline w-3.5 h-3.5 text-stone-700" /> Sur l'écran d'accueil
                    </strong>
                    .
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-rose-50/50 border border-rose-100/60">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-xs leading-relaxed">
                    Appuyez sur <strong>Ajouter</strong> en haut à droite. L'icône de l'application apparaît sur votre écran !
                  </p>
                </div>
              </div>

              <button
                id="pwa-ios-guide-close-btn"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-2xl bg-rose-600 text-white text-sm font-semibold shadow-md shadow-rose-200 hover:bg-rose-700 transition"
              >
                Compris !
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
