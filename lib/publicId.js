// lib/publicId.js

export const ADJECTIVES = [
  'angry', 'anxious', 'awkward', 'bold', 'brave', 'bright', 'bumpy', 'calm',
  'chatty', 'cheerful', 'chilly', 'clumsy', 'cozy', 'crazy', 'creepy', 'cuddly',
  'curious', 'cute', 'dizzy', 'drowsy', 'eager', 'elegant', 'excited', 'fancy',
  'fierce', 'fluffy', 'friendly', 'funny', 'gentle', 'giant', 'glad', 'gloomy',
  'goofy', 'grumpy', 'happy', 'heavy', 'helpful', 'hungry', 'hyper', 'jolly',
  'jumpy', 'kind', 'lazy', 'little', 'lively', 'lonely', 'longface', 'loud',
  'lucky', 'magic', 'merry', 'mighty', 'muddy', 'nervous', 'noisy', 'polite',
  'proud', 'quiet', 'quirky', 'round', 'sad', 'scary', 'shiny', 'shy',
  'silly', 'sleepy', 'slow', 'smart', 'smooth', 'sneaky', 'soft', 'sparkly',
  'spicy', 'spooky', 'stubborn', 'sweet', 'swift', 'tall', 'tasty', 'tiny',
  'tired', 'tough', 'tricky', 'warm', 'wild', 'wobbly', 'zany'
];

export const NOUNS = [
  'alien', 'alpaca', 'ant', 'apple', 'avocado', 'bacon', 'badger', 'balloon',
  'banana', 'bat', 'bear', 'beaver', 'bee', 'berry', 'bird', 'bread',
  'bug', 'bunny', 'burger', 'butterfly', 'cabbage', 'cactus', 'cake', 'camel',
  'candy', 'carrot', 'cat', 'cereal', 'cheese', 'cherry', 'chicken', 'chip',
  'cloud', 'coffee', 'cookie', 'corn', 'cow', 'crab', 'deer', 'dinosaur',
  'dog', 'dolphin', 'donut', 'dragon', 'duck', 'eagle', 'egg', 'elephant',
  'elf', 'fairy', 'falcon', 'fish', 'flower', 'fox', 'frog', 'ghost',
  'giraffe', 'goblin', 'goose', 'grape', 'hamster', 'hippo', 'honey', 'horse',
  'hotdog', 'icecream', 'iguana', 'jelly', 'kangaroo', 'kiwi', 'koala', 'leaf',
  'lemon', 'leopard', 'lion', 'lizard', 'llama', 'mango', 'melon', 'monkey',
  'monster', 'moose', 'mouse', 'muffin', 'mushroom', 'noodle', 'octopus', 'onion',
  'orc', 'otter', 'owl', 'panda', 'panther', 'parrot', 'peach', 'peanut',
  'pear', 'penguin', 'pie', 'pig', 'pigeon', 'pizza', 'plant', 'plum',
  'pony', 'potato', 'pumpkin', 'rabbit', 'raccoon', 'raven', 'rhino', 'rice',
  'robot', 'rock', 'salad', 'salmon', 'seal', 'shark', 'sheep', 'shrimp',
  'sloth', 'snail', 'snake', 'spider', 'sponge', 'squid', 'squirrel', 'star',
  'stone', 'strawberry', 'sushi', 'taco', 'tiger', 'toast', 'toaster', 'tomato',
  'tree', 'turtle', 'unicorn', 'vampire', 'waffle', 'walrus', 'watermelon', 'whale',
  'wizard', 'wolf', 'worm', 'zebra', 'zombie'
];

export const PREPOSITIONS = [
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'at',
  'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'by', 'down',
  'from', 'in', 'inside', 'into', 'near', 'off', 'on', 'onto', 'out',
  'outside', 'over', 'past', 'through', 'to', 'toward', 'under', 'underneath', 'until',
  'up', 'upon', 'with', 'within', 'without'
];

export const PLACES = [
  'abyss', 'airport', 'alley', 'arcade', 'attic', 'bakery', 'bank', 'barn',
  'basement', 'beach', 'bridge', 'bunker', 'cabin', 'cafe', 'camp', 'canyon',
  'castle', 'cave', 'cellar', 'church', 'cinema', 'city', 'cliff', 'clinic',
  'closet', 'cloud', 'coast', 'college', 'comet', 'country', 'court', 'crater',
  'creek', 'desert', 'diner', 'dungeon', 'earth', 'factory', 'farm', 'field',
  'forest', 'forge', 'fort', 'galaxy', 'garage', 'garden', 'glacier', 'grove',
  'gym', 'hall', 'harbor', 'heaven', 'hell', 'hospital', 'hotel', 'house',
  'hut', 'island', 'jungle', 'lab', 'lake', 'library', 'lobby', 'mall',
  'mansion', 'market', 'mars', 'maze', 'meadow', 'meteor', 'mine', 'moon',
  'motel', 'mountain', 'museum', 'nest', 'ocean', 'office', 'orbit', 'palace',
  'park', 'path', 'plains', 'planet', 'plaza', 'pond', 'pool', 'prison',
  'pub', 'pyramid', 'restaurant', 'river', 'road', 'roof', 'room', 'ruins',
  'saloon', 'school', 'sea', 'sewer', 'ship', 'shop', 'sky', 'space',
  'stadium', 'star', 'station', 'store', 'street', 'studio', 'subway', 'sun',
  'swamp', 'tavern', 'temple', 'tent', 'theater', 'tomb', 'town', 'train',
  'tundra', 'tunnel', 'universe', 'valley', 'village', 'volcano', 'woods', 'yard'
];

export const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Returns a cryptographically secure random number between 0 and max-1.
 * @param {number} max
 */
function secureRandomIndex(max) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  // Fallback for Node.js environments (like Jest) if crypto isn't globally available in the exact same way.
  // We use Math.random() as fallback but in a real extension crypto is always available.
  return Math.floor(Math.random() * max);
}

function getRandomElement(arr) {
  return arr[secureRandomIndex(arr.length)];
}

export function generateCrockfordSuffix(length = 5) {
  let suffix = '';
  for (let i = 0; i < length; i++) {
    suffix += getRandomElement(CROCKFORD_BASE32);
  }
  return suffix;
}

export function generatePublicId() {
  const adjective = getRandomElement(ADJECTIVES);
  const noun = getRandomElement(NOUNS);
  const preposition = getRandomElement(PREPOSITIONS);
  const place = getRandomElement(PLACES);
  const suffix = generateCrockfordSuffix(5);
  
  const publicId = `@${adjective}-${noun}-${preposition}-${place}-${suffix}`;
  
  if (!isValidPublicId(publicId)) {
    throw new Error('Generated an invalid public ID somehow');
  }
  
  return publicId;
}

export function isValidPublicId(publicId) {
  if (typeof publicId !== 'string') return false;
  
  const regex = /^@([a-z]+)-([a-z]+)-([a-z]+)-([a-z]+)-([0-9A-HJKMNPQRSTVWXYZ]{5})$/;
  const match = publicId.match(regex);
  if (!match) return false;
  
  const [, adjective, noun, preposition, place, suffix] = match;
  
  if (!ADJECTIVES.includes(adjective)) return false;
  if (!NOUNS.includes(noun)) return false;
  if (!PREPOSITIONS.includes(preposition)) return false;
  if (!PLACES.includes(place)) return false;
  
  if (/[ILOU]/.test(suffix)) return false;
  
  return true;
}
