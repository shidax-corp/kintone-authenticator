import React from 'react';
import type { ReactNode } from 'react';

export interface KintoneLikeFieldProps {
  label: string;
  width?: string;
  children: ReactNode;
}

export default function KintoneLikeField({ label, width = '100%', children }: KintoneLikeFieldProps) {
  return (
    <>
      <div className="control-gaia control-show-gaia field-container">
        <div className="control-label-gaia">
          <span className="control-label-text-gaia">{label}</span>
        </div>
        <div className="control-value-gaia value-container">
          <span className="control-value-content-gaia">{children}</span>
        </div>
        <div className="control-design-gaia"></div>
      </div>
      <style jsx>{`
        .field-container {
          box-sizing: border-box;
          margin-bottom: 12px;
          height: auto;
          width: ${width};
        }

        .value-container {
          padding: 0 !important;
        }
      `}</style>
    </>
  );
}
