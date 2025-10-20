import { type ReactNode, Suspense, use, useCallback } from 'react';

import { decrypt, encrypt, isEncrypted } from '@lib/crypto';

import DummyField from './DummyField';

type EncryptedFieldProps = {
  label: string;
  value: string;
  encryptionPasscode?: string | null;
  onChange?: (newValue: string) => void;
  onDecryptRequest: () => void;
  children: (value: string, onChange?: (newValue: string) => void) => ReactNode;
};

export default function EncryptedField({
  label,
  value,
  encryptionPasscode = null,
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

  const decryptedValue = use(decrypt(value, encryptionPasscode));

  return (
    <Suspense fallback={<DummyField label={label} />}>
      {children(decryptedValue, cb)}
    </Suspense>
  );
}
