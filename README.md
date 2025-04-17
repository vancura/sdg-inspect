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
   synchronizes the position in both views
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
  corresponding content in the other panel
- The active line in the editor is highlighted with a light background
- Clear completely resets the editor to its initial state

#### Synchronized navigation

1. Navigate through the editor using standard keyboard shortcuts
2. As the cursor moves in the editor, the corresponding block in the preview
   panel is highlighted
3. Clicking on a block in the preview panel positions the cursor at the
   corresponding line in the editor

#### Example JSONL file

The repository includes an `example.jsonl` file in the public directory for
testing purposes, accessible via the "Example" button.

## Project structure

```text
src/
├── components/           # UI components
│   ├── App.tsx           # Main application component
│   ├── Button.tsx        # Reusable button component with Solar icons
│   ├── Icon.tsx          # Solar icon wrapper component
│   ├── InputActions.tsx  # Upload and example file buttons
│   ├── JsonBlock.tsx     # Formatted JSON block components
│   └── TextEditor.tsx    # JSONL editor with bidirectional sync
├── stores/               # Nanostores for state management
│   └── sdgStore.ts       # Central store for application state
├── types/                # TypeScript type definitions
│   └── index.ts          # Core type definitions
├── utils/                # Utility functions
│   ├── htmlUtils.ts      # HTML-related utility functions
│   └── jsonlUtils.ts     # JSONL formatting and highlighting utilities
├── main.ts               # Main entry point
└── styles.css            # Global styles
```

## Technologies used

- **Vite**: Fast, modern frontend tooling
- **TypeScript**: Strictly typed code for better maintainability
- **React**: Component-based UI library
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Nanostores**: Lightweight state management
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
