import React from 'react';
import { format } from 'date-fns';

export default function Footer({ lastLibraryUpdate }) {
  // Use build date injected by Vite, fallback to current date
  const websiteUpdated = typeof __BUILD_DATE__ !== 'undefined' ? new Date(__BUILD_DATE__) : new Date();

  return (
    <footer className="w-full bg-zinc-950 border-t border-zinc-800/50 py-3 sm:py-4 backdrop-blur-sm mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-4 md:px-6">
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
          <div className="text-zinc-400 text-[11px] sm:text-xs text-center">
            © {new Date().getFullYear()} CineTracker. All rights reserved.
          </div>
          <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-zinc-500">
            <span>Website: {format(websiteUpdated, 'MMMM yyyy')}</span>
            {lastLibraryUpdate && (
              <span>Library: {format(new Date(lastLibraryUpdate), 'MMMM yyyy')}</span>
            )}
          </div>
          <div className="flex gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <a href="https://www.termsfeed.com/live/46599698-55e1-4948-89e9-cf77b55ce435" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
              Disclaimer
            </a>
            <a href="https://www.termsfeed.com/live/d7b428c4-2d31-4a94-8a5e-2dab504d703f" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
              Terms & Conditions
            </a>
            <a href="https://www.termsfeed.com/live/ba636b6f-a26f-42e0-8732-f6687e8e195f" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}