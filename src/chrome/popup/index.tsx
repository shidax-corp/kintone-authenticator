import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import GlobalStyle from '@components/GlobalStyle';
import Keychain from '@components/Keychain';

import PasscodeDialog from '../components/PasscodeDialog';
import { ChromeLocalStorage } from '../lib/keychain-storage';
import { RegisterForm } from './RegisterForm';
import { SelectionView } from './SelectionView';

type ViewMode = 'selection' | 'register';

const App = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [registerOtpUri, setRegisterOtpUri] = useState<string | undefined>();

  // Chrome用のストレージを明示的に作成（メモ化して再生成を防ぐ）
  const storage = useMemo(() => new ChromeLocalStorage(), []);

  const handleRegister = (otpAuthUri?: string) => {
    setRegisterOtpUri(otpAuthUri);
    setViewMode('register');
  };

  const handleBack = () => {
    setRegisterOtpUri(undefined);
    setViewMode('selection');
  };

  const handleRegistrationSuccess = () => {
    setRegisterOtpUri(undefined);
    setViewMode('selection');
  };

  return (
    <Keychain prompt={PasscodeDialog} storage={storage}>
      {viewMode === 'selection' && (
        <GlobalStyle>
          <SelectionView onRegister={() => handleRegister()} />
        </GlobalStyle>
      )}
      {viewMode === 'register' && (
        <GlobalStyle>
          <RegisterForm
            otpAuthUri={registerOtpUri}
            onBack={handleBack}
            onSuccess={handleRegistrationSuccess}
          />
        </GlobalStyle>
      )}
    </Keychain>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
