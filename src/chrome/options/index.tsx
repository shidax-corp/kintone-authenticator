import React from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsForm } from './OptionsForm';
import GlobalStyle from '@components/GlobalStyle';

const root = createRoot(document.getElementById('app')!);
root.render(
  <GlobalStyle>
    <OptionsForm />
  </GlobalStyle>
);
