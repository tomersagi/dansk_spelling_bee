interface ValidationResult {
  isValid: boolean;
  message?: string;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Get the base URL for API calls
const getApiUrl = () => {
  if (import.meta.env.PROD) {
    // In production, use the same host as the page
    return '';
  }
  // In development, use localhost:3001
  return 'http://localhost:3001';
};

class WordValidator {
  private cache: Map<string, { result: boolean; timestamp: number }> = new Map();

  private async checkCache(word: string): Promise<boolean | null> {
    const cached = this.cache.get(word);
    if (cached) {
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result;
      }
      this.cache.delete(word);
    }
    return null;
  }

  private async fetchFromDictionary(word: string): Promise<boolean> {
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}/api/validate-word/${encodeURIComponent(word)}`);
      const data = await response.json();
      
      // Cache the result
      this.cache.set(word, {
        result: data.isValid,
        timestamp: Date.now()
      });
      
      return data.isValid;
    } catch (error) {
      console.error('Error checking word:', error);
      throw new Error('Could not validate word');
    }
  }

  async validateWord(word: string): Promise<ValidationResult> {
    // Basic validation rules
    if (word.length < 4) {
      return { isValid: false, message: 'Ordet skal være mindst 4 bogstaver langt' };
    }

    try {
      // Check cache first
      const cachedResult = await this.checkCache(word);
      if (cachedResult !== null) {
        return {
          isValid: cachedResult,
          message: cachedResult ? 'Gyldig' : 'Ikke et gyldigt dansk ord'
        };
      }

      // If not in cache, check dictionary
      const isValid = await this.fetchFromDictionary(word);
      return {
        isValid,
        message: isValid ? 'Gyldig' : 'Ikke et gyldigt dansk ord'
      };
    } catch (error) {
      return {
        isValid: false,
        message: 'Kunne ikke validere ordet'
      };
    }
  }
}

export const wordValidator = new WordValidator(); 