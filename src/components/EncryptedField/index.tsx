import { type ReactNode, Suspense, use, useCallback } from 'react';

import { decrypt, encrypt, isEncrypted } from '@lib/crypto';

import DummyField from './DummyField';

type EncryptedFieldProps = {
  label: string;
  value: string;
  encryptionPasscode?: string | null;
  decryptionPasscodes?: string[];
  onChange?: (newValue: string) => void;
  onDecryptRequest: () => void;
  children: (value: string, onChange?: (newValue: string) => void) => ReactNode;
};

export default function EncryptedField({
  label,
  value,
  encryptionPasscode = null,
  decryptionPasscodes = [],
  onChange,
  onDecryptRequest,
  children,
}: EncryptedFieldProps) {
  const cb = useCallback(
    (newValue: string) => {
      if (!encryptionPasscode) {
        onChange?.(newValue);
        return;
      }

      encrypt(newValue, encryptionPasscode)
        .then((encryptedValue) => {
          onChange?.(encryptedValue);
        })
        .catch((err) => {
          console.error(`Failed to encrypt field:`, err);
        });
    },
    [onChange, encryptionPasscode]
  );

  if (!isEncrypted(value)) {
    return children(value, cb);
  }

  if (!encryptionPasscode) {
    return <DummyField label={label} onClick={onDecryptRequest} />;
  }

  const decryptedValue = use(
    (async () => {
      for (const passcode of decryptionPasscodes) {
        try {
          return await decrypt(value, passcode);
        } catch {
          // continue to next passcode
        }
      }
      throw new Error('Failed to decrypt field: No valid passcode found');
    })()
  );

  return (
    <Suspense
      fallback={<DummyField label={label} onClick={onDecryptRequest} />}
    >
      {children(decryptedValue, cb)}
    </Suspense>
  );
}
