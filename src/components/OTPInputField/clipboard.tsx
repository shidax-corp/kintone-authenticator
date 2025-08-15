import { readQRFromImage } from '@lib/qr-reader';

export const isClipboardAvailable = (): boolean => {
  return !!navigator?.clipboard?.read;
};

type Props = {
  onRead: (data: string) => void;
  onError: (error: Error) => void;
};

/**
 * クリップボードからQRコードを読み取る関数。
 * 他のコンポーネントで使うようなコールバックをそのまま流用できるように、あえてPromiseではなくコールバック形式にしてある。
 *
 * @param onRead - QRコードが正常に読み取られたときに呼び出されるコールバック関数。
 * @param onError - QRコードの読み取りに失敗したときに呼び出されるコールバック関数。
 */
export const readQRFromClipboard = ({ onRead, onError }: Props): void => {
  asyncReadQRFromClipboard()
    .then((data) => {
      onRead(data);
    })
    .catch((error) => {
      onError(error);
    });
};

/**
 * readFromClipboardの非同期版。
 */
const asyncReadQRFromClipboard = async (): Promise<string> => {
  let items: ClipboardItems;

  try {
    items = await navigator.clipboard.read();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new Error('クリップボードへのアクセスが許可されていません');
    } else {
      throw new Error('クリップボードの読み取りに失敗しました');
    }
  }

  let foundImage = false;

  for (const item of items) {
    const imageTypes = item.types.filter((type) => type.startsWith('image/'));
    if (imageTypes.length === 0) {
      continue;
    }

    foundImage = true;

    for (const imageType of imageTypes) {
      try {
        const blob = await item.getType(imageType);
        const dataUrl = await convertBlobToDataURL(blob);
        const result = await readQRFromImage(dataUrl);
        return result;
      } catch (error) {
        continue;
      }
    }
  }

  if (!foundImage) {
    throw new Error('画像がコピーされていません');
  }
  throw new Error('QRコードの読み取りに失敗しました');
};

const convertBlobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('読み込めませんでした'));
      }
    };
    reader.onerror = () => reject(new Error('読み込めませんでした'));
    reader.readAsDataURL(blob);
  });
};
