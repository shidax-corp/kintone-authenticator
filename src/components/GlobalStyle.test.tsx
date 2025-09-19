import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import GlobalStyle from './GlobalStyle';

describe('GlobalStyle', () => {
  it('applies color-scheme: light to prevent dark theme styling issues', () => {
    const TestComponent = () => <div>Test content</div>;

    const { container } = render(
      <GlobalStyle>
        <TestComponent />
      </GlobalStyle>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toContain('color-scheme: light');
  });

  it('renders children correctly', () => {
    const TestComponent = () => (
      <div data-testid="test-content">Test content</div>
    );

    const { getByTestId } = render(
      <GlobalStyle>
        <TestComponent />
      </GlobalStyle>
    );

    expect(getByTestId('test-content')).toBeInTheDocument();
  });

  it('applies tint styles when tint prop is true', () => {
    const TestComponent = () => <div>Test content</div>;

    const { container } = render(
      <GlobalStyle tint>
        <TestComponent />
      </GlobalStyle>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement?.textContent).toContain('245, 245, 245'); // tint background
  });

  it('applies normal styles when tint prop is false', () => {
    const TestComponent = () => <div>Test content</div>;

    const { container } = render(
      <GlobalStyle tint={false}>
        <TestComponent />
      </GlobalStyle>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement?.textContent).toContain('255, 255, 255'); // normal background
  });
});
