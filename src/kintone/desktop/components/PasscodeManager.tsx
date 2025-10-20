import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import GlobalStyle from '@components/GlobalStyle';
import InputField from '@components/InputField';

const inMemoryPasscodeStore = new Set<string>();

export function PasscodeDialog({
  callback,
}: {
  callback: (passcode: string | null) => void;
}) {
  const [passcode, setPasscode] = useState<string>('');

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
    dialog
      .then((dialog) => dialog.show())
      .then(() => {
        callback(passcode);
      })
      .catch(() => {
        callback(null);
      });

    return () => {
      dialog.then((dialog) => dialog.hide());
      div.remove();
    };
  }, [dialog, div, callback, passcode]);

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

export const savePasscode = (passcode: string) => {
  inMemoryPasscodeStore.add(passcode);
};

export const getPasscodes = () => {
  return Array.from(inMemoryPasscodeStore);
};
