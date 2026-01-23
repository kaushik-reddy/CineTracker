import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Image as ImageIcon, BookOpen, Loader2, Download, Cloud, CloudOff } from "lucide-react";
import { supabaseAdapter as base44 } from "@/api/supabaseAdapter";
import { toast } from "sonner";
import { bookCache } from "../pwa/BookCache";
import { useOffline } from "../pwa/OfflineManager";
import { IllustrationAgent } from "@/agents/IllustrationAgent";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function IllustratedBookReaderContent({ open, onClose, pdfUrl, bookTitle, initialPage = 1, totalPages, mediaId, media }) {
  console.log('PDF Reader Debug:', { pdfUrl, pdfVersion: pdfjs.version, workerSrc: pdfjs.GlobalWorkerOptions.workerSrc });
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [illustratedMode, setIllustratedMode] = useState(media?.illustrated_mode_enabled || false);
  const [showIllustration, setShowIllustration] = useState(true);
  const [pageIllustrations, setPageIllustrations] = useState(media?.page_illustrations || []);
  const [generatingIllustration, setGeneratingIllustration] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { isOnline, addToQueue } = useOffline();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      setPageNumber(initialPage);
      setPageIllustrations(media?.page_illustrations || []);
      setIllustratedMode(media?.illustrated_mode_enabled || false);
      checkIfCached();
    }
  }, [open, initialPage, media]);

  const checkIfCached = async () => {
    if (mediaId) {
      const cached = await bookCache.isCached(mediaId);
      setIsCached(cached);

      // If offline and not cached, show warning
      if (!isOnline && !cached) {
        toast.error('This book is not available offline');
      }
    }
  };

  const handleDownloadForOffline = async () => {
    setIsDownloading(true);
    try {
      await bookCache.cacheBook(media);
      setIsCached(true);
      toast.success('Book downloaded for offline reading');
    } catch (error) {
      console.error('Failed to download book:', error);
      toast.error('Failed to download book');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveOffline = async () => {
    try {
      await bookCache.removeCachedBook(mediaId);
      setIsCached(false);
      toast.success('Book removed from offline storage');
    } catch (error) {
      console.error('Failed to remove book:', error);
      toast.error('Failed to remove book');
    }
  };

  useEffect(() => {
    if (illustratedMode && open && pageNumber) {
      checkAndGenerateIllustration();
    }
  }, [pageNumber, illustratedMode, open]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const getCurrentPageIllustration = () => {
    return pageIllustrations.find(p => p.pageNumber === pageNumber);
  };

  const checkAndGenerateIllustration = async () => {
    const currentIllustration = getCurrentPageIllustration();

    // Don't generate if already exists or is in progress
    if (currentIllustration?.illustrationUrl || currentIllustration?.illustrationStatus === 'pending' || generatingIllustration) {
      return;
    }

    // Generate illustration for current page
    await generatePageIllustration(pageNumber);
  };

  const generatePageIllustration = async (targetPageNumber) => {
    setGeneratingIllustration(true);

    try {
      // Update status to pending
      const updatedIllustrations = [...pageIllustrations];
      const existingIndex = updatedIllustrations.findIndex(p => p.pageNumber === targetPageNumber);

      if (existingIndex >= 0) {
        updatedIllustrations[existingIndex].illustrationStatus = 'pending';
      } else {
        updatedIllustrations.push({
          pageNumber: targetPageNumber,
          illustrationStatus: 'pending',
          illustrationUrl: null,
          illustrationPrompt: null
        });
      }

      setPageIllustrations(updatedIllustrations);
      await base44.entities.Media.update(mediaId, { page_illustrations: updatedIllustrations });

      // Use the Agent to do the work
      const result = await IllustrationAgent.generateValues(bookTitle, targetPageNumber);

      // Update with successful generation
      const finalIllustrations = [...pageIllustrations];
      const finalIndex = finalIllustrations.findIndex(p => p.pageNumber === targetPageNumber);

      const newRecord = {
        pageNumber: targetPageNumber,
        illustrationUrl: result.url,
        illustrationPrompt: result.prompt,
        illustrationStatus: 'ready'
      };

      if (finalIndex >= 0) {
        finalIllustrations[finalIndex] = newRecord;
      } else {
        finalIllustrations.push(newRecord);
      }

      setPageIllustrations(finalIllustrations);
      await base44.entities.Media.update(mediaId, { page_illustrations: finalIllustrations });

      toast.success('Illustration generated!');
    } catch (error) {
      console.error('Failed to generate illustration:', error);

      // Update status to failed
      const failedIllustrations = [...pageIllustrations];
      const failedIndex = failedIllustrations.findIndex(p => p.pageNumber === targetPageNumber);

      if (failedIndex >= 0) {
        failedIllustrations[failedIndex].illustrationStatus = 'failed';
      }

      setPageIllustrations(failedIllustrations);
      await base44.entities.Media.update(mediaId, { page_illustrations: failedIllustrations });

      toast.error('Failed to generate illustration');
    } finally {
      setGeneratingIllustration(false);
    }
  };

  const toggleIllustratedMode = async () => {
    const newMode = !illustratedMode;
    setIllustratedMode(newMode);
    await base44.entities.Media.update(mediaId, { illustrated_mode_enabled: newMode });

    if (newMode) {
      toast.success('Illustrated mode enabled');
    }
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || prev, prev + 1));
  };

  const handlePageInputChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= (numPages || totalPages)) {
      setPageNumber(value);
    }
  };

  const handleClose = async () => {
    // Save progress to cache if offline
    if (!isOnline && isCached) {
      await bookCache.updateReadingProgress(mediaId, pageNumber);

      // Queue progress update for when online
      addToQueue({
        type: 'update_progress',
        execute: async () => {
          await base44.entities.Media.update(mediaId, { pages_read: pageNumber });
        }
      });
    }

    onClose(pageNumber);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!open) return;
      if (e.key === 'ArrowLeft') goToPrevPage();
      if (e.key === 'ArrowRight') goToNextPage();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, pageNumber, numPages]);

  const currentIllustration = getCurrentPageIllustration();

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-[98vw] max-h-[98vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-800 border-b border-zinc-700 p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <h3 className="text-white font-semibold truncate text-sm sm:text-base">{bookTitle}</h3>
            <p className="text-xs text-zinc-400">Reading Session</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
            {/* Illustrated Mode Toggle */}
            <div className="flex items-center gap-2 bg-zinc-700/50 px-2 sm:px-3 py-1.5 rounded-lg">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              <Label className="text-xs text-white cursor-pointer" htmlFor="illustrated-mode">
                Illustrated
              </Label>
              <Switch
                id="illustrated-mode"
                checked={illustratedMode}
                onCheckedChange={toggleIllustratedMode}
                className="scale-75 sm:scale-100"
              />
            </div>

            {/* Offline Download Toggle */}
            {isOnline && (
              <Button
                size="sm"
                onClick={isCached ? handleRemoveOffline : handleDownloadForOffline}
                disabled={isDownloading}
                className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${isCached
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50'
                  }`}
              >
                {isDownloading ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                ) : isCached ? (
                  <><Cloud className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" /><span className="hidden sm:inline">Offline</span></>
                ) : (
                  <><Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" /><span className="hidden sm:inline">Download</span></>
                )}
              </Button>
            )}

            {/* Offline Indicator */}
            {!isOnline && isCached && (
              <div className="flex items-center gap-1 bg-emerald-500/20 px-2 py-1 rounded text-xs text-emerald-400">
                <CloudOff className="w-3 h-3" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}

            {/* Mobile: Show Illustration Toggle */}
            {isMobile && illustratedMode && (
              <div className="flex items-center gap-2 bg-zinc-700/50 px-2 sm:px-3 py-1.5 rounded-lg">
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                <Label className="text-xs text-white cursor-pointer" htmlFor="show-illustration">
                  Show
                </Label>
                <Switch
                  id="show-illustration"
                  checked={showIllustration}
                  onCheckedChange={setShowIllustration}
                  className="scale-75 sm:scale-100"
                />
              </div>
            )}

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <Button
                size="sm"
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                className="bg-zinc-700 hover:bg-zinc-600 text-white h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <span className="text-xs sm:text-sm text-white w-10 sm:w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button
                size="sm"
                onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
                className="bg-zinc-700 hover:bg-zinc-600 text-white h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={pageNumber}
                  onChange={handlePageInputChange}
                  className="w-12 sm:w-16 h-6 sm:h-8 text-center bg-zinc-700 border-zinc-600 text-white text-xs sm:text-sm p-0"
                  min={1}
                  max={numPages || totalPages}
                />
                <span className="text-xs sm:text-sm text-zinc-400">/ {numPages || totalPages || '?'}</span>
              </div>
              <Button
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= (numPages || totalPages)}
                className="bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              size="sm"
              onClick={handleClose}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
              <span className="hidden sm:inline">End</span>
            </Button>
          </div>
        </div>

        {/* Content - Open Book Layout */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-amber-50 to-orange-50 p-2 sm:p-4 lg:p-8" style={{ maxHeight: 'calc(98vh - 100px)' }}>
          {illustratedMode && !isMobile ? (
            // Desktop: Two-page spread
            <div className="flex justify-center items-start gap-1 max-w-7xl mx-auto">
              {/* Left Page - Text */}
              <div className="flex-1 bg-white rounded-l-lg shadow-2xl border-r border-zinc-300 overflow-hidden" style={{ maxWidth: '45%' }}>
                <div className="p-4 sm:p-6 lg:p-8 h-full overflow-auto" style={{
                  fontFamily: 'Georgia, serif',
                  backgroundColor: '#fffef8',
                  minHeight: '600px'
                }}>
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error('Error loading PDF:', error)}
                    loading={<div className="text-zinc-700 text-center py-10">Loading page...</div>}
                    error={<div className="text-red-600 text-center py-10">Failed to load PDF</div>}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      width={400}
                    />
                  </Document>
                </div>
              </div>

              {/* Center Crease */}
              <div className="w-1 bg-gradient-to-r from-zinc-400 via-zinc-300 to-zinc-400 shadow-lg" style={{ minHeight: '600px' }} />

              {/* Right Page - Illustration */}
              <div className="flex-1 bg-white rounded-r-lg shadow-2xl border-l border-zinc-300 overflow-hidden" style={{ maxWidth: '45%' }}>
                <div className="p-4 sm:p-6 lg:p-8 h-full flex items-center justify-center" style={{
                  backgroundColor: '#fffef8',
                  minHeight: '600px'
                }}>
                  {currentIllustration?.illustrationStatus === 'ready' && currentIllustration?.illustrationUrl ? (
                    <img
                      src={currentIllustration.illustrationUrl}
                      alt={`Illustration for page ${pageNumber}`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      style={{ filter: 'sepia(0.2)' }}
                    />
                  ) : currentIllustration?.illustrationStatus === 'pending' || generatingIllustration ? (
                    <div className="flex flex-col items-center gap-4 text-zinc-600">
                      <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                      <p className="text-sm font-serif">Illustration being created...</p>
                    </div>
                  ) : currentIllustration?.illustrationStatus === 'failed' ? (
                    <div className="flex flex-col items-center gap-4 text-zinc-500">
                      <ImageIcon className="w-12 h-12 text-zinc-400" />
                      <p className="text-sm font-serif">Illustration unavailable</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-zinc-400">
                      <div className="w-32 h-32 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-zinc-300" />
                      </div>
                      <p className="text-sm font-serif text-center">Generating first illustration...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Mobile or Text-Only Mode
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                <div className="p-3 sm:p-6 overflow-auto" style={{
                  fontFamily: 'Georgia, serif',
                  backgroundColor: '#fffef8'
                }}>
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => console.error('Error loading PDF:', error)}
                    loading={<div className="text-zinc-700 text-center py-10">Loading page...</div>}
                    error={<div className="text-red-600 text-center py-10">Failed to load PDF</div>}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={isMobile ? 0.8 : scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      width={isMobile ? 300 : undefined}
                    />
                  </Document>

                  {/* Mobile: Show illustration below if enabled */}
                  {isMobile && illustratedMode && showIllustration && (
                    <div className="mt-6 pt-6 border-t border-zinc-300">
                      {currentIllustration?.illustrationStatus === 'ready' && currentIllustration?.illustrationUrl ? (
                        <img
                          src={currentIllustration.illustrationUrl}
                          alt={`Illustration for page ${pageNumber}`}
                          className="w-full rounded-lg shadow-lg"
                          style={{ filter: 'sepia(0.2)' }}
                        />
                      ) : currentIllustration?.illustrationStatus === 'pending' || generatingIllustration ? (
                        <div className="flex flex-col items-center gap-3 py-8 text-zinc-600">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                          <p className="text-xs font-serif">Creating illustration...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3 py-8 text-zinc-400">
                          <ImageIcon className="w-8 h-8 text-zinc-300" />
                          <p className="text-xs font-serif">No illustration yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function IllustratedBookReader(props) {
  return (
    <ErrorBoundary>
      <IllustratedBookReaderContent {...props} />
    </ErrorBoundary>
  );
}