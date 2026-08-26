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

    // Generate to Canvas with High Contrast and Proper Quiet Zone Margin
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        text,
        {
          width: size,
          margin: 4, // 4-module quiet zone is critical for smartphone camera detection
          color: {
            dark: '#000000', // Pure black for 100% optical contrast
            light: '#FFFFFF', // Pure white background
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

    // Generate High-Res DataURL for download or image display
    QRCode.toDataURL(
      text,
      {
        width: 600,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
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

  // Fallback to online QR service if local canvas has any unexpected issues
  const apiFallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    text
  )}&margin=12&color=000000&bgcolor=FFFFFF`;

  return (
    <div
      className={`relative flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-neutral-200 ${className}`}
    >
      {!isError ? (
        <canvas
          ref={canvasRef}
          className="rounded-lg max-w-full h-auto object-contain block mx-auto"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      ) : (
        <img
          src={apiFallbackUrl}
          alt="QR Code"
          className="rounded-lg max-w-full h-auto object-contain block mx-auto"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      )}
    </div>
  );
};
