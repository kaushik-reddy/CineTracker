import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PDFViewer({ open, onClose, pdfUrl, bookTitle, initialPage = 1, totalPages }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    if (open) {
      setPageNumber(initialPage);
    }
  }, [open, initialPage]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
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

  const handleClose = () => {
    // Pass the current page number back when closing
    onClose(pageNumber);
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-800 border-b border-zinc-700 p-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{bookTitle}</h3>
            <p className="text-xs text-zinc-400">Reading Session</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                className="bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button
                size="sm"
                onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
                className="bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={goToPrevPage}
                disabled={pageNumber <= 1}
                className="bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={pageNumber}
                  onChange={handlePageInputChange}
                  className="w-16 h-8 text-center bg-zinc-700 border-zinc-600 text-white"
                  min={1}
                  max={numPages || totalPages}
                />
                <span className="text-sm text-zinc-400">/ {numPages || totalPages || '?'}</span>
              </div>
              <Button
                size="sm"
                onClick={goToNextPage}
                disabled={pageNumber >= (numPages || totalPages)}
                className="bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              size="sm"
              onClick={handleClose}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
            >
              <X className="w-4 h-4 mr-1" />
              End Session
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-zinc-950 p-4 flex justify-center" style={{ maxHeight: 'calc(95vh - 80px)' }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className="text-white">Loading PDF...</div>
              </div>
            }
            error={
              <div className="flex items-center justify-center py-20">
                <div className="text-red-400">Failed to load PDF. Please check the URL.</div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl"
            />
          </Document>
        </div>
      </DialogContent>
    </Dialog>
  );
}