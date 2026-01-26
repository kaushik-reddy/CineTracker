
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import CreateWatchParty from './CreateWatchParty';

export default function WatchPartyButton({ media, schedule, size = "default", className = "" }) {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <>
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowCreate(true);
                }}
                size={size}
                className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white ${className}`}
            >
                <Users className="w-4 h-4 mr-2" />
                Watch Party
            </Button>

            <CreateWatchParty
                open={showCreate}
                onClose={() => setShowCreate(false)}
                media={media}
                schedule={schedule}
            />
        </>
    );
}
