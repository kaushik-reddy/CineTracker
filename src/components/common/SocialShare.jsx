import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Twitter, Facebook, MessageCircle, Link as LinkIcon, Download } from "lucide-react";
import { toast } from "sonner";
import html2canvas from 'html2canvas';

export default function SocialShare({ media, schedule, type = "completion" }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateShareText = () => {
    if (type === "completion") {
      if (media.type === 'book') {
        return `Just finished reading "${media.title}"${media.author ? ` by ${media.author}` : ''}! ${schedule.rating ? `⭐ Rated ${schedule.rating.toFixed(1)}/5.0` : ''} #BookLover #Reading`;
      } else if (media.type === 'series') {
        return `Just watched "${media.title}" S${String(schedule.season_number).padStart(2, '0')}E${String(schedule.episode_number).padStart(2, '0')}! ${schedule.rating ? `⭐ Rated ${schedule.rating.toFixed(1)}/5.0` : ''} #TVSeries #NowWatching`;
      } else {
        return `Just watched "${media.title}"! ${schedule.rating ? `⭐ Rated ${schedule.rating.toFixed(1)}/5.0` : ''} #Movies #NowWatching`;
      }
    } else if (type === "rating") {
      return `Rated "${media.title}" ${schedule.rating.toFixed(1)}/5.0 ⭐ ${media.type === 'book' ? '#BookReview' : '#MovieReview'}`;
    }
    return `Check out "${media.title}" on CineTracker!`;
  };

  const shareText = generateShareText();
  const appUrl = window.location.origin;

  const generateCardBlob = async () => {
    try {
      const card = document.createElement('div');
      card.style.width = '600px';
      card.style.padding = '40px';
      card.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)';
      card.style.borderRadius = '20px';
      card.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      card.style.position = 'absolute';
      card.style.left = '-9999px';
      card.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';

      card.innerHTML = `
        <div style="background: rgba(0,0,0,0.7); padding: 30px; border-radius: 16px; backdrop-filter: blur(10px);">
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
            ${media.poster_url ? `
              <img 
                src="${media.poster_url}" 
                style="width: 120px; height: 180px; object-fit: cover; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.4);"
                crossorigin="anonymous"
              />
            ` : ''}
            <div style="flex: 1; text-align: left; color: white;">
              <h3 style="font-size: 28px; font-weight: bold; margin-bottom: 8px; line-height: 1.2;">
                ${media.title}
              </h3>
              ${schedule.season_number ? `
                <p style="font-size: 18px; color: #fbbf24; margin-bottom: 12px;">
                  S${String(schedule.season_number).padStart(2, '0')}E${String(schedule.episode_number).padStart(2, '0')}
                </p>
              ` : ''}
              ${media.year ? `<p style="font-size: 14px; color: #d4d4d8; margin-bottom: 8px;">${media.year}</p>` : ''}
              ${media.genre?.length > 0 ? `
                <p style="font-size: 12px; color: #a1a1aa;">${media.genre.slice(0, 3).join(' • ')}</p>
              ` : ''}
              ${schedule.device || schedule.audio_format || schedule.video_format ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                  ${schedule.device ? `<p style="font-size: 11px; color: #a1a1aa;">📱 ${schedule.device}</p>` : ''}
                  ${schedule.audio_format ? `<p style="font-size: 11px; color: #a1a1aa;">🔊 ${schedule.audio_format}</p>` : ''}
                  ${schedule.video_format ? `<p style="font-size: 11px; color: #a1a1aa;">📺 ${schedule.video_format}</p>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
          
          ${media.runtime_minutes || media.total_pages ? `
            <div style="background: rgba(139, 92, 246, 0.1); padding: 15px; border-radius: 12px; margin-top: 15px;">
              <div style="display: flex; justify-content: space-around; align-items: center; gap: 20px;">
                ${(() => {
                  let runtime = media.runtime_minutes;
                  // Fix for series - get episode runtime if available
                  if (media.type === 'series' && schedule.season_number && schedule.episode_number) {
                    const epRuntime = media.episode_runtimes?.[schedule.season_number - 1]?.[schedule.episode_number - 1];
                    if (epRuntime) runtime = epRuntime;
                  }
                  return runtime ? '<div style="text-align: center;"><p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;">RUNTIME</p><p style="font-size: 18px; font-weight: bold; color: #fbbf24;">' + runtime + ' min</p></div>' : '';
                })()}
                ${media.total_pages ? `
                  <div style="text-align: center;">
                    <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;">PAGES</p>
                    <p style="font-size: 18px; font-weight: bold; color: #fbbf24;">${media.total_pages}</p>
                  </div>
                ` : ''}
                ${media.platform ? `
                  <div style="text-align: center;">
                    <p style="font-size: 12px; color: #a1a1aa; margin-bottom: 4px;">PLATFORM</p>
                    <p style="font-size: 14px; font-weight: bold; color: #fbbf24;">${media.platform}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${schedule.rating ? `
            <div style="background: rgba(251, 191, 36, 0.1); padding: 20px; border-radius: 12px; margin-top: 15px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">
                ${'⭐'.repeat(Math.round(schedule.rating))}
              </div>
              <p style="font-size: 24px; font-weight: bold; color: #fbbf24;">
                ${schedule.rating.toFixed(1)} / 5.0
              </p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="font-size: 16px; color: #d4d4d8; margin-bottom: 8px;">
              ${media.type === 'book' ? '📚 Just finished reading' : media.type === 'series' ? '📺 Just watched' : '🎬 Just watched'}
            </p>
            <p style="font-size: 14px; color: #a1a1aa;">
              Tracked on CineTracker
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(card);

      const canvas = await html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(card);

      return await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob));
      });
    } catch (error) {
      console.error('Failed to generate card blob:', error);
      return null;
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
    toast.success('Opening Twitter...');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=550,height=420');
    toast.success('Opening Facebook...');
  };

  const shareToWhatsApp = async () => {
    setGenerating(true);
    try {
      // Generate card with device/audio/video info
      const cardBlob = await generateCardBlob();
      if (cardBlob && navigator.canShare) {
        const file = new File([cardBlob], `cinetracker-${media.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`, { type: 'image/png' });
        
        const shareData = {
          text: shareText + '\n\n' + appUrl,
          files: [file]
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.success('Shared successfully!');
          setGenerating(false);
          return;
        }
      }
      
      // If native share not available, download the image and open WhatsApp
      if (cardBlob) {
        const url = URL.createObjectURL(cardBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinetracker-share.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Image downloaded! Opening WhatsApp...');
        setTimeout(() => {
          const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + appUrl)}`;
          window.open(waUrl, '_blank');
        }, 500);
      }
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      // Final fallback to text only
      const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + appUrl)}`;
      window.open(url, '_blank');
      toast.info('Opening WhatsApp with text...');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const generateShareCard = async () => {
    setGenerating(true);
    try {
      const blob = await generateCardBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinetracker-${media.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Share card downloaded!');
      }
    } catch (error) {
      console.error('Failed to generate card:', error);
      toast.error('Failed to generate share card');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    // Always open dialog for more control
    setOpen(true);
  };

  return (
    <>
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleShare();
        }}
        className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 h-9 text-xs"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-400" />
              Share Your Watch
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview Text */}
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <p className="text-sm text-white whitespace-pre-wrap">{shareText}</p>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareToTwitter}
                className="bg-blue-400/20 hover:bg-blue-400/30 text-blue-400 border border-blue-400/50"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>

              <Button
                onClick={shareToFacebook}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-600 border border-blue-600/50"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>

              <Button
                onClick={shareToWhatsApp}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>

              <Button
                onClick={copyToClipboard}
                className="bg-zinc-700/50 hover:bg-zinc-700 text-white border border-zinc-600"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>

            {/* Generate Share Card */}
            <Button
              onClick={generateShareCard}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              {generating ? 'Generating...' : 'Download Share Card'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}