import React from 'react';
import GlobalStyle from '@components/GlobalStyle';
import { SelectionView } from './popup/SelectionView';
import type { KintoneRecord } from './lib/types';

interface AuthenticatorWrapperProps {
  onRegister: () => void;
  isModal?: boolean;
  onClose?: () => void;
  onFieldSelect?: (
    type: 'username' | 'password' | 'otp',
    value: string,
    recordId?: string
  ) => void;
  initialRecords?: KintoneRecord[];
  allRecords?: KintoneRecord[];
  initialSearchQuery?: string;
}

/**
 * SelectionViewをGlobalStyleでラップした統合コンポーネント
 * ポップアップとコンテンツスクリプトモーダルの両方で使用し、デザインを統一する
 */
export const AuthenticatorWrapper: React.FC<AuthenticatorWrapperProps> = (
  props
) => {
  return (
    <GlobalStyle>
      <SelectionView {...props} />
    </GlobalStyle>
  );
};

export default AuthenticatorWrapper;
