import { useEffect, useRef, useState } from 'react';

import type { OTPAuthRecord } from '@lib/otpauth-uri';

import OTPField from '@components/OTPField';

import Scanner from './Scanner';

export type FormAppProps = {
  initialURI?: string;
};

export default function FormApp({ initialURI = '' }: FormAppProps) {
  const [uri, setUri] = useState<string>(initialURI);
  const viewpanel = useRef<viewpanelConqueror | null>(null);

  useEffect(() => {
    kintone.mobile.app.record.setFieldShown('otpuri', false);

    viewpanel.current = new viewpanelConqueror();
    return () => {
      viewpanel.current?.liberate();
    };
  }, []);

  const setFieldValue = (field: keyof kintone.types.Fields, value: string) => {
    const { record } = kintone.mobile.app.record.get();

    kintone.mobile.app.record.set({
      record: {
        ...record,
        [field]: {
          value: value,
          type: record[field].type,
        },
      },
    });
  };

  const onScanned = (u: string, info: OTPAuthRecord) => {
    setFieldValue('otpuri', u);
    setUri(u);

    setFieldValue('name', info.issuer || '');
    setFieldValue('username', info.accountName || '');
  };

  if (!uri) {
    return <Scanner onRead={onScanned} />;
  } else {
    return (
      <div>
        <OTPField uri={uri} boldLabel fontSize="2rem" />
        <button
          type="button"
          onClick={() => {
            const backup = uri;

            setFieldValue('otpuri', '');
            setUri('');

            viewpanel.current?.conquer(() => {
              setFieldValue('otpuri', backup);
              setUri(backup);
              viewpanel.current?.liberate();
            });
          }}
        >
          📷 {/* TODO: 絵文字ではなくアイコンにする */}
        </button>

        <style jsx>{`
          div {
            margin: 0.5em 1em 1em 0.5em;
            display: flex;
            align-items: end;
          }
          div :global(:first-child) {
            flex-grow: 1;
          }
          div :global(:has(> .otp-field)) {
            margin-left: 0.5em;
          }
          button {
            border-radius: 4px;
            background-image: linear-gradient(
              to top,
              #c3c2c4,
              #efefef 30%,
              #fff 80%
            );
            background-repeat: no-repeat;
            background-position: center;
            border: 1px solid #c3c2c4;
            margin-left: 0.5em;
            width: 36px;
            height: 36px;
          }
        `}</style>
      </div>
    );
  }
}

/** 画面下にある「キャンセル」や「保存」などのボタンがある部分を乗っ取るためのクラス。
 *
 * @param onCancel - キャンセルボタンが押されたときのコールバック関数。
 */
class viewpanelConqueror {
  private leftArea: HTMLDivElement;
  private cancelButton: HTMLButtonElement;
  private saveButton: HTMLButtonElement;
  private createdCancelButton: HTMLButtonElement | null = null;

  constructor() {
    this.leftArea = document.querySelector(
      '.gaia-mobile-v2-app-record-edittoolbar-left'
    )! as HTMLDivElement;
    this.cancelButton = document.querySelector(
      '.gaia-mobile-v2-app-record-edittoolbar-cancel'
    )! as HTMLButtonElement;
    this.saveButton = document.querySelector(
      '.gaia-mobile-v2-app-record-edittoolbar-save'
    )! as HTMLButtonElement;
  }

  conquer(onCancel: () => void) {
    this.cancelButton.style.display = 'none';
    this.saveButton.style.display = 'none';

    const newCancelButton = document.createElement('button');
    newCancelButton.textContent = 'キャンセル';
    newCancelButton.className = 'gaia-mobile-v2-app-record-edittoolbar-cancel';
    newCancelButton.onclick = onCancel;
    this.leftArea.appendChild(newCancelButton);
    this.createdCancelButton = newCancelButton;
  }

  liberate() {
    this.createdCancelButton?.remove();
    this.createdCancelButton = null;
    this.cancelButton.style.display = '';
    this.saveButton.style.display = '';
  }
}
