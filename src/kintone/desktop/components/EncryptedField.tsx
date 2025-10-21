import { useEffect, useState } from 'react';

import EncryptedFieldBase from '@components/EncryptedField';

import { getPasscodes, savePasscode } from '../../lib/keychain';
import PasscodeDialog from './PasscodeDialog';

type EncryptedFieldProps = {
  label: string;
  value: string;
  onChange?: (newValue: string) => void;
  encryptionPasscode?: string | null;
  children: (
    value: string,
    onChange: (newValue: string) => void
  ) => React.ReactNode;
};

export default function EncryptedField({
  label,
  value,
  encryptionPasscode,
  onChange,
  children,
}: EncryptedFieldProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [decryptionPasscodes, setDecryptionPasscodes] = useState<string[]>();

  useEffect(() => {
    getPasscodes().then((passcodes) => {
      setDecryptionPasscodes(passcodes);
    });
  }, []);

  return (
    <>
      <EncryptedFieldBase
        label={label}
        value={value}
        encryptionPasscode={encryptionPasscode}
        decryptionPasscodes={[
          ...(decryptionPasscodes || []),
          ...(encryptionPasscode ? [encryptionPasscode] : []),
        ]}
        onDecryptRequest={() => setShowDialog(true)}
        onChange={onChange}
      >
        {children}
      </EncryptedFieldBase>

      {showDialog ? (
        <PasscodeDialog
          callback={async (passcode) => {
            if (passcode) {
              setShowDialog(false);
              await savePasscode(passcode);
              setDecryptionPasscodes([...passcode]);
            }
          }}
        />
      ) : null}
    </>
  );
}
