import React, { useState } from 'react';

export interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
}

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <div className="control-gaia control-show-gaia field-container">
        <div className="control-label-gaia">
          <span className="control-label-text-gaia">
            {label}
            {required && <span className="required-marker"> *</span>}
          </span>
        </div>
        <div className="control-value-gaia value-container">
          <div className="control-value-content-gaia">
            <div className="password-input-container">
              <input
                type={isVisible ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`password-field ${error ? 'error' : ''}`}
              />
              <button
                type="button"
                className="toggle-button"
                onClick={() => setIsVisible(!isVisible)}
                disabled={disabled}
                title={isVisible ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                {isVisible ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {helpText && <div className="help-text">{helpText}</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
        <div className="control-design-gaia"></div>
      </div>
      <style jsx>{`
        .field-container {
          box-sizing: border-box;
          margin-bottom: 12px;
          height: auto;
          width: 100%;
        }

        .value-container {
          padding: 0 !important;
        }

        .required-marker {
          color: #e74c3c;
          font-weight: normal;
        }

        .password-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-field {
          width: 100%;
          padding: 6px 35px 6px 8px;
          border: 1px solid #e3e7e8;
          border-radius: 3px;
          font-size: 13px;
          line-height: 1.54;
          color: #333333;
          background-color: #ffffff;
          box-sizing: border-box;
        }

        .password-field:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .password-field:disabled {
          background-color: #f5f5f5;
          color: #999999;
          cursor: not-allowed;
        }

        .password-field.error {
          border-color: #e74c3c;
        }

        .toggle-button {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          cursor: pointer;
          padding: 2px;
          font-size: 14px;
          color: #666666;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .toggle-button:hover:not(:disabled) {
          background-color: #f0f0f0;
        }

        .toggle-button:disabled {
          color: #cccccc;
          cursor: not-allowed;
        }

        .help-text {
          font-size: 12px;
          color: #666666;
          margin-top: 4px;
          line-height: 1.4;
        }

        .error-message {
          font-size: 12px;
          color: #e74c3c;
          margin-top: 4px;
          line-height: 1.4;
        }
      `}</style>
    </>
  );
}