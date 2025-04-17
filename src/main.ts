/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/* eslint-env browser */

import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './components/App.js';
import './styles.css';

const root = window.document.getElementById('app');

if (root) {
    createRoot(root).render(React.createElement(App));
} else {
    const appDiv = window.document.createElement('div');
    appDiv.id = 'app';
    window.document.body.appendChild(appDiv);
    createRoot(appDiv).render(React.createElement(App));
}
