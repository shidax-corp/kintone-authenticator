import { useEffect, useEffectEvent, useState } from 'react';

import { decrypt, encrypt, isEncrypted } from '@lib/crypto';
import type { OTPAuthRecord } from '@lib/otpauth-uri';

import InputField from '@components/InputField';
import { useKeychain } from '@components/Keychain';
import PasscodeInputField from '@components/PasscodeInputField';

import OTPInputField from './OTPInputField';

export type FormAppProps = {
  record?: kintone.types.Fields;
};

export default function FormApp({ record }: FormAppProps) {
  const [encryptionPasscode, setEncryptionPasscode] = useState<string | null>(
    null
  );

  // 暗号化しない要素
  const [name, setName] = useState(record?.name.value || '');
  const [url, setUrl] = useState(record?.url.value || '');

  // 暗号化する要素
  const [username, setUsername] = useState(record?.username.value || '');
  const [password, setPassword] = useState(record?.password.value || '');
  const [otpuri, setOtpuri] = useState(record?.otpuri.value || '');

  const isEncryptedRecord =
    isEncrypted(username) || isEncrypted(password) || isEncrypted(otpuri);

  // パスコードが入力されたときの処理
  // Keychainから読み取ったときにも、PasscodePromptから入力されたときにも呼ばれる。
  const { savePasscode, MaskedField } = useKeychain(
    async (passcode: string) => {
      if (!isEncryptedRecord) {
        return false;
      }

      try {
        if (username && isEncrypted(username)) {
          setUsername(await decrypt(username, passcode));
        }

        if (password && isEncrypted(password)) {
          setPassword(await decrypt(password, passcode));
        }

        if (otpuri && isEncrypted(otpuri)) {
          setOtpuri(await decrypt(otpuri, passcode));
        }

        setEncryptionPasscode(passcode);
        return true;
      } catch {
        return false;
      }
    }
  );

  // レコード保存直前に呼ばれるイベントハンドラ。
  // フィールドの値はStateで管理しており、保存ボタンを押したときにはじめてこのハンドラを通じてkintone側に伝えられる。
  // このときに暗号化も同時に行う。
  const onSubmit = useEffectEvent(
    async (
      event:
        | kintone.events.RecordCreateSubmitEvent
        | kintone.events.RecordEditSubmitEvent
    ) => {
      event.record.name.value = name;
      event.record.url.value = url;

      event.record.username.value =
        username && !isEncrypted(username) && encryptionPasscode
          ? await encrypt(username, encryptionPasscode)
          : username;
      event.record.password.value =
        password && !isEncrypted(password) && encryptionPasscode
          ? await encrypt(password, encryptionPasscode)
          : password;
      event.record.otpuri.value =
        otpuri && !isEncrypted(otpuri) && encryptionPasscode
          ? await encrypt(otpuri, encryptionPasscode)
          : otpuri;

      if (encryptionPasscode) {
        await savePasscode(encryptionPasscode);
      }

      return event;
    }
  );

  useEffect(() => {
    // 標準のフィールドは使わないので非表示にする
    kintone.mobile.app.record.setFieldShown('name', false);
    kintone.mobile.app.record.setFieldShown('url', false);
    kintone.mobile.app.record.setFieldShown('username', false);
    kintone.mobile.app.record.setFieldShown('password', false);
    kintone.mobile.app.record.setFieldShown('otpuri', false);

    // レコードを保存する前にkintoneに値を伝えるハンドラを登録する
    kintone.events.on(
      ['mobile.app.record.create.submit', 'mobile.app.record.edit.submit'],
      onSubmit
    );
  }, []);

  return (
    <div>
      <InputField
        label="名前"
        placeholder="サイト名"
        value={name}
        onChange={setName}
        type="text"
        required
      />
      <InputField
        label="URL"
        placeholder="https://example.com"
        value={url}
        onChange={setUrl}
        type="url"
      />
      {isEncryptedRecord ? (
        <>
          <MaskedField label="ユーザー名" />
          <MaskedField label="パスワード" />
          <MaskedField label="ワンタイムパスワード" />
        </>
      ) : (
        <>
          <InputField
            label="ユーザー名"
            placeholder=""
            value={username}
            onChange={setUsername}
            type="text"
          />
          <InputField
            label="パスワード"
            placeholder=""
            value={password}
            onChange={setPassword}
            type="text"
          />
          <OTPInputField
            uri={otpuri}
            onScanned={(value: string, info: OTPAuthRecord) => {
              setOtpuri(value);

              if (!name && info.issuer) {
                setName(info.issuer);
              }
              if (!username && info.accountName) {
                setUsername(info.accountName);
              }
            }}
            openScannerByDefault={record == null}
          />
          <PasscodeInputField
            value={encryptionPasscode}
            onChange={setEncryptionPasscode}
          />
        </>
      )}
      <style jsx>{`
        div {
          margin-bottom: 28px;
          --ka-bg-input-rgb: 255, 255, 255;
          --ka-bg-input-color: rgb(var(--ka-bg-input-rgb));
        }
        div > :global(*) {
          margin: 0.5em 1em 1em 0.5em;
        }
        div :global(div:has(> input)) {
          margin-left: 0.5em;
          background-color: transparent;
        }
        div :global(input) {
          border-radius: 6px;
          border: 1px solid var(--ka-bg-dark-color);
          box-shadow: inset 0 2px 3px rgba(var(--ka-bg-dark-rgb), 0.5);
        }
      `}</style>
    </div>
  );
}
