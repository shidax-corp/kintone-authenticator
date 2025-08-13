import React from 'react';

export interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  rows?: number;
}

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  disabled = false,
  rows = 3
}: TextAreaFieldProps) {
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
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={`textarea-field ${error ? 'error' : ''}`}
            />
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

        .textarea-field {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #e3e7e8;
          border-radius: 3px;
          font-size: 13px;
          line-height: 1.54;
          color: #333333;
          background-color: #ffffff;
          box-sizing: border-box;
          resize: vertical;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          min-height: 60px;
        }

        .textarea-field:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .textarea-field:disabled {
          background-color: #f5f5f5;
          color: #999999;
          cursor: not-allowed;
        }

        .textarea-field.error {
          border-color: #e74c3c;
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