import { useCallback, useEffect, useRef } from 'react';

import { QRReadError, readQRFromCanvas } from '@lib/qr-reader';

export interface ScannerProps {
  open?: boolean;
  onRead: (data: string) => void;
  onError: (error: Error) => void;
}

/**
 * QRコードをスキャンするためのコンポーネント。
 * カメラを使用してQRコードを読み取り、成功した場合は`onRead`コールバックを呼び出す。
 * 失敗した場合は`onError`コールバックを呼び出す。
 * 画面にはカメラのプレビューが表示される。
 *
 * モーダル付き版は`@components/OTPInputField/Scanner`にある。
 *
 * @param onRead - QRコードが正常にスキャンされたときに呼び出されるコールバック関数。
 * @param onError - QRコードのスキャンに失敗したときに呼び出されるコールバック関数。
 */
export default function Scanner({ onRead, onError }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      onError(new QRReadError('カメラの初期化に失敗しました'));
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
            onRead(qrData);
          }
        } catch {
          // QRコードが見つからない場合は継続してスキャン
        }
      }
    }, 200);
  }, [onError, onRead]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
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
    }
  }, [onError, startScanning]);

  useEffect(() => {
    startCamera();

    return () => {
      stopScanning();
    };
  }, [startCamera, stopScanning]);

  return (
    <div>
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
      <style jsx>{`
        div {
          width: 100%;
          height: 100%;

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
        canvas {
          display: none;
        }
      `}</style>
    </div>
  );
}
