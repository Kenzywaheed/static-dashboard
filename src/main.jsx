import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rewriteLegacyAgreementPath = () => {
  if (typeof window === 'undefined' || window.location.hash) {
    return;
  }

  const legacyAgreementMatch = window.location.pathname.match(
    /^\/brand\/model-agreements\/([^/]+?)(?:\/review)?\/?$/,
  );

  if (!legacyAgreementMatch) {
    return;
  }

  const agreementId = decodeURIComponent(legacyAgreementMatch[1]);
  const nextHash = `#/collaboration?agreementId=${encodeURIComponent(agreementId)}&section=review`;
  const nextUrl = `${window.location.origin}/${nextHash}`;

  window.history.replaceState(null, '', nextUrl);
};

rewriteLegacyAgreementPath();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
