interface DailyWord {
  word: string;
  date: string; // YYYY-MM-DD format
  meaning: string;
}

// List of Danish 7-letter words where all letters are different
export const sevenLetterWords: DailyWord[] = [
  { word: 'KRAFTIG', date: '2025-02-04', meaning: 'powerful' },
  { word: 'SPRÆNGT', date: '2025-02-05', meaning: 'exploded' },
  { word: 'KLATRES', date: '2025-02-06', meaning: 'climb' },
  { word: 'SPILDTE', date: '2025-02-07', meaning: 'spilled' },
  { word: 'PLANTER', date: '2025-02-08', meaning: 'plants' },
  { word: 'KLISTER', date: '2025-02-09', meaning: 'glue' },
  { word: 'STRØMPE', date: '2025-02-10', meaning: 'stocking' },
  { word: 'KLØVEST', date: '2025-02-11', meaning: 'split' },
  { word: 'SPRØJTE', date: '2025-02-12', meaning: 'spray' },
  { word: 'KNALDET', date: '2025-02-13', meaning: 'bang' },
  { word: 'STRIMLE', date: '2025-02-14', meaning: 'strip' },
  { word: 'STÆNKER', date: '2025-02-15', meaning: 'splash' },
  { word: 'KRAVLET', date: '2025-02-16', meaning: 'crawled' },
  { word: 'STÆRKEN', date: '2025-02-17', meaning: 'strong' },
  { word: 'KRIDTES', date: '2025-02-18', meaning: 'chalked' },
  { word: 'KRINGEL', date: '2025-02-19', meaning: 'pretzel' },
  { word: 'SVINGER', date: '2025-02-20', meaning: 'swing' },
  { word: 'KRYDSET', date: '2025-02-21', meaning: 'crossed' },
  { word: 'SVÆRMET', date: '2025-02-22', meaning: 'swarmed' },
  { word: 'KLØVNER', date: '2025-02-23', meaning: 'clown' },
  { word: 'KNIPSER', date: '2025-02-24', meaning: 'snap' },
  { word: 'SØLVGRÅ', date: '2025-02-25', meaning: 'silver gray' },
  { word: 'MARKLØV', date: '2025-02-26', meaning: 'field leaf' },
  { word: 'SNØRKLE', date: '2025-02-27', meaning: 'curl' },
];

// Function to check if a word has all unique letters
export const hasUniqueLetters = (word: string): boolean => {
  const uniqueLetters = new Set(word.toUpperCase());
  return uniqueLetters.size === word.length;
};

// Function to get all possible subwords from a word
export const getSubwords = (word: string): string[] => {
  const result = new Set<string>();
  const letters = word.toUpperCase().split('');
  
  // Helper function for recursive combination generation
  const generateCombinations = (current: string, remainingLetters: string[]) => {
    if (current.length > 0) {
      result.add(current);
    }
    
    for (let i = 0; i < remainingLetters.length; i++) {
      generateCombinations(
        current + remainingLetters[i],
        [...remainingLetters.slice(0, i), ...remainingLetters.slice(i + 1)]
      );
    }
  };
  
  generateCombinations('', letters);
  return Array.from(result);
}; 