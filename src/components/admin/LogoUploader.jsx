import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Info, Crop, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useConfigurableOptions } from './ConfigLoader';
import Cropper from 'react-easy-crop';

// Helper function to create image from URL
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper to get cropped image
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

export default function LogoUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [logoData, setLogoData] = useState({
    name: '',
    category: 'platform',
    entityType: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [availableEntities, setAvailableEntities] = useState([]);

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [isSvg, setIsSvg] = useState(false);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load dynamic options
  const { options: platformOptions } = useConfigurableOptions('platform');
  const { options: deviceOptions } = useConfigurableOptions('device');
  const { options: audioOptions } = useConfigurableOptions('audio_format');
  const { options: videoOptions } = useConfigurableOptions('video_format');

  // Load all entities from existing data + admin options
  useEffect(() => {
    const loadAllEntities = async () => {
      try {
        const [universes, allMedia, schedules, allOptions] = await Promise.all([
          base44.entities.Universe.list(),
          base44.entities.Media.list(),
          base44.entities.WatchSchedule.list(),
          base44.entities.ConfigurableOption.filter({ is_active: true })
        ]);

        // Extract unique values from existing media
        const platformsSet = new Set();
        const devicesSet = new Set();
        const audioSet = new Set();
        const videoSet = new Set();

        // From media
        allMedia.forEach(m => {
          if (m.platform) platformsSet.add(m.platform);
          if (m.device) devicesSet.add(m.device);
        });

        // From schedules
        schedules.forEach(s => {
          if (s.audio_format) audioSet.add(s.audio_format);
          if (s.video_format) videoSet.add(s.video_format);
          if (s.device) devicesSet.add(s.device);
        });

        // From admin options
        allOptions.forEach(opt => {
          if (opt.category === 'platform') platformsSet.add(opt.value);
          if (opt.category === 'device') devicesSet.add(opt.value);
          if (opt.category === 'audio_format') audioSet.add(opt.value);
          if (opt.category === 'video_format') videoSet.add(opt.value);
        });

        const platforms = Array.from(platformsSet).sort().map(p => ({ type: 'platform', value: p, label: p }));
        const devices = Array.from(devicesSet).sort().map(d => ({ type: 'device', value: d, label: d }));
        const audio = Array.from(audioSet).sort().map(a => ({ type: 'format', value: a, label: a }));
        const video = Array.from(videoSet).sort().map(v => ({ type: 'format', value: v, label: v }));
        const universesList = universes.filter(u => u.is_active).map(u => ({ type: 'studio', value: u.name, label: u.name }));

        setAvailableEntities([...platforms, ...devices, ...audio, ...video, ...universesList]);
      } catch (error) {
        console.error('Failed to load entities:', error);
      }
    };
    loadAllEntities();
  }, []);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isSvgFile = file.type === 'image/svg+xml';
    setIsSvg(isSvgFile);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setOriginalImageSrc(dataUrl);
      setPreviewUrl(dataUrl);

      // Only show cropper for non-SVG images
      if (!isSvgFile) {
        setShowCropper(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!originalImageSrc || !croppedAreaPixels) return;

    try {
      const croppedBlob = await getCroppedImg(originalImageSrc, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], selectedFile.name, { type: 'image/png' });

      // Create preview URL for cropped image
      const croppedUrl = URL.createObjectURL(croppedBlob);
      setPreviewUrl(croppedUrl);
      setSelectedFile(croppedFile);
      setShowCropper(false);

      toast.success('Image cropped successfully');
    } catch (error) {
      console.error('Crop failed:', error);
      toast.error('Failed to crop image');
    }
  };

  const autoCropToContent = (imageData, width, height) => {
    const data = imageData.data;
    let minX = width, maxX = 0, minY = height, maxY = 0;

    // Find content bounds
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 10) { // Has content
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Add small padding
    const padding = 5;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  };

  const removeBackground = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    try {
      const img = await createImage(previewUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Detect background from corners
      const cornerPixels = [
        [0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1]
      ];

      let avgR = 0, avgG = 0, avgB = 0;
      cornerPixels.forEach(([x, y]) => {
        const idx = (y * img.width + x) * 4;
        avgR += data[idx];
        avgG += data[idx + 1];
        avgB += data[idx + 2];
      });
      avgR /= 4; avgG /= 4; avgB /= 4;

      const bgBrightness = (avgR + avgG + avgB) / 3;
      const isBlackBg = bgBrightness < 50;

      // Remove background
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        if (isBlackBg) {
          if (brightness < 30) data[i + 3] = 0;
        } else {
          if (brightness > 200) data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Auto-crop to content bounds
      const cropBounds = autoCropToContent(imageData, canvas.width, canvas.height);
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');

      croppedCanvas.width = cropBounds.width;
      croppedCanvas.height = cropBounds.height;
      croppedCtx.drawImage(
        canvas,
        cropBounds.x, cropBounds.y, cropBounds.width, cropBounds.height,
        0, 0, cropBounds.width, cropBounds.height
      );

      const processedBlob = await new Promise(resolve => {
        croppedCanvas.toBlob(resolve, 'image/png');
      });

      const processedFile = new File([processedBlob], selectedFile.name.replace(/\.\w+$/, '.png'), { type: 'image/png' });
      const processedUrl = URL.createObjectURL(processedBlob);

      setPreviewUrl(processedUrl);
      setProcessedPreviewUrl(processedUrl);
      setSelectedFile(processedFile);

      toast.success(`${isBlackBg ? 'Black' : 'White'} BG removed & auto-cropped to content`);
    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error('Failed to remove background');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !logoData.name || !logoData.entityType) {
      toast.error('Please provide a name, select entity, and choose a file');
      return;
    }

    setUploading(true);
    try {
      // Check for existing logo
      const existingLogos = await base44.entities.Logo.filter({
        name: logoData.entityType,
        category: logoData.category
      });

      // Convert file to Base64
      const fileToBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });

      const base64Url = await fileToBase64(selectedFile);
      const originalUrl = base64Url;

      if (existingLogos.length > 0) {
        // Backup existing logo before overwriting
        const existing = existingLogos[0];
        await base44.entities.Logo.update(existing.id, {
          original_url: originalUrl,
          processed_url: originalUrl,
          backup_url: existing.processed_url || existing.original_url, // Backup old logo
          tags: [logoData.entityType, ...(logoData.tags ? logoData.tags.split(',').map(t => t.trim()) : [])],
          is_active: true
        });
        toast.success('Logo updated - old version backed up');
      } else {
        // Create new logo
        await base44.entities.Logo.create({
          name: logoData.entityType,
          category: logoData.category,
          original_url: originalUrl,
          processed_url: originalUrl,
          tags: [logoData.entityType, ...(logoData.tags ? logoData.tags.split(',').map(t => t.trim()) : [])],
          is_active: true
        });
        toast.success('Logo uploaded - will appear automatically across the app');
      }

      onUploadComplete?.();

      // Broadcast logo update event
      window.dispatchEvent(new CustomEvent('logo-updated', {
        detail: { category: logoData.category, name: logoData.entityType }
      }));

      // Reset form
      setLogoData({ name: '', category: 'platform', entityType: '', tags: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
      setProcessedPreviewUrl(null);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-400" />
          Upload New Logo
        </h3>

        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <p className="font-semibold mb-1">Logo Guidelines:</p>
            <ul className="space-y-0.5 text-[11px]">
              <li>• Upload logo with white or black background</li>
              <li>• Crop from any side (top/bottom/left/right) - free aspect ratio</li>
              <li>• Use "Remove BG" to auto-detect and remove background</li>
              <li>• Works with both black bg + white text OR white bg + dark text</li>
              <li>• PNG/SVG format | Min: 200x200px | Cropped image used for matching</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-zinc-300">Select Entity Type</Label>
            <Select value={logoData.category} onValueChange={(value) => setLogoData({ ...logoData, category: value, entityType: '' })}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="platform" className="text-white">Platform</SelectItem>
                <SelectItem value="studio" className="text-white">Universe / Studio</SelectItem>
                <SelectItem value="device" className="text-white">Device</SelectItem>
                <SelectItem value="format" className="text-white">Audio/Video Format</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {logoData.category && (
            <div>
              <Label className="text-zinc-300">Select Specific Entity</Label>
              <Select
                value={logoData.entityType}
                onValueChange={(value) => {
                  const entity = availableEntities.find(e => e.value === value);
                  setLogoData({ ...logoData, entityType: value, name: entity?.label || value });
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Choose entity" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60 overflow-y-auto">
                  {availableEntities.length === 0 ? (
                    <div className="text-zinc-400 text-xs p-2">Loading options...</div>
                  ) : (
                    availableEntities
                      .filter(e =>
                        (logoData.category === 'platform' && e.type === 'platform') ||
                        (logoData.category === 'studio' && e.type === 'studio') ||
                        (logoData.category === 'device' && e.type === 'device') ||
                        (logoData.category === 'format' && e.type === 'format')
                      )
                      .length === 0 ? (
                      <div className="text-zinc-400 text-xs p-2">No {logoData.category} options found</div>
                    ) : (
                      availableEntities
                        .filter(e =>
                          (logoData.category === 'platform' && e.type === 'platform') ||
                          (logoData.category === 'studio' && e.type === 'studio') ||
                          (logoData.category === 'device' && e.type === 'device') ||
                          (logoData.category === 'format' && e.type === 'format')
                        )
                        .map(entity => (
                          <SelectItem key={entity.value} value={entity.value} className="text-white">
                            {entity.label}
                          </SelectItem>
                        ))
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-zinc-300">Additional Tags (optional)</Label>
            <Input
              value={logoData.tags}
              onChange={(e) => setLogoData({ ...logoData, tags: e.target.value })}
              placeholder="streaming, ott, video"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-zinc-300">Upload Logo File</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleFileSelect}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500 mt-1">PNG, JPG (with cropping) or SVG</p>
          </div>

          {previewUrl && !showCropper && (
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-400">Logo Preview</p>
                <div className="flex gap-2">
                  {!isSvg && (
                    <>
                      <Button
                        onClick={removeBackground}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                      >
                        {isProcessing ? 'Processing...' : 'Remove BG'}
                      </Button>
                      <Button
                        onClick={() => setShowCropper(true)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600"
                      >
                        <Crop className="w-3 h-3 mr-1" />
                        Crop
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Show both versions side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Original Preview */}
                <div>
                  <p className="text-[10px] text-zinc-500 mb-1">Original</p>
                  <div className="bg-zinc-900 p-3 rounded border border-zinc-700">
                    <img
                      src={previewUrl}
                      alt="Original"
                      className="max-h-20 w-full object-contain"
                    />
                  </div>
                </div>

                {/* On Black Background Preview */}
                <div>
                  <p className="text-[10px] text-zinc-500 mb-1">On Black (App Display)</p>
                  <div className="bg-black p-3 rounded border border-zinc-700">
                    <img
                      src={previewUrl}
                      alt="On Black"
                      className="max-h-20 w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {processedPreviewUrl && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  ✓ Background removed - transparent PNG ready
                </p>
              )}
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !logoData.entityType}
            className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Logo'}
          </Button>
        </div>
      </div>

      {/* Cropping Dialog */}
      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Crop className="w-5 h-5 text-purple-400" />
              Crop & Adjust Logo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cropper Area */}
            <div className="relative h-96 bg-black rounded-lg overflow-hidden">
              {originalImageSrc && (
                <Cropper
                  image={originalImageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={undefined}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>

            {/* Controls */}
            <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-zinc-300 text-xs flex items-center gap-2">
                    <ZoomIn className="w-3 h-3" />
                    Zoom
                  </Label>
                  <span className="text-xs text-zinc-400">{zoom.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-zinc-300 text-xs flex items-center gap-2">
                    <RotateCw className="w-3 h-3" />
                    Rotation
                  </Label>
                  <span className="text-xs text-zinc-400">{rotation}°</span>
                </div>
                <Slider
                  value={[rotation]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(value) => setRotation(value[0])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCropper(false)}
                variant="outline"
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropConfirm}
                className="flex-1 bg-gradient-to-r from-purple-500 to-emerald-500 hover:shadow-xl"
              >
                Apply Crop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}