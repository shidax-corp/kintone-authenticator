import { useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';

import { readQRFromImage } from '@lib/qr-reader';

export interface QRFileReaderProps {
  open?: boolean;
  onRead: (data: string) => void;
  onError: (error: Error) => void;
  onClose?: () => void;
}

/**
 * QRコードの画像を開いて内容を読み取るためのコンポーネント。
 *
 * @param open - ダイアログを開くかどうかを示すフラグ。
 * @param onRead - ファイルの内容が正常に読み取られたときに呼び出されるコールバック関数。
 * @param onError - ファイルの読み取りに失敗したときに呼び出されるコールバック関数。
 * @param onClose - 読み取り成功・失敗・キャンセルなどの理由でダイアログが閉じたときに呼び出されるコールバック関数。
 */
export default function QRFileReader({
  open,
  onRead,
  onError,
  onClose = () => {},
}: QRFileReaderProps) {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      onClose();
      return;
    }

    try {
      const data = await readQRFromImage(await readImageFromFile(file));
      onRead(data);
    } catch (error) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error('ファイルの読み取りに失敗しました'));
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
    const element = ref.current;
    if (element) {
      element.addEventListener('cancel', onClose);
      return () => {
        element.removeEventListener('cancel', onClose);
      };
    }
  }, [onClose]);

  return (
    <>
      <input type="file" accept="image/*" ref={ref} onChange={handleChange} />
      <style jsx>{`
        input {
          display: none;
        }
      `}</style>
    </>
  );
}

const readImageFromFile = (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選択してください');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result;
        if (typeof dataUrl !== 'string') {
          reject(new Error('ファイルを読み込めませんでした'));
          return;
        }

        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルを読み込めませんでした'));
    };

    reader.readAsDataURL(file);
  });
};
