import React, { useRef, useEffect, useState } from 'react';
import { readQRFromCanvas, QRReadError } from '@lib/qr-reader';

export interface ScannerProps {
  open?: boolean;
  onRead: (data: string) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
}

/**
 * QRコードをスキャンするためのコンポーネント。
 * カメラを使用してQRコードを読み取り、成功した場合は`onRead`コールバックを呼び出す。
 * 失敗した場合は`onError`コールバックを呼び出す。
 * 画面にはカメラのプレビューが表示される。
 *
 * @param open - モーダルを開くかどうかを示すフラグ。
 * @param onRead - QRコードが正常にスキャンされたときに呼び出されるコールバック関数。
 * @param onError - QRコードのスキャンに失敗したときに呼び出されるコールバック関数。
 * @param onClose - スキャン画面を閉じる操作をしたか、スキャンが完了または失敗したときに呼び出されるコールバック関数。
 */
export default function Scanner({
  open,
  onRead,
  onError,
  onClose = () => {},
}: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        startScanning();
      }
    } catch (error) {
      let errorMessage = 'カメラの起動に失敗しました';
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'カメラへのアクセスが許可されていません';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりません';
        }
      }
      onError(new Error(errorMessage));
      onClose();
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      onError(new QRReadError('Canvas context の取得に失敗しました'));
      return;
    }

    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const qrData = readQRFromCanvas(canvas);
          if (qrData) {
            stopScanning();
            onRead(qrData);
            onClose();
          }
        } catch (error) {
          // QRコードが見つからない場合は継続してスキャン
        }
      }
    }, 200);
  };

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  return (
    <div className={`outer ${open ? 'open' : ''}`} onClick={() => onClose()}>
      <div className="inner" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}>×</button>
        {/* TODO: ちゃんとアイコンにする */}

        <span>QRコードをスキャンしてください</span>

        <div className="video-container">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>

      <style jsx>{`
        .outer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          visibility: hidden;
          opacity: 0;
          transition:
            visibility 0.1s ease,
            opacity 0.1s ease;
        }
        .outer.open {
          visibility: visible;
          opacity: 1;
        }
        .inner {
          position: relative;
          width: 100%;
          max-width: 600px;
          height: 100%;
          max-height: 600px;
          background-color: var(--ka-bg-color);
          border-radius: 8px;
          overflow: hidden;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }
        span {
          display: block;
          color: var(--ka-fg-light-color);
          font-size: 110%;
          font-weight: bold;
          margin-bottom: 8px;
        }
        button {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: transparent;
          border: none;
          color: var(--ka-fg-color);
          font-size: 24px;
          cursor: pointer;
        }
        .video-container {
          flex: 1;
          background-color: var(--ka-bg-dark-color);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}
