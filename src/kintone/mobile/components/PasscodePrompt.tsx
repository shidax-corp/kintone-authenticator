/* global prompt, alert */
import { useEffect, useEffectEvent, useRef } from 'react';

import type {
  PromptComponent,
  PromptComponentProps,
} from '@components/Keychain';

/**
 * Web標準のprompt()関数を使ってパスコードの入力を促すコンポーネント
 */
const PasscodePrompt: PromptComponent = ({
  shown,
  callback,
}: PromptComponentProps) => {
  const calledRef = useRef(false);

  const handlePasscode = useEffectEvent(async () => {
    while (true) {
      const passcode = prompt('パスコードを入力してください');

      try {
        await callback(passcode);
        break;
      } catch (e) {
        if (passcode === null) {
          // ユーザーがキャンセルした場合は終了
          break;
        }
        alert(e instanceof Error ? e.message : String(e));
      }
    }
  });

  useEffect(() => {
    if (!shown) {
      calledRef.current = false;
      return;
    }

    if (calledRef.current) {
      return;
    }

    calledRef.current = true;

    handlePasscode();
  }, [shown]);

  return null;
};

export default PasscodePrompt;
