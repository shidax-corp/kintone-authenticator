import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import GlobalStyle from '@components/GlobalStyle';
import InputField from '@components/InputField';

type CallbackFunc = (passcode: string | null) => void | Promise<void>;

export interface PasscodeDialogProps {
  callback: CallbackFunc;
}

/**
 * パスコードの入力を促すダイアログを表示する。
 *
 * 一度閉じたダイアログを再表示することはできない。
 * 再表示したい場合は新しくマウントしなおすこと。
 *
 * @param callback ダイアログが閉じられるときに呼ばれる関数。キャンセルされた場合はnullが渡される。この関数でエラーを発生させると、ダイアログは閉じられず、エラーメッセージが表示される。
 */
export default function PasscodeDialog({ callback }: PasscodeDialogProps) {
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

  const handleClose = async () => {
    if (passcodeRef.current.trim() === '') {
      setError('パスコードを入力してください。');
      return false;
    }

    try {
      await callback(passcodeRef.current);
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
      if (action === 'CANCEL' || action === 'CLOSE') {
        try {
          await callback(null);
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

      return handleClose();
    }
  );

  useEffect(() => {
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
  }, [div]);

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
}
