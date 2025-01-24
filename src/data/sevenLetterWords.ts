// List of Danish 7-letter words where all letters are different
export const sevenLetterWords = [
  'KRAFTIG', // powerful
  'SPRÆNGT', // exploded
  'KLATRES', // climb
  'SPILDTE', // spilled
  'PLANTER', // plants
  'KLISTER', // glue
  'STRØMPE', // stocking
  'KLØVEST', // split
  'SPRØJTE', // spray
  'KNALDET', // bang
  'STRIMLE', // strip
  'STÆNKER', // splash
  'KRAVLET', // crawled
  'STÆRKEN', // strong
  'KRIDTES', // chalked
  'KRINGEL', // pretzel
  'SVINGER', // swing
  'KRYDSET', // crossed
  'SVÆRMET', // swarmed
  'KLØVNER', // clown
  'KNIPSER', // snap
  'SØLVGRÅ', // silver gray
  'MARKLØV', // field leaf
  'SNØRKLE', // curl
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
    if (current.length >= 4) {
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