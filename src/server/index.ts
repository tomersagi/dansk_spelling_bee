import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);
const host = process.env.HOST || '0.0.0.0';

// Configure LRU cache
const cache = new LRUCache({
  max: 500, // Maximum number of items to store
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // In production, static files are in the dist directory
  const clientPath = join(process.cwd(), 'dist/client');
  console.log('Looking for static files in:', clientPath);
  
  if (!existsSync(clientPath)) {
    console.error('Client path does not exist:', clientPath);
    console.log('Current directory:', process.cwd());
    console.log('Directory contents:', readdirSync(process.cwd()));
  }
  
  app.use(express.static(clientPath));
}

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/validate-word/:word', async (req, res) => {
  try {
    const { word } = req.params;
    
    // Check cache first
    const cached = cache.get(word);
    if (cached !== undefined) {
      return res.json(cached);
    }

    const response = await fetch(`https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(word)}`);
    const html = await response.text();
    
    // If the page contains "Der er ingen resultater med", the word doesn't exist
    const isInvalid = html.includes('Der er ingen resultater med');
    
    const result = {
      isValid: !isInvalid,
      message: !isInvalid ? 'Gyldig' : 'Ikke et gyldigt dansk ord'
    };

    // Cache the result
    cache.set(word, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error validating word:', error);
    res.status(500).json({
      isValid: false,
      message: 'Kunne ikke validere ordet'
    });
  }
});

// Handle React routing, return all requests to React app
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const indexPath = join(process.cwd(), 'dist/client/index.html');
    console.log('Serving index.html from:', indexPath);
    
    if (!existsSync(indexPath)) {
      console.error('index.html not found at:', indexPath);
      return res.status(404).send('Application files not found');
    }
    
    res.sendFile(indexPath);
  });
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
try {
  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Current working directory:', process.cwd());
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
} 