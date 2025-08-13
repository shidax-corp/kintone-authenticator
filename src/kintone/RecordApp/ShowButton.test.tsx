import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShowButton from './ShowButton';

describe('ShowButton', () => {
  it('renders with the correct text', () => {
    const mockOnClick = jest.fn();
    render(<ShowButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: '表示' });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<ShowButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: '表示' });
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnClick = jest.fn();
    render(<ShowButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button', { name: '表示' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('is enabled by default', () => {
    const mockOnClick = jest.fn();
    render(<ShowButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: '表示' });
    expect(button).not.toBeDisabled();
  });

  it('has correct styling when disabled', () => {
    const mockOnClick = jest.fn();
    render(<ShowButton onClick={mockOnClick} disabled={true} />);

    const button = screen.getByRole('button', { name: '表示' });
    const styles = window.getComputedStyle(button);

    expect(styles.backgroundColor).toBe('rgb(245, 245, 245)');
    expect(styles.color).toBe('rgb(153, 153, 153)');
    expect(styles.cursor).toBe('not-allowed');
  });

  it('has correct styling when enabled', () => {
    const mockOnClick = jest.fn();
    render(<ShowButton onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: '表示' });
    const styles = window.getComputedStyle(button);

    expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(styles.color).toBe('rgb(51, 51, 51)');
    expect(styles.cursor).toBe('pointer');
  });
});
