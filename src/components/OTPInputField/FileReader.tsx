import React, { useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';

import { readQRFromFile } from '@lib/qr-reader';

export interface FileReaderProps {
  open?: boolean;
  onFileRead: (content: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * QRコードの画像を開いて内容を読み取るためのコンポーネント。
 * コンポーネントがマウントされると同時にファイル選択ダイアログが表示される。
 *
 * @param open - モーダルを開くかどうかを示すフラグ。
 * @param onFileRead - ファイルの内容が正常に読み取られたときに呼び出されるコールバック関数。
 * @param onError - ファイルの読み取りに失敗したときに呼び出されるコールバック関数。
 * @param onClose - ファイル選択ダイアログが閉じたときに呼び出されるコールバック関数。
 */
export default function FileReader({
  open,
  onFileRead,
  onError,
  onClose = () => {},
}: FileReaderProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      onClose();
      return;
    }

    try {
      const qrContent = await readQRFromFile(file);
      onFileRead(qrContent);
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      } else {
        onError?.(new Error('Failed to read QR code from file'));
      }
    } finally {
      // Reset the input to allow selecting the same file again
      if (ref.current) {
        ref.current.value = '';
      }
      onClose();
    }
  };

  useEffect(() => {
    if (open && ref.current) {
      ref.current.click(); // ファイル選択ダイアログを開く
    }
  }, [open]);

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('cancel', onClose);
      return () => {
        ref.current?.removeEventListener('cancel', onClose);
      };
    }
  }, [onClose]);

  return (
    <input
      type="file"
      accept="image/*"
      ref={ref}
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />
  );
}
