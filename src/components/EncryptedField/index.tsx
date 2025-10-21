import { type ReactNode, Suspense, use, useCallback, useMemo } from 'react';

import { decrypt, encrypt, isEncrypted } from '@lib/crypto';

import DummyField from './DummyField';

type ChildrenFunc = (
  value: string,
  onChange: (newValue: string) => void
) => ReactNode;

interface EncryptedFieldProps {
  label: string;
  value: string;
  encryptionPasscode?: string | null;
  decryptionPasscodes?: string[];
  onChange?: (newValue: string) => void;
  onDecryptRequest: () => void;
  children: ChildrenFunc;
}

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

  const fallback = <DummyField label={label} onClick={onDecryptRequest} />;

  const content = useMemo(async () => {
    for (const passcode of decryptionPasscodes) {
      try {
        return children(await decrypt(value, passcode), cb);
      } catch {
        // continue to next passcode
      }
    }
    return fallback;
  }, [value, decryptionPasscodes, children, cb]);

  if (!isEncrypted(value)) {
    return children(value, cb);
  }

  return (
    <Suspense fallback={fallback}>
      <RenderPromise>{content}</RenderPromise>
    </Suspense>
  );
}

function RenderPromise({ children }: { children: Promise<ReactNode> }) {
  return use(children);
}
