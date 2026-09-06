// lib/publicId.js

export const ADJECTIVES = [
  'absurd', 'active', 'adorable', 'adventurous', 'agile', 'alert', 'alien',
  'amazing', 'ambitious', 'amused', 'ancient', 'angry', 'anxious', 'aquatic',
  'arrogant', 'ashamed', 'attractive', 'awesome', 'awful', 'awkward', 'bashful',
  'beautiful', 'bizarre', 'bland', 'blushing', 'bold', 'bored', 'brainy', 'brave',
  'breezy', 'brief', 'bright', 'broad', 'broken', 'bumpy', 'busy', 'calm',
  'careful', 'careless', 'cautious', 'charming', 'chatty', 'cheap', 'cheerful',
  'chilly', 'chubby', 'clean', 'clear', 'clever', 'cloudy', 'clumsy', 'cold',
  'colorful', 'comfortable', 'confused', 'cool', 'courageous', 'cowardly', 'cozy',
  'crabby', 'crazy', 'creamy', 'creepy', 'crooked', 'crowded', 'cruel', 'cuddly',
  'curious', 'curvy', 'cute', 'cynical', 'damaged', 'dangerous', 'dapper', 'dark',
  'dashing', 'dazzling', 'dead', 'deadly', 'deep', 'defiant', 'delicate',
  'delicious', 'delightful', 'depressed', 'deserted', 'detailed', 'determined',
  'different', 'difficult', 'diligent', 'dirty', 'disagreeable', 'disastrous',
  'discreet', 'disgusted', 'distinct', 'dizzy', 'doubtful', 'drab', 'drowsy',
  'dry', 'dull', 'dusty', 'dynamic', 'eager', 'early', 'earthy', 'easy',
  'educated', 'efficient', 'elastic', 'elated', 'elderly', 'electric', 'elegant',
  'elfin', 'elite', 'embarrassed', 'empty', 'enchanted', 'enchanting',
  'encouraging', 'energetic', 'enormous', 'entertaining', 'enthusiastic',
  'envious', 'equal', 'erratic', 'ethereal', 'evasive', 'even', 'excellent',
  'excited', 'exclusive', 'exotic', 'expensive', 'exuberant', 'fabulous', 'faded',
  'faint', 'fair', 'faithful', 'fake', 'familiar', 'famous', 'fanatical', 'fancy',
  'fantastic', 'far', 'fascinated', 'fast', 'fat', 'faulty', 'fearful',
  'fearless', 'feeble', 'festive', 'fierce', 'filthy', 'fine', 'flaky', 'flashy',
  'flat', 'flawless', 'flimsy', 'flippant', 'flowery', 'fluffy', 'foamy',
  'foolish', 'frantic', 'free', 'freezing', 'frequent', 'fresh', 'fretful',
  'friendly', 'frightened', 'frightening', 'full', 'fumbling', 'functional',
  'funny', 'furry', 'furtive', 'future', 'futuristic', 'fuzzy', 'gabby', 'gaping',
  'garrulous', 'gaudy', 'general', 'gentle', 'ghastly', 'ghostly', 'giant',
  'giddy', 'gifted', 'gigantic', 'glad', 'glamorous', 'gleaming', 'glib',
  'gloomy', 'glorious', 'glossy', 'godly', 'good', 'goofy', 'gorgeous',
  'graceful', 'grandiose', 'grateful', 'gratis', 'gray', 'greasy', 'great',
  'greedy', 'green', 'grieving', 'grim', 'grimy', 'gripping', 'grotesque',
  'grubby', 'gruesome', 'grumpy', 'guarded', 'guiltless', 'gullible', 'gusty',
  'habitual', 'half', 'hallowed', 'halting', 'handsome', 'handy', 'hanging',
  'hapless', 'happy', 'hard', 'harmonious', 'harsh', 'hateful', 'heady',
  'healthy', 'heartbreaking', 'heavenly', 'heavy', 'hellish', 'helpful',
  'hesitant', 'hideous', 'high', 'hilarious', 'hissing', 'historical', 'holistic',
  'hollow', 'homeless', 'homely', 'honorable', 'horrible', 'hospitable', 'hot',
  'huge', 'hulking', 'humdrum', 'humorous', 'hungry', 'hurried', 'hurt', 'hushed',
  'husky', 'hyper', 'hypnotic', 'hysterical', 'icky', 'icy', 'idiotic',
  'ignorant', 'ill', 'illegal', 'illustrious', 'imaginary', 'immense', 'imminent',
  'impartial', 'imperfect', 'impolite', 'important', 'imported', 'impossible',
  'incandescent', 'incompetent', 'inconclusive', 'incredible', 'industrious',
  'inexpensive', 'infamous', 'innate', 'innocent', 'inquisitive', 'insidious',
  'instinctive', 'intelligent', 'interesting', 'internal', 'invincible', 'irate',
  'irritating', 'itchy', 'jaded', 'jagged', 'jazzy', 'jealous', 'jittery',
  'jobless', 'jolly', 'jovial', 'joyous', 'judicious', 'juicy', 'jumbled',
  'jumpy', 'kaput', 'keen', 'kind', 'knotty', 'knowing', 'knowledgeable', 'known',
  'labored', 'lackadaisical', 'lacking', 'lame', 'lamentable', 'languid', 'large',
  'last', 'late', 'laughable', 'lavish', 'lazy', 'lean', 'learned', 'left',
  'legal', 'lethal', 'level', 'lewd', 'light', 'like', 'likeable', 'limping',
  'literate', 'little', 'lively', 'livid', 'loathsome', 'lone', 'lonely', 'long',
  'longface', 'loose', 'lopsided', 'loud', 'loutish', 'lovely', 'loving', 'low',
  'lowly', 'lucky', 'ludicrous', 'lumpy', 'lush', 'luxuriant', 'lying', 'lyrical',
  'macabre', 'macho', 'maddening', 'madly', 'magenta', 'magic', 'magical',
  'magnificent', 'majestic', 'makeup', 'male', 'malicious', 'mammoth', 'maniacal',
  'many', 'marked', 'married', 'marvelous', 'massive', 'material',
  'materialistic', 'mature', 'mean', 'measly', 'meaty', 'medical', 'mediocre',
  'medium', 'meek', 'mellow', 'melodic', 'melted', 'merciful', 'mere', 'merry',
  'messy', 'mighty', 'military', 'milky', 'mindless', 'miniature', 'minor',
  'miscreant', 'misty', 'mixed', 'moaning', 'modern', 'moldy', 'momentous',
  'motionless', 'mountainous', 'muddled', 'muddy', 'mundane', 'murky', 'mushy',
  'mute', 'mysterious', 'naive', 'nappy', 'narrow', 'nasty', 'natural', 'naughty',
  'nauseating', 'near', 'neat', 'nebulous', 'necessary', 'needless', 'needy',
  'neighborly', 'nervous', 'new', 'next', 'nice', 'nifty', 'nimble', 'nine',
  'nippy', 'nodding', 'noisy', 'nonchalant', 'nondescript', 'nonstop', 'normal',
  'nostalgic', 'nosy', 'noxious', 'null', 'numberless', 'numerous', 'nutritious',
  'nutty', 'oafish', 'obedient', 'obeisant', 'obese', 'obnoxious', 'obscene',
  'obsequious', 'observant', 'obsolete', 'obtainable', 'oceanic', 'odd',
  'offbeat', 'old', 'omniscient', 'one', 'onerous', 'open', 'opposite', 'optimal',
  'orange', 'ordinary', 'organic', 'ossified', 'outgoing', 'outrageous',
  'outstanding', 'oval', 'overconfident', 'overjoyed', 'overrated', 'overt',
  'overwrought', 'painful', 'painstaking', 'pale', 'paltry', 'panicky',
  'panoramic', 'parallel', 'parched', 'parsimonious', 'past', 'pastoral',
  'pathetic', 'peaceful', 'penitent', 'perfect', 'periodic', 'permissible',
  'perpetual', 'petite', 'phobic', 'physical', 'picayune', 'pink', 'piquant',
  'placid', 'plain', 'plant', 'plastic', 'plausible', 'pleasant', 'plucky',
  'pointless', 'poised', 'polite', 'political', 'poor', 'possessive', 'possible',
  'powerful', 'precious', 'premium', 'present', 'pretty', 'previous', 'pricey',
  'prickly', 'private', 'probable', 'productive', 'profuse', 'protective',
  'proud', 'psychedelic', 'psychotic', 'public', 'puffy', 'pumped', 'puny',
  'purple', 'purring', 'pushy', 'puzzled', 'puzzling', 'quack', 'quaint',
  'quarrelsome', 'questionable', 'quick', 'quickest', 'quiet', 'quirky',
  'quixotic', 'quizzical', 'rabid', 'racial', 'ragged', 'rainy', 'rambunctious',
  'rampant', 'rapid', 'rare', 'raspy', 'ratty', 'ready', 'real', 'rebel',
  'receptive', 'recondite', 'red', 'redundant', 'reflective', 'regular',
  'relieved', 'remarkable', 'reminiscent', 'repulsive', 'resolute', 'resonant',
  'responsible', 'rhetorical', 'rich', 'right', 'righteous', 'rightful', 'rigid',
  'ripe', 'ritzy', 'roasted', 'robust', 'romantic', 'roomy', 'rotten', 'rough',
  'round', 'royal', 'ruddy', 'rude', 'rural', 'rustic', 'ruthless', 'sable',
  'sad', 'safe', 'salty', 'same', 'sassy', 'satisfying', 'savory', 'scandalous',
  'scarce', 'scared', 'scary', 'scattered', 'scientific', 'scintillating',
  'scrawny', 'screeching', 'second', 'secret', 'secretive', 'sedate', 'seemly',
  'selective', 'selfish', 'separate', 'serious', 'shaggy', 'shaky', 'shallow',
  'sharp', 'shiny', 'shivering', 'shocking', 'short', 'shrill', 'shut', 'shy',
  'sick', 'silent', 'silky', 'silly', 'simple', 'simplistic', 'sincere', 'six',
  'skillful', 'skinny', 'sleepy', 'slim', 'slimy', 'slippery', 'sloppy', 'slow',
  'small', 'smart', 'smelly', 'smiling', 'smoggy', 'smooth', 'sneaky', 'snobbish',
  'snotty', 'soft', 'soggy', 'solid', 'somber', 'sophisticated', 'sordid', 'sore',
  'sour', 'sparkling', 'sparkly', 'special', 'spectacular', 'spicy', 'spiffy',
  'spiky', 'spiritual', 'spiteful', 'splendid', 'spooky', 'spotless', 'spotted',
  'spotty', 'spurious', 'squalid', 'square', 'squealing', 'squeamish', 'staking',
  'stale', 'standing', 'statuesque', 'steadfast', 'steady', 'steep',
  'stereotyped', 'sticky', 'stiff', 'stimulating', 'stingy', 'stormy', 'straight',
  'strange', 'striped', 'strong', 'stubborn', 'stupendous', 'stupid', 'sturdy',
  'subdued', 'subsequent', 'substantial', 'successful', 'succinct', 'sudden',
  'sulky', 'super', 'superb', 'superficial', 'supreme', 'swanky', 'sweet',
  'sweltering', 'swift', 'symptomatic', 'synonymous', 'taboo', 'tacit', 'tacky',
  'talented', 'tall', 'tame', 'tan', 'tangible', 'tangy', 'tart', 'tasteful',
  'tasteless', 'tasty', 'tawdry', 'tearful', 'tedious', 'teeny', 'telling',
  'temporary', 'ten', 'tender', 'tense', 'tenuous', 'terrible', 'terrific',
  'tested', 'testy', 'thankful', 'therapeutic', 'thick', 'thin', 'thinkable',
  'third', 'thirsty', 'thoughtful', 'thoughtless', 'threatening', 'three',
  'thundering', 'tidy', 'tight', 'tightfisted', 'tiny', 'tired', 'tiresome',
  'toothsome', 'torpid', 'tough', 'towering', 'tranquil', 'trashy', 'tremendous',
  'tricky', 'trite', 'troubled', 'truculent', 'true', 'truthful', 'two',
  'typical', 'ubiquitous', 'ugliest', 'ugly', 'ultra', 'unable', 'unaccountable',
  'unadvised', 'unarmed', 'unbecoming', 'unbiased', 'uncovered', 'understood',
  'undesirable', 'unequal', 'unequaled', 'uneven', 'unhealthy', 'uninterested',
  'unique', 'unkempt', 'unknown', 'unnatural', 'unruly', 'unsightly',
  'unsuitable', 'untidy', 'unused', 'unusual', 'unwieldy', 'unwritten', 'upbeat',
  'uppity', 'upset', 'uptight', 'used', 'useful', 'useless', 'utopian', 'utter',
  'uttermost', 'vacuous', 'vagabond', 'vague', 'valuable', 'various', 'vast',
  'vengeful', 'venomous', 'verdant', 'versed', 'victorious', 'vigorous',
  'violent', 'violet', 'vivacious', 'voiceless', 'volatile', 'voracious',
  'vulgar', 'wacky', 'waggish', 'waiting', 'wakeful', 'wandering', 'wanting',
  'warlike', 'warm', 'wary', 'wasteful', 'watery', 'weak', 'wealthy', 'weary',
  'wet', 'whimsical', 'whispering', 'white', 'whole', 'wholesale', 'wicked',
  'wide', 'wiggly', 'wild', 'willing', 'windy', 'wiry', 'wise', 'wistful',
  'witty', 'wobbly', 'woebegone', 'womanly', 'wonderful', 'wooden', 'woozy',
  'workable', 'worried', 'worthless', 'wrathful', 'wretched', 'wrong', 'wry',
  'yellow', 'yielding', 'young', 'youthful', 'yummy', 'zany', 'zealous', 'zesty',
  'zippy', 'zonked'
];

