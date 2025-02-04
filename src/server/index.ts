import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { LRUCache } from 'lru-cache';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Configure LRU cache
const cache = new LRUCache({
  max: 500, // Maximum number of items to store
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

app.use(cors());
app.use(express.json());

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = join(__dirname, '../../client');
  app.use(express.static(clientPath));
}

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
    res.sendFile(join(__dirname, '../../client/index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 