import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface PhotoPickerProps {
  value: string;
  onChange: (base64: string) => void;
  label: string;
  disabled?: boolean;
}

export default function PhotoPicker({ value, onChange, label, disabled }: PhotoPickerProps) {
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("Не удалось получить доступ к камере");
    }
  }

  function takePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onChange(dataUrl);
    stopCamera();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleRemove() {
    onChange("");
  }

  if (showCamera) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        <div className="relative rounded-xl overflow-hidden border border-border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            <button
              type="button"
              onClick={takePhoto}
              className="w-14 h-14 rounded-full bg-white border-4 border-white/50 shadow-lg hover:scale-105 transition-transform"
            />
            <button
              type="button"
              onClick={stopCamera}
              className="w-14 h-14 rounded-full bg-destructive/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <Icon name="X" size={22} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {value ? (
        <div className="relative w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border border-border">
          <img src={value} alt="" className="w-full h-full object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <Icon name="X" size={14} className="text-white" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border bg-secondary/50 text-muted-foreground text-sm hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Icon name="Upload" size={16} />
            Загрузить
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border bg-secondary/50 text-muted-foreground text-sm hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Icon name="Camera" size={16} />
            Камера
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