export const NOUNS = [
  'acorn', 'albatross', 'alien', 'alligator', 'almond', 'alpaca', 'anchovy',
  'anemone', 'ant', 'antelope', 'apple', 'armadillo', 'artichoke', 'asparagus',
  'aster', 'avocado', 'baboon', 'bacon', 'badger', 'bagel', 'balloon', 'bamboo',
  'banana', 'bandicoot', 'barley', 'basil', 'bat', 'beagle', 'bean', 'bear',
  'beaver', 'bee', 'beetle', 'begonia', 'bell', 'berry', 'bird', 'bison',
  'blackberry', 'blueberry', 'bluebird', 'boar', 'bobcat', 'bonsai', 'book',
  'bottle', 'bowl', 'bread', 'broccoli', 'bucket', 'buffalo', 'bug', 'bulb',
  'bullfrog', 'bunny', 'burger', 'burrito', 'butter', 'butterfly', 'button',
  'cabbage', 'cacao', 'cactus', 'cake', 'camel', 'camera', 'candy', 'caribou',
  'carp', 'carpet', 'carrot', 'cart', 'cashew', 'cassowary', 'castle', 'cat',
  'caterpillar', 'celery', 'cereal', 'chair', 'chameleon', 'cheese', 'cheetah',
  'cherry', 'chestnut', 'chicken', 'chili', 'chimpanzee', 'chip', 'chipmunk',
  'chive', 'chocolate', 'churros', 'cicada', 'cinnamon', 'clam', 'clock', 'cloud',
  'clover', 'clownfish', 'coal', 'coconut', 'cod', 'coffee', 'coin', 'condor',
  'cookie', 'coriander', 'corn', 'cotton', 'cow', 'coyote', 'crab', 'crane',
  'crocodile', 'crow', 'cucumber', 'cup', 'cupcake', 'daffodil', 'daisy',
  'dandelion', 'deer', 'desk', 'dingo', 'dinosaur', 'dog', 'dolphin', 'donkey',
  'donut', 'dove', 'dragon', 'dragonfly', 'duck', 'dumpling', 'eagle', 'ear',
  'echidna', 'eel', 'egg', 'eggplant', 'elephant', 'elf', 'elk', 'emu', 'engine',
  'envelope', 'ermine', 'fairy', 'falcon', 'feather', 'ferret', 'fig', 'finch',
  'fish', 'flamingo', 'flower', 'flute', 'fly', 'foal', 'fork', 'fox', 'frog',
  'garlic', 'gazelle', 'gecko', 'gerbil', 'ghost', 'giraffe', 'glass', 'glove',
  'goat', 'goblin', 'goldfish', 'goose', 'gorilla', 'grape', 'grapefruit',
  'grasshopper', 'grizzly', 'guitar', 'gull', 'hamster', 'hare', 'hawk',
  'hedgehog', 'heron', 'hippo', 'honey', 'hook', 'hornet', 'horse', 'hotdog',
  'hound', 'hyena', 'icecream', 'iguana', 'impala', 'jackal', 'jaguar', 'jelly',
  'jellyfish', 'kangaroo', 'ketchup', 'key', 'kite', 'kitten', 'kiwi', 'koala',
  'koi', 'lamp', 'lantern', 'lark', 'leaf', 'leek', 'lemon', 'lemur', 'leopard',
  'lettuce', 'light', 'lion', 'lizard', 'llama', 'lobster', 'lock', 'locust',
  'lotus', 'lynx', 'macaw', 'magnet', 'magpie', 'mallard', 'mango', 'map',
  'marmot', 'marshmallow', 'mastodon', 'match', 'meadowlark', 'meatball',
  'meerkat', 'melon', 'microphone', 'milk', 'mink', 'mint', 'mirror', 'mongoose',
  'monkey', 'monster', 'moose', 'moth', 'mouse', 'muffin', 'mule', 'mushroom',
  'mustard', 'napkin', 'needle', 'newt', 'noodle', 'noodles', 'nutmeg', 'oak',
  'oat', 'octopus', 'olive', 'onion', 'orange', 'orc', 'orchid', 'ostrich',
  'otter', 'owl', 'oyster', 'pagoda', 'panda', 'panther', 'papaya', 'paper',
  'parrot', 'parsley', 'parsnip', 'partridge', 'pasta', 'pea', 'peach', 'peacock',
  'peanut', 'pear', 'pecan', 'pelican', 'pencil', 'penguin', 'peony', 'pepper',
  'pheasant', 'phone', 'piano', 'pickle', 'pie', 'pig', 'pigeon', 'pine',
  'pineapple', 'pistachio', 'pizza', 'planet', 'plant', 'plate', 'platypus',
  'plum', 'pomegranate', 'pony', 'popcorn', 'porcupine', 'possum', 'potato',
  'prawn', 'pretzel', 'puffin', 'pug', 'puma', 'pumpkin', 'puppy', 'quail',
  'quartz', 'quill', 'quokka', 'rabbit', 'raccoon', 'radish', 'ram', 'raspberry',
  'rat', 'raven', 'reindeer', 'rhino', 'rice', 'ring', 'robin', 'robot', 'rock',
  'rocket', 'rooster', 'root', 'rose', 'rosemary', 'ruby', 'salad', 'salmon',
  'salsa', 'salt', 'sandwich', 'sapphire', 'sardine', 'sausage', 'scarf',
  'scissors', 'scorpion', 'seal', 'seed', 'shark', 'sheep', 'shoe', 'shrimp',
  'skunk', 'sloth', 'slug', 'snail', 'snake', 'snow', 'soap', 'sock', 'soup',
  'soybean', 'sparrow', 'spider', 'spinach', 'sponge', 'spoon', 'squid',
  'squirrel', 'star', 'starfish', 'steak', 'stone', 'stork', 'strawberry',
  'sugar', 'sunflower', 'sushi', 'swallow', 'swan', 'sweetpotato', 'sword',
  'syrup', 'taco', 'tangerine', 'tapir', 'teapot', 'tent', 'tiger', 'toad',
  'toast', 'toaster', 'tomato', 'tortoise', 'toucan', 'towel', 'tractor', 'train',
  'tree', 'trout', 'truffle', 'tulip', 'turkey', 'turnip', 'turtle', 'umbrella',
  'unicorn', 'vampire', 'vanilla', 'vase', 'vine', 'violin', 'vulture', 'waffle',
  'walnut', 'walrus', 'wasp', 'watch', 'water', 'watermelon', 'weasel', 'whale',
  'wheat', 'wheel', 'whistle', 'window', 'wizard', 'wolf', 'wombat', 'wood',
  'woodpecker', 'worm', 'yak', 'yam', 'yogurt', 'zebra', 'zombie', 'zucchini'
];

