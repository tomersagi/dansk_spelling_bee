import { sevenLetterWords, hasUniqueLetters } from '../data/sevenLetterWords';

export interface Puzzle {
  centerLetter: string;
  outerLetters: string[];
  originalWord: string;
}

class PuzzleGenerator {
  private async validateWord(word: string): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:3001/api/validate-word/${encodeURIComponent(word)}`);
      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error('Error validating word:', error);
      return false;
    }
  }

  private async getValidRandomWord(): Promise<string> {
    // Filter words to ensure they have exactly 7 unique letters
    const validWords = sevenLetterWords.filter(word => {
      const uniqueLetters = new Set(word.split(''));
      return uniqueLetters.size === 7;
    });

    if (validWords.length === 0) {
      throw new Error('No valid words found with 7 unique letters');
    }

    // Try words randomly until we find one that's valid in the dictionary
    const shuffledWords = this.shuffleArray(validWords);
    for (const word of shuffledWords) {
      if (await this.validateWord(word)) {
        return word;
      }
    }

    throw new Error('No valid pangrams found in the dictionary');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async generatePuzzle(): Promise<Puzzle> {
    const word = await this.getValidRandomWord();
    const letters = word.split('');
    
    // Randomly select center letter
    const centerIndex = Math.floor(Math.random() * letters.length);
    const centerLetter = letters[centerIndex];
    
    // Remove center letter and shuffle remaining letters
    letters.splice(centerIndex, 1);
    const outerLetters = this.shuffleArray(letters);

    return {
      centerLetter,
      outerLetters,
      originalWord: word
    };
  }

  // Generate puzzle for a specific date (same puzzle for everyone on the same day)
  async generateDailyPuzzle(date: Date = new Date()): Promise<Puzzle> {
    // Use the date to seed the random selection
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dateHash = Array.from(dateString).reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    // Filter words to ensure they have exactly 7 unique letters
    const validWords = sevenLetterWords.filter(word => {
      const uniqueLetters = new Set(word.split(''));
      return uniqueLetters.size === 7;
    });

    if (validWords.length === 0) {
      throw new Error('No valid words found with 7 unique letters');
    }

    // Try words in a deterministic order based on the date until we find a valid one
    const shuffledWords = this.shuffleArray(validWords);
    let validWord = null;
    
    for (let i = 0; i < shuffledWords.length; i++) {
      const wordIndex = (dateHash + i) % shuffledWords.length;
      const word = shuffledWords[wordIndex];
      if (await this.validateWord(word)) {
        validWord = word;
        break;
      }
    }

    if (!validWord) {
      throw new Error('No valid pangrams found in the dictionary');
    }

    const letters = validWord.split('');
    // Use the hash to select center letter
    const centerIndex = dateHash % letters.length;
    const centerLetter = letters[centerIndex];

    // Remove center letter and arrange remaining letters
    letters.splice(centerIndex, 1);
    const outerLetters = this.shuffleArray(letters);

    return {
      centerLetter,
      outerLetters,
      originalWord: validWord
    };
  }

  // Validate if a word can be made from the puzzle letters
  isValidPuzzleWord(puzzle: Puzzle, word: string): boolean {
    const puzzleLetters = [...puzzle.outerLetters, puzzle.centerLetter];
    const wordLetters = word.toUpperCase().split('');

    // Check if word contains center letter
    if (!wordLetters.includes(puzzle.centerLetter)) {
      return false;
    }

    // Check if all letters in word are available in puzzle
    return wordLetters.every(letter => puzzleLetters.includes(letter));
  }
}

export const puzzleGenerator = new PuzzleGenerator(); 