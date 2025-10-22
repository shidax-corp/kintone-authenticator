import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import GlobalStyle from '@components/GlobalStyle';
import InputField from '@components/InputField';

type CallbackFunc = (passcode: string | null) => void;

export interface PasscodeDialogProps {
  error?: string;
  callback: CallbackFunc;
}

export default function PasscodeDialog({
  error,
  callback,
}: PasscodeDialogProps) {
  const [passcode, setPasscode] = useState<string>('');

  // コールバック関数の中からでも最新のパスコードにアクセスできるようにする。
  const passcodeRef = useRef(passcode);
  const handlePasscodeChange = (value: string) => {
    passcodeRef.current = value;
    setPasscode(value);
  };

  const div = useMemo(() => {
    const div = document.createElement('div');
    div.style.padding = '.5em 1em';
    return div;
  }, []);

  const dialog = useMemo(() => {
    return kintone.createDialog({
      title: 'パスコードを入力してください',
      body: div,
      showOkButton: true,
      showCancelButton: true,
    });
  }, [div]);

  const showDialog = useEffectEvent((callback: CallbackFunc) => {
    let close = () => {};

    dialog
      .then(async (dialog) => {
        close = () => {
          dialog.close();
        };

        const action = await dialog.show();
        if (action === 'OK') {
          // ここではStateの値はキャプチャされてしまっているので、Ref経由で最新の値を取得する。
          callback(passcodeRef.current);
        } else {
          callback(null);
        }
      })
      .catch(() => {
        callback(null);
      });

    return () => {
      close();
      div.remove();
    };
  });

  useEffect(() => {
    return showDialog(callback);
  }, [callback]);

  return (
    <>
      {createPortal(
        <GlobalStyle tint>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              callback(passcodeRef.current);
            }}
          >
            <InputField
              type="password"
              label="パスコード"
              value={passcode}
              onChange={handlePasscodeChange}
              required
            />
            {error && (
              <div style={{ color: 'red', marginBottom: '0.5em' }}>{error}</div>
            )}
          </form>
        </GlobalStyle>,
        div
      )}
    </>
  );
}