export const PREPOSITIONS = [
  'aboard', 'about', 'above', 'across', 'after', 'against', 'along', 'alongside',
  'amid', 'amidst', 'among', 'amongst', 'around', 'as', 'astride', 'at', 'atop',
  'before', 'behind', 'below', 'beneath', 'beside', 'besides', 'between',
  'beyond', 'by', 'concerning', 'considering', 'despite', 'down', 'during',
  'except', 'excluding', 'following', 'for', 'from', 'in', 'inside', 'into',
  'like', 'near', 'of', 'off', 'on', 'onto', 'opposite', 'out', 'outside', 'over',
  'past', 'per', 'plus', 'regarding', 'round', 'save', 'since', 'than', 'through',
  'throughout', 'till', 'to', 'toward', 'towards', 'under', 'underneath',
  'unlike', 'until', 'up', 'upon', 'versus', 'via', 'with', 'within', 'without'
];

export const PLACES = [
  'abyss', 'airport', 'alley', 'aquarium', 'arcade', 'arena', 'asylum', 'attic',
  'avenue', 'bakery', 'balcony', 'bank', 'barn', 'barracks', 'base', 'basement',
  'bay', 'beach', 'bistro', 'bluff', 'boardwalk', 'bog', 'bookstore', 'boutique',
  'bridge', 'brook', 'bunker', 'bushes', 'cabin', 'cafe', 'camp', 'campus',
  'canal', 'canopy', 'canyon', 'capital', 'carnival', 'casino', 'castle', 'cave',
  'cavern', 'cellar', 'cemetery', 'chalet', 'chapel', 'church', 'cinema',
  'circus', 'city', 'cliff', 'clinic', 'closet', 'cloud', 'club', 'coast',
  'college', 'colosseum', 'comet', 'compound', 'continent', 'corner', 'cottage',
  'country', 'county', 'court', 'courtyard', 'cove', 'crater', 'creek',
  'crossroads', 'crypt', 'deck', 'delta', 'desert', 'diner', 'dock', 'docks',
  'dome', 'dorm', 'dungeon', 'earth', 'edge', 'elevator', 'embassy', 'empire',
  'equator', 'estate', 'estuary', 'factory', 'fair', 'farm', 'field', 'fjord',
  'forest', 'forge', 'fort', 'fortress', 'forum', 'freeway', 'frontier', 'galaxy',
  'gallery', 'garage', 'garden', 'garrison', 'gate', 'glacier', 'glade', 'glen',
  'gorge', 'graveyard', 'greenhouse', 'grotto', 'grove', 'gym', 'hall', 'hallway',
  'hamlet', 'harbor', 'haven', 'headquarters', 'heaven', 'hell', 'hideout',
  'highway', 'hill', 'hospital', 'hostel', 'hotel', 'house', 'hub', 'hut',
  'iceberg', 'inn', 'island', 'isle', 'jail', 'jungle', 'keep', 'lab',
  'labyrinth', 'lagoon', 'lake', 'lane', 'library', 'lighthouse', 'livingroom',
  'lobby', 'lodge', 'loft', 'lounge', 'mall', 'manor', 'mansion', 'market',
  'mars', 'marsh', 'maze', 'meadow', 'mesa', 'meteor', 'metropolis', 'mine',
  'monastery', 'moon', 'mosque', 'motel', 'mountain', 'museum', 'nest', 'nexus',
  'nursery', 'oasis', 'observatory', 'ocean', 'office', 'orbit', 'orchard',
  'outpost', 'palace', 'pantheon', 'park', 'parlor', 'pass', 'path', 'patio',
  'pavilion', 'peak', 'peninsula', 'pharmacy', 'pier', 'pit', 'pizzeria',
  'plains', 'planet', 'planetarium', 'plateau', 'plaza', 'pond', 'pool', 'port',
  'portal', 'post', 'prairie', 'prison', 'pub', 'pyramid', 'quarry', 'ranch',
  'ravine', 'reef', 'resort', 'restaurant', 'ridge', 'rift', 'river', 'road',
  'roof', 'room', 'ruins', 'safari', 'saloon', 'sanctuary', 'savanna', 'school',
  'sea', 'sewer', 'shack', 'shed', 'ship', 'shire', 'shop', 'shore', 'shrine',
  'sky', 'skyscraper', 'slum', 'space', 'spire', 'spring', 'square', 'stadium',
  'stage', 'star', 'station', 'steppe', 'store', 'stream', 'street', 'studio',
  'submarine', 'subway', 'summit', 'sun', 'swamp', 'tavern', 'temple', 'tent',
  'terrace', 'theater', 'tomb', 'tower', 'town', 'train', 'trench', 'tundra',
  'tunnel', 'universe', 'university', 'valley', 'vault', 'villa', 'village',
  'void', 'volcano', 'warehouse', 'wasteland', 'waterfall', 'woods', 'workshop',
  'yard', 'zone'
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
