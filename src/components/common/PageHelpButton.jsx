import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import PageHelpModal from "./PageHelpModal";

export default function PageHelpButton({ title, content, className = "" }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowHelp(true)}
        variant="ghost"
        size="icon"
        className={`text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 ${className}`}
        title="Help"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      <PageHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title={title}
        content={content}
      />
    </>
  );
}