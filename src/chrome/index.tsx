import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SelectionView } from './popup/SelectionView';
import { RegisterForm } from './popup/RegisterForm';

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
    <div>
      {viewMode === 'selection' && (
        <SelectionView onRegister={() => handleRegister()} />
      )}
      {viewMode === 'register' && (
        <RegisterForm
          otpAuthUri={registerOtpUri}
          onBack={handleBack}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
