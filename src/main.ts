/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './components/App.js';
import './styles.css';

const root = window.document.getElementById('app');

if (root) {
    ReactDOM.render(React.createElement(App), root);
} else {
    const appDiv = window.document.createElement('div');
    appDiv.id = 'app';
    window.document.body.appendChild(appDiv);
    ReactDOM.render(React.createElement(App), appDiv);
}
