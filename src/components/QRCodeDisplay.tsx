import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  text: string;
  size?: number;
  className?: string;
  onGenerated?: (dataUrl: string) => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  text,
  size = 280,
  className = '',
  onGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    if (!text) return;
    setIsError(false);

    // Generate to Canvas
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        text,
        {
          width: size,
          margin: 2,
          color: {
            dark: '#2D2A26',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) {
            console.error('QR Canvas Error:', error);
            setIsError(true);
          }
        }
      );
    }

    // Generate DataURL for download or image fallback
    QRCode.toDataURL(
      text,
      {
        width: 500,
        margin: 2,
        color: {
          dark: '#2D2A26',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (error, url) => {
        if (!error && url) {
          setDataUrl(url);
          if (onGenerated) {
            onGenerated(url);
          }
        }
      }
    );
  }, [text, size, onGenerated]);

  // Fallback to online API if canvas has an unexpected glitch
  const apiFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    text
  )}&margin=10&color=2D2A26`;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {!isError ? (
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-inner max-w-full h-auto object-contain"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <img
          src={apiFallbackUrl}
          alt="QR Code"
          className="rounded-xl shadow-inner max-w-full h-auto object-contain"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      )}
    </div>
  );
};
