import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const rawPort = process.env.PORT ?? '3000';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const isProduction = process.env.NODE_ENV === 'production';
const configuredBasePath = process.env.BASE_PATH?.trim();
const isFilesystemPath = configuredBasePath?.startsWith('/Program Files/Git/') ||
  /^[A-Za-z]:[\\/]/.test(configuredBasePath ?? '');
const basePath = isProduction && configuredBasePath && !isFilesystemPath
  ? configuredBasePath
  : '/';

function mockAppointmentsApiPlugin(): Plugin {
  const appointments: any[] = [];
  return {
    name: 'mock-appointments-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/appointments') {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(appointments));
            return;
          }
          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const data = JSON.parse(body);
                const apt = {
                  ...data,
                  id: data.id || `apt-${Date.now()}`,
                  createdAt: data.createdAt || new Date().toISOString(),
                };
                appointments.unshift(apt);
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(apt));
              } catch {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    mockAppointmentsApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
