import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Cloud, CloudOff } from "lucide-react";
import { bookCache } from "../pwa/BookCache";

export default function OfflineBookBadge({ mediaId, media }) {
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    checkCache();
  }, [mediaId]);

  const checkCache = async () => {
    if (media?.type === 'book' && mediaId) {
      const cached = await bookCache.isCached(mediaId);
      setIsCached(cached);
    }
  };

  if (media?.type !== 'book' || !isCached) return null;

  return (
    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
      <Cloud className="w-3 h-3 mr-1" />
      Offline
    </Badge>
  );
}