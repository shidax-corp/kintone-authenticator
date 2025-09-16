import React, { type ReactElement } from 'react';
import { type Root, createRoot } from 'react-dom/client';

import GlobalStyle, { type GlobalStyleOptions } from '@components/GlobalStyle';

export default class Renderer {
  private root: Root | null = null;
  private container: HTMLElement | null = null;

  render(
    container: HTMLElement,
    element: ReactElement,
    opts?: GlobalStyleOptions
  ): void {
    if (this.container !== container) {
      this.unmount();
    }
    if (!this.root) {
      this.container = container;
      this.root = createRoot(container);
    }

    this.root.render(<GlobalStyle {...opts}>{element}</GlobalStyle>);
  }

  unmount(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
      this.container = null;
    }
  }
}
