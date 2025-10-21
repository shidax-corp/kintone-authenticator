import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import GlobalStyle from '@components/GlobalStyle';
import InputField from '@components/InputField';

interface PasscodeDialogProps {
  callback: (passcode: string | null) => void;
}

export default function PasscodeDialog({ callback }: PasscodeDialogProps) {
  const [passcode, setPasscode] = useState('');
  const passcodeRef = useRef(passcode);

  useEffect(() => {
    passcodeRef.current = passcode;
  }, [passcode]);

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

  useEffect(() => {
    let close = () => {};

    dialog
      .then(async (dialog) => {
        close = () => dialog.close();
        const action = await dialog.show();
        callback(action === 'OK' ? passcodeRef.current : null);
      })
      .catch(() => {
        callback(null);
      });

    return () => {
      close();
      div.remove();
    };
  }, [dialog, callback]);

  return (
    <>
      {createPortal(
        <GlobalStyle tint>
          <InputField
            type="password"
            label="パスコード"
            value={passcode}
            onChange={setPasscode}
            required
          />
        </GlobalStyle>,
        div
      )}
    </>
  );
}
