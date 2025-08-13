import React, { useState, useEffect, useMemo } from 'react';
import {
  validateOTPAuthURI,
  formatOTPAuthParameters,
} from '@lib/otpauth-validation';

export interface OTPAuthURIFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onParsedDataChange?: (parsedData: any) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export default function OTPAuthURIField({
  label,
  value,
  onChange,
  onParsedDataChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
}: OTPAuthURIFieldProps) {
  const [showExamples, setShowExamples] = useState(false);
  const [showParameters, setShowParameters] = useState(false);

  const validationResult = useMemo(() => {
    if (!value.trim()) {
      return {
        isValid: true,
        errors: [],
        parsedData: undefined,
      };
    }
    return validateOTPAuthURI(value);
  }, [value]);

  useEffect(() => {
    if (onParsedDataChange) {
      onParsedDataChange(validationResult.parsedData);
    }
  }, [validationResult.parsedData, onParsedDataChange]);

  const formattedParameters = useMemo(() => {
    if (validationResult.parsedData) {
      return formatOTPAuthParameters(validationResult.parsedData);
    }
    return null;
  }, [validationResult.parsedData]);

  const examples = [
    {
      title: 'TOTP (時間ベース)',
      uri: 'otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example',
      description: '30秒ごとに変更されるパスワード',
    },
    {
      title: 'HOTP (カウンタベース)',
      uri: 'otpauth://hotp/Example:bob@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example&counter=1',
      description: 'ボタンを押すたびに変更されるパスワード',
    },
    {
      title: 'カスタム設定',
      uri: 'otpauth://totp/MyService:user@service.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=MyService&algorithm=SHA256&digits=8&period=60',
      description: 'SHA256、8桁、60秒周期の設定',
    },
  ];

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
            <div className="otpauth-input-container">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={`otpauth-textarea ${
                  validationResult.errors.length > 0 ? 'error' : ''
                } ${validationResult.isValid && value.trim() ? 'success' : ''}`}
                spellCheck={false}
              />

              {/* Validation Status */}
              {value.trim() && (
                <div className="validation-status">
                  {validationResult.isValid ? (
                    <div className="validation-success">
                      <span className="validation-icon">✓</span>
                      <span>有効なOTPAuth URI</span>
                    </div>
                  ) : (
                    <div className="validation-error">
                      <span className="validation-icon">✗</span>
                      <span>{validationResult.errors[0]?.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Parameters Display */}
              {formattedParameters && validationResult.isValid && (
                <div className="parameters-section">
                  <div className="parameters-header">
                    <button
                      type="button"
                      className="toggle-button"
                      onClick={() => setShowParameters(!showParameters)}
                    >
                      {showParameters ? '▼' : '▶'} 抽出されたパラメータ
                    </button>
                  </div>
                  {showParameters && (
                    <div className="parameters-content">
                      <div className="parameter-grid">
                        <div className="parameter-item">
                          <span className="parameter-label">タイプ:</span>
                          <span className="parameter-value">
                            {formattedParameters.type}
                          </span>
                        </div>
                        <div className="parameter-item">
                          <span className="parameter-label">発行者:</span>
                          <span className="parameter-value">
                            {formattedParameters.issuer}
                          </span>
                        </div>
                        <div className="parameter-item">
                          <span className="parameter-label">アカウント:</span>
                          <span className="parameter-value">
                            {formattedParameters.accountName}
                          </span>
                        </div>
                        <div className="parameter-item">
                          <span className="parameter-label">アルゴリズム:</span>
                          <span className="parameter-value">
                            {formattedParameters.algorithm}
                          </span>
                        </div>
                        <div className="parameter-item">
                          <span className="parameter-label">桁数:</span>
                          <span className="parameter-value">
                            {formattedParameters.digits}
                          </span>
                        </div>
                        {'period' in formattedParameters && formattedParameters.period && (
                          <div className="parameter-item">
                            <span className="parameter-label">周期 (秒):</span>
                            <span className="parameter-value">
                              {formattedParameters.period}
                            </span>
                          </div>
                        )}
                        {'counter' in formattedParameters && formattedParameters.counter && (
                          <div className="parameter-item">
                            <span className="parameter-label">カウンタ:</span>
                            <span className="parameter-value">
                              {formattedParameters.counter}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Help and Examples */}
              <div className="help-section">
                <div className="help-text">
                  QRコードから読み取ったOTPAuth
                  URIを入力してください（任意入力）
                </div>
                <div className="examples-header">
                  <button
                    type="button"
                    className="toggle-button small"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    {showExamples ? '▼' : '▶'} 入力例を表示
                  </button>
                </div>
                {showExamples && (
                  <div className="examples-content">
                    <div className="format-guide">
                      <h4>URI形式:</h4>
                      <code>
                        otpauth://TYPE/LABEL?secret=SECRET&issuer=ISSUER&parameter=value
                      </code>
                      <ul>
                        <li>
                          <strong>TYPE</strong>: totp (時間ベース) または hotp
                          (カウンタベース)
                        </li>
                        <li>
                          <strong>LABEL</strong>: 発行者:アカウント名 (例:
                          Google:user@gmail.com)
                        </li>
                        <li>
                          <strong>SECRET</strong>: Base32エンコードされた秘密鍵
                          (必須)
                        </li>
                        <li>
                          <strong>ISSUER</strong>: 発行者名 (推奨)
                        </li>
                      </ul>
                    </div>

                    <div className="examples-list">
                      <h4>入力例:</h4>
                      {examples.map((example, index) => (
                        <div key={index} className="example-item">
                          <div className="example-title">{example.title}</div>
                          <div className="example-description">
                            {example.description}
                          </div>
                          <div className="example-uri">
                            <code>{example.uri}</code>
                            <button
                              type="button"
                              className="copy-button"
                              onClick={() => {
                                onChange(example.uri);
                                setShowExamples(false);
                              }}
                            >
                              使用
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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

        .otpauth-input-container {
          position: relative;
        }

        .otpauth-textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #e3e7e8;
          border-radius: 4px;
          font-size: 13px;
          line-height: 1.4;
          color: #333333;
          background-color: #ffffff;
          box-sizing: border-box;
          resize: vertical;
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          min-height: 80px;
          transition: border-color 0.2s ease;
        }

        .otpauth-textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .otpauth-textarea:disabled {
          background-color: #f5f5f5;
          color: #999999;
          cursor: not-allowed;
        }

        .otpauth-textarea.error {
          border-color: #e74c3c;
        }

        .otpauth-textarea.success {
          border-color: #2ecc71;
        }

        .validation-status {
          margin-top: 6px;
          padding: 6px 8px;
          border-radius: 3px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .validation-success {
          color: #27ae60;
          background-color: #e8f5e8;
          border: 1px solid #2ecc71;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 3px;
        }

        .validation-error {
          color: #c0392b;
          background-color: #fdf2f2;
          border: 1px solid #e74c3c;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 3px;
        }

        .validation-icon {
          font-weight: bold;
          font-size: 14px;
        }

        .parameters-section {
          margin-top: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f8f9fa;
        }

        .parameters-header {
          padding: 8px 12px;
          background-color: #e9ecef;
          border-bottom: 1px solid #ddd;
        }

        .toggle-button {
          background: none;
          border: none;
          color: #495057;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          padding: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .toggle-button.small {
          font-size: 11px;
        }

        .toggle-button:hover {
          color: #007bff;
        }

        .parameters-content {
          padding: 12px;
        }

        .parameter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .parameter-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background-color: white;
          border: 1px solid #e9ecef;
          border-radius: 3px;
          font-size: 12px;
        }

        .parameter-label {
          font-weight: 500;
          color: #495057;
        }

        .parameter-value {
          font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
          color: #6f42c1;
          font-weight: 500;
        }

        .help-section {
          margin-top: 8px;
        }

        .help-text {
          font-size: 12px;
          color: #666666;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        .examples-header {
          margin-bottom: 8px;
        }

        .examples-content {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 12px;
          margin-top: 6px;
        }

        .format-guide {
          margin-bottom: 16px;
        }

        .format-guide h4 {
          margin: 0 0 6px 0;
          font-size: 13px;
          color: #495057;
        }

        .format-guide code {
          display: block;
          background-color: #e9ecef;
          padding: 6px 8px;
          border-radius: 3px;
          font-size: 11px;
          margin-bottom: 8px;
          word-break: break-all;
        }

        .format-guide ul {
          margin: 0;
          padding-left: 16px;
          font-size: 11px;
          line-height: 1.4;
        }

        .format-guide li {
          margin-bottom: 2px;
        }

        .examples-list h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #495057;
        }

        .example-item {
          margin-bottom: 12px;
          padding: 8px;
          background-color: white;
          border: 1px solid #dee2e6;
          border-radius: 3px;
        }

        .example-title {
          font-weight: 500;
          font-size: 12px;
          color: #495057;
          margin-bottom: 2px;
        }

        .example-description {
          font-size: 11px;
          color: #6c757d;
          margin-bottom: 6px;
        }

        .example-uri {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .example-uri code {
          flex: 1;
          background-color: #f8f9fa;
          padding: 4px 6px;
          border-radius: 3px;
          font-size: 10px;
          word-break: break-all;
          min-width: 0;
        }

        .copy-button {
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 4px 8px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        }

        .copy-button:hover {
          background-color: #0056b3;
        }

        @media (max-width: 768px) {
          .parameter-grid {
            grid-template-columns: 1fr;
          }

          .example-uri {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </>
  );
}
