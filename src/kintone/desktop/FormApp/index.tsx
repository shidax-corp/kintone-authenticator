import { useEffect, useEffectEvent, useState } from 'react';

import { decrypt, encrypt, isEncrypted } from '@lib/crypto';
import type { OTPAuthRecord } from '@lib/otpauth-uri';

import InputField from '@components/InputField';
import MaskedField from '@components/MaskedField';
import OTPInputField from '@components/OTPInputField';
import PasscodeInputField from '@components/PasscodeInputField';

import PasscodeDialog from '../components/PasscodeDialog';

export interface FormAppProps {
  record: kintone.types.Fields;
}

export default function FormApp({ record }: FormAppProps) {
  const [encryptionPasscode, setEncryptionPasscode] = useState<string | null>(
    null
  );
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);

  // 暗号化しない要素
  const [name, setName] = useState(record?.name.value || '');
  const [url, setUrl] = useState(record?.url.value || '');

  // 暗号化する要素
  const [username, setUsername] = useState(record?.username.value || '');
  const [password, setPassword] = useState(record?.password.value || '');
  const [otpuri, setOtpuri] = useState(record?.otpuri.value || '');

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

      return event;
    }
  );

  useEffect(() => {
    // 標準のフィールドは使わないので非表示にする
    kintone.app.record.setFieldShown('name', false);
    kintone.app.record.setFieldShown('url', false);
    kintone.app.record.setFieldShown('username', false);
    kintone.app.record.setFieldShown('password', false);
    kintone.app.record.setFieldShown('otpuri', false);

    // レコードを保存する前にkintoneに値を伝えるハンドラを登録する
    kintone.events.on(
      ['app.record.create.submit', 'app.record.edit.submit'],
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
      {isEncrypted(username) || isEncrypted(password) || isEncrypted(otpuri) ? (
        <>
          <MaskedField
            label="ユーザー名"
            onClick={() => setShowPasscodeDialog(true)}
          />
          <MaskedField
            label="パスワード"
            onClick={() => setShowPasscodeDialog(true)}
          />
          <MaskedField
            label="ワンタイムパスワード"
            onClick={() => setShowPasscodeDialog(true)}
          />
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
            label="ワンタイムパスワード"
            value={otpuri}
            onChange={(value: string, info: OTPAuthRecord | null) => {
              setOtpuri(value);

              if (!name && info?.issuer) {
                setName(info.issuer);
              }
              if (!username && info?.accountName) {
                setUsername(info.accountName);
              }
            }}
          />
          <PasscodeInputField
            value={encryptionPasscode}
            onChange={setEncryptionPasscode}
          />
        </>
      )}
      <style jsx>{`
        div > :global(*) {
          margin-bottom: 1em;
        }
      `}</style>

      {showPasscodeDialog && (
        <PasscodeDialog
          callback={async (passcode) => {
            if (!passcode) {
              setShowPasscodeDialog(false);
              return;
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
              setShowPasscodeDialog(false);
            } catch {
              throw new Error('パスコードが違います。');
            }
          }}
        />
      )}
    </div>
  );
}
