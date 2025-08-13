import React from 'react';
import { createRoot } from 'react-dom/client';
import { OptionsForm } from './OptionsForm';

const root = createRoot(document.getElementById('app')!);
root.render(<OptionsForm />);