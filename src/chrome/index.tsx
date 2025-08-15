import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthenticatorWrapper } from './AuthenticatorWrapper';
import { RegisterForm } from './popup/RegisterForm';
import GlobalStyle from '@components/GlobalStyle';

type ViewMode = 'selection' | 'register';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [registerOtpUri, setRegisterOtpUri] = useState<string | undefined>();

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
    <>
      {viewMode === 'selection' && (
        <AuthenticatorWrapper onRegister={() => handleRegister()} />
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
    </>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
