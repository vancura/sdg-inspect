# SDG Inspect

A tool for inspecting, formatting, and visualizing SDG JSONL files. Designed for
Subject Matter Experts (SMEs) at Red Hat's InstructLab to easily upload, format,
and analyze SDG files.

## Features

- Upload JSONL files with a streamlined interface
- Load example JSONL content with a single click
- Format SDG JSONL content with syntax highlighting for Q&A pairs
- Visually distinguishable user/assistant interactions with color-coding
- Interactive highlighting with bidirectional sync between editor and preview
- Smart scrolling with element centering in preview panel
- Clear functionality with complete state reset

## Setup

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Usage instructions

### Basic workflow

1. **Load the application** by running `yarn dev` and opening the local URL
   (typically [http://localhost:3000](http://localhost:3000))
2. **Upload an SDG JSONL file** using the "Upload" button or use the "Example"
   button to load a sample file
3. **View and edit** the JSONL content in the editor panel on the left
4. **View the highlighted SDG content** with color-coded user/assistant
   interactions in the preview panel on the right
5. **Navigate between views** by clicking on content in either panel, which automatically
   synchronizes the position in both views and centers the content
6. **Clear the editor** using the red trash button to start over

### SDG JSONL format support

The application is designed specifically for SDG JSONL files with this structure:

- Files contain one JSON object per line
- Each object typically has `messages` array with user/assistant interactions
- Messages often have `<|user|>` and `<|assistant|>` markers
- Metadata may include information about the SDG document, domain, and dataset type

### Interactive features

#### Expected results

- The SDG JSONL content is displayed in the editor with syntax highlighting
- In the preview panel, content is organized with:
    - Blue highlighting for user questions
    - Green highlighting for assistant answers
    - Proper metadata formatting with purple accents for SDG documents and domains
- Question/Answer pairs are clearly distinguished with different background colors and borders
- Clicking on an entry in either panel highlights and scrolls to the
  corresponding content in the other panel, centering it in view
- The active line in the editor is highlighted with a light background
- Clear completely resets the editor to its initial state

#### Synchronized navigation

1. Navigate through the editor using standard keyboard shortcuts
2. As the cursor moves in the editor, the corresponding block in the preview
   panel is highlighted and smoothly scrolled into view
3. Clicking on a block in the preview panel positions the cursor at the
   corresponding line in the editor and centers the block

## Project structure

```text
src/
├── components/              # UI components
│   ├── Button.tsx           # Reusable button component with Solar icons
│   ├── EditorPanel.tsx      # CodeMirror editor component
│   ├── Icon.tsx             # Solar icon wrapper component
│   ├── InputActions.tsx     # Upload and example file buttons
│   ├── PreviewBlock.tsx     # Formatted preview block components
│   ├── PreviewPanel.tsx     # Preview panel for formatted content
│   └── TextEditor.tsx       # Main editor with bidirectional sync
├── hooks/                   # Custom React hooks
│   ├── useContentParser.ts  # Hook for parsing JSONL content
│   └── useEditorEvents.ts   # Hook for editor event handling
├── stores/                  # Nanostores for state management
│   ├── SdgContext.tsx       # React context for SDG state
│   └── sdgStore.ts          # Central store for application state
├── types/                   # TypeScript type definitions
│   ├── blockTypes.ts        # Types for preview blocks
│   ├── editorTypes.ts       # Types for editor components
│   └── index.ts             # Core type definitions
├── utils/                   # Utility functions
│   ├── blockUtils.ts        # Block-related utility functions
│   ├── editorUtils.ts       # Editor-related utility functions
│   ├── htmlUtils.ts         # HTML-related utility functions
│   └── jsonlUtils.ts        # JSONL formatting and highlighting utilities
├── main.ts                  # Main entry point
└── styles.css               # Global styles
```

## Architecture

The application is built with a modular architecture featuring:

- **Component Separation**: Clear boundaries between the editor, preview, and blocks
- **Custom Hooks**: Reusable logic extracted into hooks for parser and event handling
- **Type Safety**: Comprehensive TypeScript interfaces for all components and data structures
- **State Management**: Centralized state using Nanostores with React Context integration
- **Smart Scrolling**: Intelligent scroll position management with element centering

### Key Components

- **TextEditor**: Main orchestration component that coordinates between editor and preview
- **EditorPanel**: Handles CodeMirror setup and interaction
- **PreviewPanel**: Displays formatted content with smart scrolling
- **PreviewBlock**: Renders individual SDG blocks with proper formatting

### Data Flow

1. User input is captured in the editor
2. Updates flow through the state management system
3. Content is parsed into structured blocks
4. Preview renders these blocks with appropriate styling
5. Bidirectional synchronization keeps both views in sync
6. Smart scrolling ensures optimal content visibility

## Technologies used

- **Vite**: Fast, modern frontend tooling
- **TypeScript**: Strictly typed code for better maintainability
- **React**: Component-based UI library
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Nanostores**: Lightweight state management with React Context integration
- **Solar Icons**: Modern icon set via Iconify integration
- **CodeMirror 6**: Advanced code editor with syntax highlighting
- **IBM Plex Fonts**: Sans and Mono fonts for clean typography

## Development features

### Build & development

- **Hot Module Replacement (HMR)** with error overlay
- **TypeScript** support with strict type checking
- **Asset Optimization:**
    - Images (JPG, PNG, GIF, WEBP, AVIF)
    - SVGs (SVGO with viewBox preservation)
    - Fonts (WOFF2 with compression)
- **Compression:**
    - Brotli (level 11)
    - Gzip fallback (level 9)
    - Applied to: JS, CSS, HTML, SVG, WOFF2
    - Threshold: 10KB

### Analysis & inspection

- Build inspection at `/__inspect/` in dev mode
- Bundle analysis at `.stats/stats.html` (analyze mode)
- Compressed size reporting

## Development setup

After cloning the repository:

```bash
# Install dependencies and set up VSCode SDK
yarn setup
```

This will:

1. Install all dependencies
2. Configure VSCode for Yarn PnP (Plug'n'Play)
3. Set up TypeScript, ESLint, and Prettier integration

Alternatively, you can run:

```bash
# Install dependencies only
yarn install
```

## Available scripts

### Development

```bash
# Start development server (with HMR)
yarn dev

# or
yarn start

# Preview production build
yarn preview
```

### Building

```bash
# Production build (includes TypeScript check)
yarn build

# Analyze bundle (generates .stats/stats.html)
yarn analyze
```

### Code quality

```bash
# Type checking
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Formatting
yarn format

# Full code check (lint + format + types)
yarn check
```

### Maintenance

```bash
# Clean build artifacts and caches
yarn clean

# Full cleanup (including dependencies)
yarn clean:all
```

## License

MIT License - See [LICENSE](LICENSE) file for details

## Author

[Vaclav Vancura](https://github.com/vancura)
