/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/* eslint-env browser */

import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './components/App.js';
import './styles.css';

// Get the root element.
const root = window.document.getElementById('app');

if (root) {
    // If the root element exists, render the app.
    createRoot(root).render(React.createElement(App));
} else {
    // If the root element does not exist, create it, and render the app.
    const appDiv = window.document.createElement('div');
    appDiv.id = 'app';
    window.document.body.appendChild(appDiv);
    createRoot(appDiv).render(React.createElement(App));
}
