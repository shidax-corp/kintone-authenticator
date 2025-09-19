import QRScanner from '@components/QRScanner';

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
  return (
    <div className={`outer ${open ? 'open' : ''}`} onClick={() => onClose()}>
      <div className="inner" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}>×</button>
        {/* TODO: ちゃんとアイコンにする */}

        <span>QRコードをスキャンしてください</span>

        {open && (
          <QRScanner onRead={onRead} onError={onError} onClose={onClose} />
        )}
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
      `}</style>
    </div>
  );
}
