/**
 * OS.Tech - Entry Point do Renderer (React)
 * Monta a aplicação React no DOM.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no DOM.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
