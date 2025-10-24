import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import GlobalStyle from '@components/GlobalStyle';
import InputField from '@components/InputField';
import type {
  PromptComponent,
  PromptComponentProps,
} from '@components/Keychain';

/**
 * kintoneのダイアログを使ってパスコードの入力を促すコンポーネント
 */
const PasscodeDialog: PromptComponent = ({
  shown,
  callback,
}: PromptComponentProps) => {
  const [error, setError] = useState<string | null>(null);
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

  const callbackAndResetForm = async (passcode: string | null) => {
    await callback(passcode);
    passcodeRef.current = '';
    setPasscode('');
    setError(null);
  };

  const handleClose = async () => {
    if (passcodeRef.current.trim() === '') {
      setError('パスコードを入力してください。');
      return false;
    }

    try {
      await callbackAndResetForm(passcodeRef.current);
      return true;
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
      return false;
    }
  };

  const closeDialog = useRef<() => void>(() => {});

  const beforeClose = useEffectEvent(
    async (action: 'OK' | 'CANCEL' | 'CLOSE') => {
      if (action === 'OK') {
        return handleClose();
      } else {
        try {
          await callbackAndResetForm(null);
          return true;
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError(String(e));
          }
        }
        return false;
      }
    }
  );

  useEffect(() => {
    if (!shown) {
      return;
    }

    const dialog = kintone.createDialog({
      title: 'パスコードを入力してください',
      body: div,
      showOkButton: true,
      showCancelButton: true,
      beforeClose: beforeClose,
    });

    let close = () => {};

    dialog.then((dialog) => {
      dialog.show();

      close = () => {
        dialog.close();
      };
      closeDialog.current = close;
    });

    return () => {
      close();
    };
  }, [shown, div]);

  if (!shown) {
    return null;
  }

  return (
    <>
      {createPortal(
        <GlobalStyle tint>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleClose().then((canClose) => {
                if (canClose) {
                  closeDialog.current();
                }
              });
            }}
          >
            <InputField
              type="password"
              label="パスコード"
              value={passcode}
              onChange={handlePasscodeChange}
              required
            />
            {error && <div>{error}</div>}
          </form>

          <style jsx>{`
            div {
              color: red;
              margin-top: 0.5em;
            }
          `}</style>
        </GlobalStyle>,
        div
      )}
    </>
  );
};

export default PasscodeDialog;
