# SDG Inspect

A tool for inspecting, formatting, and visualizing SDG JSONL files. Designed for
Subject Matter Experts (SMEs) at Red Hat's InstructLab to easily upload, format,
analyze, and export SDG files.

## Features

- Upload or paste JSONL files with a streamlined interface
- Format SDG JSONL content with syntax highlighting for Q&A pairs
- Visually distinguishable user/assistant interactions
- Resizable content viewer for better analysis of large files
- Copy formatted content to clipboard with confirmation feedback
- Save formatted content to a file with automatic `.jsonl` extension
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
2. **Upload an SDG JSONL file** using the "Upload SDG" button or by pasting content
3. **Format the content** by clicking the "Inspect SDG" button
4. **View the highlighted SDG content** with color-coded user/assistant
   interaction pairs
5. **Copy the formatted content** using the "Copy to Clipboard" button
6. **Save the formatted content** using the "Save File" button
7. **Clear the editor** using the "Clear" button to start over

### SDG JSONL format support

The application is designed specifically for SDG JSONL files with this structure:

- Files contain one JSON object per line
- Each object typically has `messages` array with user/assistant interactions
- Messages often have `<|user|>` and `<|assistant|>` markers
- Metadata may include information about the SDG document, domain, and dataset type

### Testing features

#### Expected results

- The SDG JSONL content should be properly displayed in the editor
- After formatting, content is organized with:
    - Blue highlighting for user questions
    - Green highlighting for assistant answers
    - Proper metadata formatting
- Question/Answer pairs are clearly distinguished with different background colors
- Copy and Save functionality provide visual feedback when complete
- Clear completely resets the editor to its initial state

#### Resizable container feature

1. After formatting, the content appears in a formatted view
2. Drag the bottom-right corner of the container to resize it for better viewing
3. A tooltip indicates the resize functionality is available

#### Example JSONL file

The repository includes an `example.jsonl` file in the public directory for
testing purposes.

## Project structure

```text
src/
├── components/           # UI components
│   ├── App.tsx           # Main application component
│   ├── Button.tsx        # Reusable button component with Solar icons
│   ├── Icon.tsx          # Solar icon wrapper component
│   ├── InputActions.tsx  # Upload and paste buttons
│   ├── ResultActions.tsx # Format, copy, save buttons
│   └── TextEditor.tsx    # JSONL editor with formatting support
├── stores/               # Nanostores for state management
│   └── sdgStore.ts       # Central store for application state
├── types/                # TypeScript type definitions
│   └── index.ts          # Core type definitions
├── utils/                # Utility functions
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
2. Configure VSCode for Yarn PnP
3. Set up TypeScript, ESLint, and Prettier integration

## Available Scripts

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
