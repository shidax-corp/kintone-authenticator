import { useEffect, useRef, useState } from 'react';

import type { OTPAuthRecord } from '@lib/otpauth-uri';

import OTPField from '@components/OTPField';

import Scanner from './Scanner';

export type OTPInputFieldProps = {
  uri: string;
  onScanned: (uri: string, info: OTPAuthRecord) => void;
  openScannerByDefault?: boolean;
};

export default function OTPInputField({
  uri,
  onScanned,
  openScannerByDefault = false,
}: OTPInputFieldProps) {
  const [opened, setOpened] = useState<boolean>(
    openScannerByDefault && uri === ''
  );
  const viewpanel = useRef<viewpanelConqueror | null>(null);

  useEffect(() => {
    if (!viewpanel.current && openScannerByDefault) {
      const saveButton = document.querySelector(
        '.gaia-mobile-v2-app-record-edittoolbar-save'
      );
      if (saveButton instanceof HTMLButtonElement) {
        saveButton.style.display = 'none';
      }
    }

    viewpanel.current = new viewpanelConqueror();

    return () => {
      viewpanel.current?.liberate();
    };
  }, [openScannerByDefault]);

  if (opened) {
    return (
      <Scanner
        onRead={(uri: string, info: OTPAuthRecord) => {
          viewpanel.current?.liberate();
          onScanned(uri, info);
        }}
      />
    );
  } else {
    return (
      <div>
        <OTPField uri={uri} boldLabel fontSize="2rem" />
        <button
          type="button"
          onClick={() => {
            setOpened(true);

            viewpanel.current?.conquer(() => {
              viewpanel.current?.liberate();
              setOpened(false);
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
    if (this.createdCancelButton) {
      this.createdCancelButton.remove();
    }

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
