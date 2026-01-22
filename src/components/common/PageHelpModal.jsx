import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageHelpModal({ open, onClose, title, content }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-xl">
            <HelpCircle className="w-6 h-6 text-blue-400" />
            {title || "How to use this page"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-zinc-300">
          {content}
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}