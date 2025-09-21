import { createRoot } from 'react-dom/client';

import GlobalStyle from '@components/GlobalStyle';

import { OptionsForm } from './OptionsForm';

const root = createRoot(document.getElementById('app')!);
root.render(
  <GlobalStyle>
    <OptionsForm />
  </GlobalStyle>
);
