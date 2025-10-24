import { useState } from 'react';

import { decrypt, isEncrypted } from '@lib/crypto';
import { isValidURL } from '@lib/url';

import { useKeychain } from '@components/Keychain';
import OTPField from '@components/OTPField';
import PasswordField from '@components/PasswordField';
import TextField from '@components/TextField';

export interface ItemProps {
  appId: number;
  viewId: number;
  account: kintone.types.SavedFields;
}

export default function Item({
  appId,
  viewId,
  account: { $id, name, username, password, otpuri, url },
}: ItemProps) {
  // 暗号化されうる要素
  const [usernameState, setUsername] = useState(username.value);
  const [passwordState, setPassword] = useState(password.value);
  const [otpuriState, setOtpuri] = useState(otpuri.value);

  const isEncryptedRecord =
    isEncrypted(usernameState) ||
    isEncrypted(passwordState) ||
    isEncrypted(otpuriState);

  // パスコードが入力されたときの処理
  // Keychainから読み取ったときにも、PasscodePromptから入力されたときにも呼ばれる。
  const { MaskedField } = useKeychain(async (passcode: string) => {
    if (!isEncryptedRecord) {
      return false;
    }

    try {
      if (usernameState && isEncrypted(usernameState)) {
        setUsername(await decrypt(usernameState, passcode));
      }

      if (passwordState && isEncrypted(passwordState)) {
        setPassword(await decrypt(passwordState, passcode));
      }

      if (otpuriState && isEncrypted(otpuriState)) {
        setOtpuri(await decrypt(otpuriState, passcode));
      }

      return true;
    } catch {
      return false;
    }
  });

  const onUpdateURI = async (uri: string) => {
    kintone.api('/k/v1/record.json', 'PUT', {
      app: appId,
      id: $id.value,
      record: {
        otpuri: {
          value: uri,
        },
      },
    });
  };

  return (
    <li>
      <div>
        <a
          href={`/k/m/${appId}/show?record=${$id.value}&view=${viewId}&q`}
          className="detail"
        >
          {name.value}
        </a>
        {isValidURL(url.value) ? (
          <a
            href={url.value}
            className="url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {url.value}
          </a>
        ) : (
          <span className="url">{url.value}</span>
        )}
      </div>
      {!usernameState ? null : isEncrypted(usernameState) ? (
        <MaskedField label="ユーザー名" />
      ) : (
        <TextField label="ユーザー名" value={usernameState} />
      )}

      {!passwordState ? null : isEncrypted(passwordState) ? (
        <MaskedField label="パスワード" />
      ) : (
        <PasswordField value={passwordState} />
      )}

      {!otpuriState ? null : isEncrypted(otpuriState) ? (
        <MaskedField label="ワンタイムパスワード" />
      ) : (
        <OTPField uri={otpuriState} onUpdate={onUpdateURI} fontSize="2.5rem" />
      )}
      <style jsx>{`
        li {
          display: block;
        }
        div {
          margin: 0 0 8px;
          white-space: nowrap;
          overflow: hidden;
        }
        .detail {
          font-weight: bold;
          margin-right: 8px;
        }
        .url {
          color: var(--ka-fg-light-color);
          text-decoration: none;
        }
        a.url:hover {
          text-decoration: underline;
        }
      `}</style>
    </li>
  );
}
