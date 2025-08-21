# Clippy AI

An Electron + React desktop application for AI assistance.

## Application Architecture

### Entry Point Flow
```
index.html → main.tsx → App.tsx
```

1. **`index.html`** - Browser entry point containing the root div and script loader
2. **`app/renderer/main.tsx`** - React bootstrap file that renders the App component
3. **`app/renderer/App.tsx`** - Main React component containing all UI logic

### Development Setup

The application runs in two processes during development:

- **React Frontend**: Runs on Vite dev server (`http://localhost:5174/`)
- **Electron Main Process**: `app/main/main.ts` (currently minimal)

### Project Structure

```
clippy-ai/
├── index.html              # Vite entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── app/
│   ├── main/
│   │   └── main.ts         # Electron main process
│   ├── preload/
│   │   └── preload.ts      # Electron preload script
│   ├── renderer/           # React application
│   │   ├── main.tsx        # React bootstrap
│   │   ├── App.tsx         # Main React component
│   │   ├── components/     # UI components
│   │   └── store/          # State management
│   └── shared/             # Shared utilities
│       ├── llm.ts          # LLM integration
│       └── command.ts      # Command handling
```

## Development

### Prerequisites
- Node.js
- npm

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5174/`

### Available Scripts

- `npm run dev` - Start both React and Electron in development mode
- `npm run dev:react` - Start only the React development server
- `npm run dev:electron` - Start only the Electron main process
- `npm start` - Start Electron in production mode

## How It Works

### Development Mode
- **React app** runs on Vite server with hot reload
- **Electron process** starts but currently has no window code
- Develop entirely in the browser at `localhost:5174`

### Production Mode (Future)
- React app builds to static files
- Electron loads the built files as a desktop application

The beauty of this setup is fast development with all modern tooling (Vite, hot reload, browser dev tools) while maintaining the ability to package as a desktop app later.
