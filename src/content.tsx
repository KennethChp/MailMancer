import React from 'react';
import { createRoot } from 'react-dom/client';
import ContentScript from './components/ContentScript';
import './index.css';

// Create a container for our React app
const container = document.createElement('div');
container.id = 'mailmancer-root';
document.body.appendChild(container);

// Render our React app
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ContentScript />
  </React.StrictMode>
);

console.log('MailMancer: Content script loaded');
