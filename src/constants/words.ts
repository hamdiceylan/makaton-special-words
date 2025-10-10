export interface Word {
  image: string;
  imageUpdated: boolean;
  sound: string;
  soundUpdated: boolean;
  text: string;
  textUpdated: boolean;
}

// Word images mapping - centralized image constants
export const WORD_IMAGES: { [key: string]: any } = {
  'ball': require('../../assets/images/words/ball.jpg'),
  'book': require('../../assets/images/words/book.jpg'),
  'dolly': require('../../assets/images/words/dolly.jpg'),
  'car': require('../../assets/images/words/car.jpg'),
  'bird': require('../../assets/images/words/bird.jpg'),
  'dog': require('../../assets/images/words/dog.jpg'),
  'cat': require('../../assets/images/words/cat.jpg'),
  'fish': require('../../assets/images/words/fish.jpg'),
  'flower': require('../../assets/images/words/flower.jpg'),
  'keys': require('../../assets/images/words/keys.jpg'),
  'cup': require('../../assets/images/words/cup.jpg'),
  'brush': require('../../assets/images/words/brush.jpg'),
  'coat': require('../../assets/images/words/coat.jpg'),
  'shoes': require('../../assets/images/words/shoes.jpg'),
  'hat': require('../../assets/images/words/hat.jpg'),
  'socks': require('../../assets/images/words/socks.jpg'),
  'duck': require('../../assets/images/words/duck.jpg'),
  'pig': require('../../assets/images/words/pig.jpg'),
  'sheep': require('../../assets/images/words/sheep.jpg'),
  'cow': require('../../assets/images/words/cow.jpg'),
  'apple': require('../../assets/images/words/apple.jpg'),
  'banana': require('../../assets/images/words/banana.jpg'),
  'biscuit': require('../../assets/images/words/biscuit.jpg'),
  'drink': require('../../assets/images/words/drink.jpg'),
  'bed': require('../../assets/images/words/bed.jpg'),
  'chair': require('../../assets/images/words/chair.jpg'),
  'table': require('../../assets/images/words/table.jpg'),
  'bath': require('../../assets/images/words/bath.jpg'),
  'eyes': require('../../assets/images/words/eyes.jpg'),
  'mouth': require('../../assets/images/words/mouth.jpg'),
  'hair': require('../../assets/images/words/hair.jpg'),
  'nose': require('../../assets/images/words/nose.jpg'),
  'spoon': require('../../assets/images/words/spoon.jpg'),
  'bag': require('../../assets/images/words/bag.jpg'),
  'phone': require('../../assets/images/words/phone.jpg'),
  'bricks': require('../../assets/images/words/bricks.jpg'),
  'eating': require('../../assets/images/words/eating.jpg'),
  'sleeping': require('../../assets/images/words/sleeping.jpg'),
  'drinking': require('../../assets/images/words/drinking.jpg'),
  'brushing': require('../../assets/images/words/brushing.jpg'),
  'sitting': require('../../assets/images/words/sitting.jpg'),
  'washing': require('../../assets/images/words/washing.jpg'),
  'walking': require('../../assets/images/words/walking.jpg'),
  'crying': require('../../assets/images/words/crying.jpg'),
  'television': require('../../assets/images/words/television.jpg'),
  'light': require('../../assets/images/words/light.jpg'),
  'balloon': require('../../assets/images/words/balloon.jpg'),
  'box': require('../../assets/images/words/box.jpg'),
  'bubbles': require('../../assets/images/words/bubbles.jpg'),
  'big': require('../../assets/images/words/big.jpg'),
  'splashing': require('../../assets/images/words/splashing.jpg'),
  'little': require('../../assets/images/words/little.jpg'),
  'garden': require('../../assets/images/words/garden.jpg'),
  'star': require('../../assets/images/words/star.jpg'),
  'house': require('../../assets/images/words/house.jpg'),
  'tree': require('../../assets/images/words/tree.jpg'),
  'jumping': require('../../assets/images/words/jumping.jpg'),
  'playing': require('../../assets/images/words/playing.jpg'),
  'running': require('../../assets/images/words/running.jpg'),
  'kissing': require('../../assets/images/words/kissing.jpg'),
  'clapping': require('../../assets/images/words/clapping.jpg'),
  'reading': require('../../assets/images/words/reading.jpg'),
  'cutting': require('../../assets/images/words/cutting.jpg'),
  'throwing': require('../../assets/images/words/throwing.jpg'),
  'towel': require('../../assets/images/words/towel.jpg'),
  'soap': require('../../assets/images/words/soap.jpg'),
  'toothbrush': require('../../assets/images/words/toothbrush.jpg'),
  'teeth': require('../../assets/images/words/teeth.jpg'),
  'bread': require('../../assets/images/words/bread.jpg'),
  'dinner': require('../../assets/images/words/dinner.jpg'),
  'juice': require('../../assets/images/words/juice.jpg'),
  'yogurt': require('../../assets/images/words/yogurt.jpg'),
  'chicken': require('../../assets/images/words/chicken.jpg'),
  'monkey': require('../../assets/images/words/monkey.jpg'),
  'rabbit': require('../../assets/images/words/rabbit.jpg'),
  'horse': require('../../assets/images/words/horse.jpg'),
  'dress': require('../../assets/images/words/dress.jpg'),
  'jumper': require('../../assets/images/words/jumper.jpg'),
  'boots': require('../../assets/images/words/boots.jpg'),
  'trousers': require('../../assets/images/words/trousers.jpg'),
  'foot': require('../../assets/images/words/foot.jpg'),
  'tummy': require('../../assets/images/words/tummy.jpg'),
  'hand': require('../../assets/images/words/hand.jpg'),
  'ear': require('../../assets/images/words/ear.jpg'),
  'up': require('../../assets/images/words/up.jpg'),
  'down': require('../../assets/images/words/down.jpg'),
  'swing': require('../../assets/images/words/swing.jpg'),
  'bike': require('../../assets/images/words/bike.jpg'),
  'boat': require('../../assets/images/words/boat.jpg'),
  'bus': require('../../assets/images/words/bus.jpg'),
  'aeroplane': require('../../assets/images/words/aeroplane.jpg'),
  'train': require('../../assets/images/words/train.jpg'),
  'wet': require('../../assets/images/words/wet.jpg'),
  'dirty': require('../../assets/images/words/dirty.jpg'),
  'hot': require('../../assets/images/words/hot.jpg'),
  'cold': require('../../assets/images/words/cold.jpg'),
};

// Word images mapping - centralized image constants
export const WORD_THUMBNAIL_IMAGES: { [key: string]: any } = {
  'ball': require('../../assets/images/words/ball-thumbnail.jpg'),
  'book': require('../../assets/images/words/book-thumbnail.jpg'),
  'dolly': require('../../assets/images/words/dolly-thumbnail.jpg'),
  'car': require('../../assets/images/words/car-thumbnail.jpg'),
  'bird': require('../../assets/images/words/bird-thumbnail.jpg'),
  'dog': require('../../assets/images/words/dog-thumbnail.jpg'),
  'cat': require('../../assets/images/words/cat-thumbnail.jpg'),
  'fish': require('../../assets/images/words/fish-thumbnail.jpg'),
  'flower': require('../../assets/images/words/flower-thumbnail.jpg'),
  'keys': require('../../assets/images/words/keys-thumbnail.jpg'),
  'cup': require('../../assets/images/words/cup-thumbnail.jpg'),
  'brush': require('../../assets/images/words/brush-thumbnail.jpg'),
  'coat': require('../../assets/images/words/coat-thumbnail.jpg'),
  'shoes': require('../../assets/images/words/shoes-thumbnail.jpg'),
  'hat': require('../../assets/images/words/hat-thumbnail.jpg'),
  'socks': require('../../assets/images/words/socks-thumbnail.jpg'),
  'duck': require('../../assets/images/words/duck-thumbnail.jpg'),
  'pig': require('../../assets/images/words/pig-thumbnail.jpg'),
  'sheep': require('../../assets/images/words/sheep-thumbnail.jpg'),
  'cow': require('../../assets/images/words/cow-thumbnail.jpg'),
  'apple': require('../../assets/images/words/apple-thumbnail.jpg'),
  'banana': require('../../assets/images/words/banana-thumbnail.jpg'),
  'biscuit': require('../../assets/images/words/biscuit-thumbnail.jpg'),
  'drink': require('../../assets/images/words/drink-thumbnail.jpg'),
  'bed': require('../../assets/images/words/bed-thumbnail.jpg'),
  'chair': require('../../assets/images/words/chair-thumbnail.jpg'),
  'table': require('../../assets/images/words/table-thumbnail.jpg'),
  'bath': require('../../assets/images/words/bath-thumbnail.jpg'),
  'eyes': require('../../assets/images/words/eyes-thumbnail.jpg'),
  'mouth': require('../../assets/images/words/mouth-thumbnail.jpg'),
  'hair': require('../../assets/images/words/hair-thumbnail.jpg'),
  'nose': require('../../assets/images/words/nose-thumbnail.jpg'),
  'spoon': require('../../assets/images/words/spoon-thumbnail.jpg'),
  'bag': require('../../assets/images/words/bag-thumbnail.jpg'),
  'phone': require('../../assets/images/words/phone-thumbnail.jpg'),
  'bricks': require('../../assets/images/words/bricks-thumbnail.jpg'),
  'eating': require('../../assets/images/words/eating-thumbnail.jpg'),
  'sleeping': require('../../assets/images/words/sleeping-thumbnail.jpg'),
  'drinking': require('../../assets/images/words/drinking-thumbnail.jpg'),
  'brushing': require('../../assets/images/words/brushing-thumbnail.jpg'),
  'sitting': require('../../assets/images/words/sitting-thumbnail.jpg'),
  'washing': require('../../assets/images/words/washing-thumbnail.jpg'),
  'walking': require('../../assets/images/words/walking-thumbnail.jpg'),
  'crying': require('../../assets/images/words/crying-thumbnail.jpg'),
  'television': require('../../assets/images/words/television-thumbnail.jpg'),
  'light': require('../../assets/images/words/light-thumbnail.jpg'),
  'balloon': require('../../assets/images/words/balloon-thumbnail.jpg'),
  'box': require('../../assets/images/words/box-thumbnail.jpg'),
  'bubbles': require('../../assets/images/words/bubbles-thumbnail.jpg'),
  'big': require('../../assets/images/words/big-thumbnail.jpg'),
  'splashing': require('../../assets/images/words/splashing-thumbnail.jpg'),
  'little': require('../../assets/images/words/little-thumbnail.jpg'),
  'garden': require('../../assets/images/words/garden-thumbnail.jpg'),
  'star': require('../../assets/images/words/star-thumbnail.jpg'),
  'house': require('../../assets/images/words/house-thumbnail.jpg'),
  'tree': require('../../assets/images/words/tree-thumbnail.jpg'),
  'jumping': require('../../assets/images/words/jumping-thumbnail.jpg'),
  'playing': require('../../assets/images/words/playing-thumbnail.jpg'),
  'running': require('../../assets/images/words/running-thumbnail.jpg'),
  'kissing': require('../../assets/images/words/kissing-thumbnail.jpg'),
  'clapping': require('../../assets/images/words/clapping-thumbnail.jpg'),
  'reading': require('../../assets/images/words/reading-thumbnail.jpg'),
  'cutting': require('../../assets/images/words/cutting-thumbnail.jpg'),
  'throwing': require('../../assets/images/words/throwing-thumbnail.jpg'),
  'towel': require('../../assets/images/words/towel-thumbnail.jpg'),
  'soap': require('../../assets/images/words/soap-thumbnail.jpg'),
  'toothbrush': require('../../assets/images/words/toothbrush-thumbnail.jpg'),
  'teeth': require('../../assets/images/words/teeth-thumbnail.jpg'),
  'bread': require('../../assets/images/words/bread-thumbnail.jpg'),
  'dinner': require('../../assets/images/words/dinner-thumbnail.jpg'),
  'juice': require('../../assets/images/words/juice-thumbnail.jpg'),
  'yogurt': require('../../assets/images/words/yogurt-thumbnail.jpg'),
  'chicken': require('../../assets/images/words/chicken-thumbnail.jpg'),
  'monkey': require('../../assets/images/words/monkey-thumbnail.jpg'),
  'rabbit': require('../../assets/images/words/rabbit-thumbnail.jpg'),
  'horse': require('../../assets/images/words/horse-thumbnail.jpg'),
  'dress': require('../../assets/images/words/dress-thumbnail.jpg'),
  'jumper': require('../../assets/images/words/jumper-thumbnail.jpg'),
  'boots': require('../../assets/images/words/boots-thumbnail.jpg'),
  'trousers': require('../../assets/images/words/trousers-thumbnail.jpg'),
  'foot': require('../../assets/images/words/foot-thumbnail.jpg'),
  'tummy': require('../../assets/images/words/tummy-thumbnail.jpg'),
  'hand': require('../../assets/images/words/hand-thumbnail.jpg'),
  'ear': require('../../assets/images/words/ear-thumbnail.jpg'),
  'up': require('../../assets/images/words/up-thumbnail.jpg'),
  'down': require('../../assets/images/words/down-thumbnail.jpg'),
  'swing': require('../../assets/images/words/swing-thumbnail.jpg'),
  'bike': require('../../assets/images/words/bike-thumbnail.jpg'),
  'boat': require('../../assets/images/words/boat-thumbnail.jpg'),
  'bus': require('../../assets/images/words/bus-thumbnail.jpg'),
  'aeroplane': require('../../assets/images/words/aeroplane-thumbnail.jpg'),
  'train': require('../../assets/images/words/train-thumbnail.jpg'),
  'wet': require('../../assets/images/words/wet-thumbnail.jpg'),
  'dirty': require('../../assets/images/words/dirty-thumbnail.jpg'),
  'hot': require('../../assets/images/words/hot-thumbnail.jpg'),
  'cold': require('../../assets/images/words/cold-thumbnail.jpg'),
};

export const words: Word[] = [
  {
    "image": "ball",
    "imageUpdated": false,
    "sound": "ball",
    "soundUpdated": false,
    "text": "ball",
    "textUpdated": false
  },
  {
    "image": "book",
    "imageUpdated": false,
    "sound": "book",
    "soundUpdated": false,
    "text": "book",
    "textUpdated": false
  },
  {
    "image": "dolly",
    "imageUpdated": false,
    "sound": "dolly",
    "soundUpdated": false,
    "text": "dolly",
    "textUpdated": false
  },
  {
    "image": "car",
    "imageUpdated": false,
    "sound": "car",
    "soundUpdated": false,
    "text": "car",
    "textUpdated": false
  },
  {
    "image": "bird",
    "imageUpdated": false,
    "sound": "bird",
    "soundUpdated": false,
    "text": "bird",
    "textUpdated": false
  },
  {
    "image": "dog",
    "imageUpdated": false,
    "sound": "dog",
    "soundUpdated": false,
    "text": "dog",
    "textUpdated": false
  },
  {
    "image": "cat",
    "imageUpdated": false,
    "sound": "cat",
    "soundUpdated": false,
    "text": "cat",
    "textUpdated": false
  },
  {
    "image": "fish",
    "imageUpdated": false,
    "sound": "fish",
    "soundUpdated": false,
    "text": "fish",
    "textUpdated": false
  },
  {
    "image": "flower",
    "imageUpdated": false,
    "sound": "flower",
    "soundUpdated": false,
    "text": "flower",
    "textUpdated": false
  },
  {
    "image": "keys",
    "imageUpdated": false,
    "sound": "keys",
    "soundUpdated": false,
    "text": "keys",
    "textUpdated": false
  },
  {
    "image": "cup",
    "imageUpdated": false,
    "sound": "cup",
    "soundUpdated": false,
    "text": "cup",
    "textUpdated": false
  },
  {
    "image": "brush",
    "imageUpdated": false,
    "sound": "brush",
    "soundUpdated": false,
    "text": "brush",
    "textUpdated": false
  },
  {
    "image": "coat",
    "imageUpdated": false,
    "sound": "coat",
    "soundUpdated": false,
    "text": "coat",
    "textUpdated": false
  },
  {
    "image": "shoes",
    "imageUpdated": false,
    "sound": "shoes",
    "soundUpdated": false,
    "text": "shoes",
    "textUpdated": false
  },
  {
    "image": "hat",
    "imageUpdated": false,
    "sound": "hat",
    "soundUpdated": false,
    "text": "hat",
    "textUpdated": false
  },
  {
    "image": "socks",
    "imageUpdated": false,
    "sound": "socks",
    "soundUpdated": false,
    "text": "socks",
    "textUpdated": false
  },
  {
    "image": "duck",
    "imageUpdated": false,
    "sound": "duck",
    "soundUpdated": false,
    "text": "duck",
    "textUpdated": false
  },
  {
    "image": "pig",
    "imageUpdated": false,
    "sound": "pig",
    "soundUpdated": false,
    "text": "pig",
    "textUpdated": false
  },
  {
    "image": "sheep",
    "imageUpdated": false,
    "sound": "sheep",
    "soundUpdated": false,
    "text": "sheep",
    "textUpdated": false
  },
  {
    "image": "cow",
    "imageUpdated": false,
    "sound": "cow",
    "soundUpdated": false,
    "text": "cow",
    "textUpdated": false
  },
  {
    "image": "apple",
    "imageUpdated": false,
    "sound": "apple",
    "soundUpdated": false,
    "text": "apple",
    "textUpdated": false
  },
  {
    "image": "banana",
    "imageUpdated": false,
    "sound": "banana",
    "soundUpdated": false,
    "text": "banana",
    "textUpdated": false
  },
  {
    "image": "biscuit",
    "imageUpdated": false,
    "sound": "biscuit",
    "soundUpdated": false,
    "text": "biscuit",
    "textUpdated": false
  },
  {
    "image": "drink",
    "imageUpdated": false,
    "sound": "drink",
    "soundUpdated": false,
    "text": "drink",
    "textUpdated": false
  },
  {
    "image": "bed",
    "imageUpdated": false,
    "sound": "bed",
    "soundUpdated": false,
    "text": "bed",
    "textUpdated": false
  },
  {
    "image": "chair",
    "imageUpdated": false,
    "sound": "chair",
    "soundUpdated": false,
    "text": "chair",
    "textUpdated": false
  },
  {
    "image": "table",
    "imageUpdated": false,
    "sound": "table",
    "soundUpdated": false,
    "text": "table",
    "textUpdated": false
  },
  {
    "image": "bath",
    "imageUpdated": false,
    "sound": "bath",
    "soundUpdated": false,
    "text": "bath",
    "textUpdated": false
  },
  {
    "image": "eyes",
    "imageUpdated": false,
    "sound": "eyes",
    "soundUpdated": false,
    "text": "eyes",
    "textUpdated": false
  },
  {
    "image": "mouth",
    "imageUpdated": false,
    "sound": "mouth",
    "soundUpdated": false,
    "text": "mouth",
    "textUpdated": false
  },
  {
    "image": "hair",
    "imageUpdated": false,
    "sound": "hair",
    "soundUpdated": false,
    "text": "hair",
    "textUpdated": false
  },
  {
    "image": "nose",
    "imageUpdated": false,
    "sound": "nose",
    "soundUpdated": false,
    "text": "nose",
    "textUpdated": false
  },
  {
    "image": "spoon",
    "imageUpdated": false,
    "sound": "spoon",
    "soundUpdated": false,
    "text": "spoon",
    "textUpdated": false
  },
  {
    "image": "bag",
    "imageUpdated": false,
    "sound": "bag",
    "soundUpdated": false,
    "text": "bag",
    "textUpdated": false
  },
  {
    "image": "phone",
    "imageUpdated": false,
    "sound": "phone",
    "soundUpdated": false,
    "text": "phone",
    "textUpdated": false
  },
  {
    "image": "bricks",
    "imageUpdated": false,
    "sound": "bricks",
    "soundUpdated": false,
    "text": "bricks",
    "textUpdated": false
  },
  {
    "image": "eating",
    "imageUpdated": false,
    "sound": "eating",
    "soundUpdated": false,
    "text": "eating",
    "textUpdated": false
  },
  {
    "image": "sleeping",
    "imageUpdated": false,
    "sound": "sleeping",
    "soundUpdated": false,
    "text": "sleeping",
    "textUpdated": false
  },
  {
    "image": "drinking",
    "imageUpdated": false,
    "sound": "drinking",
    "soundUpdated": false,
    "text": "drinking",
    "textUpdated": false
  },
  {
    "image": "brushing",
    "imageUpdated": false,
    "sound": "brushing",
    "soundUpdated": false,
    "text": "brushing",
    "textUpdated": false
  },
  {
    "image": "sitting",
    "imageUpdated": false,
    "sound": "sitting",
    "soundUpdated": false,
    "text": "sitting",
    "textUpdated": false
  },
  {
    "image": "washing",
    "imageUpdated": false,
    "sound": "washing",
    "soundUpdated": false,
    "text": "washing",
    "textUpdated": false
  },
  {
    "image": "walking",
    "imageUpdated": false,
    "sound": "walking",
    "soundUpdated": false,
    "text": "walking",
    "textUpdated": false
  },
  {
    "image": "crying",
    "imageUpdated": false,
    "sound": "crying",
    "soundUpdated": false,
    "text": "crying",
    "textUpdated": false
  },
  {
    "image": "television",
    "imageUpdated": false,
    "sound": "television",
    "soundUpdated": false,
    "text": "television",
    "textUpdated": false
  },
  {
    "image": "light",
    "imageUpdated": false,
    "sound": "light",
    "soundUpdated": false,
    "text": "light",
    "textUpdated": false
  },
  {
    "image": "balloon",
    "imageUpdated": false,
    "sound": "balloon",
    "soundUpdated": false,
    "text": "balloon",
    "textUpdated": false
  },
  {
    "image": "box",
    "imageUpdated": false,
    "sound": "box",
    "soundUpdated": false,
    "text": "box",
    "textUpdated": false
  },
  {
    "image": "bubbles",
    "imageUpdated": false,
    "sound": "bubbles",
    "soundUpdated": false,
    "text": "bubbles",
    "textUpdated": false
  },
  {
    "image": "big",
    "imageUpdated": false,
    "sound": "big",
    "soundUpdated": false,
    "text": "big",
    "textUpdated": false
  },
  {
    "image": "splashing",
    "imageUpdated": false,
    "sound": "splashing",
    "soundUpdated": false,
    "text": "splashing",
    "textUpdated": false
  },
  {
    "image": "little",
    "imageUpdated": false,
    "sound": "little",
    "soundUpdated": false,
    "text": "little",
    "textUpdated": false
  },
  {
    "image": "garden",
    "imageUpdated": false,
    "sound": "garden",
    "soundUpdated": false,
    "text": "garden",
    "textUpdated": false
  },
  {
    "image": "star",
    "imageUpdated": false,
    "sound": "star",
    "soundUpdated": false,
    "text": "star",
    "textUpdated": false
  },
  {
    "image": "house",
    "imageUpdated": false,
    "sound": "house",
    "soundUpdated": false,
    "text": "house",
    "textUpdated": false
  },
  {
    "image": "tree",
    "imageUpdated": false,
    "sound": "tree",
    "soundUpdated": false,
    "text": "tree",
    "textUpdated": false
  },
  {
    "image": "jumping",
    "imageUpdated": false,
    "sound": "jumping",
    "soundUpdated": false,
    "text": "jumping",
    "textUpdated": false
  },
  {
    "image": "playing",
    "imageUpdated": false,
    "sound": "playing",
    "soundUpdated": false,
    "text": "playing",
    "textUpdated": false
  },
  {
    "image": "running",
    "imageUpdated": false,
    "sound": "running",
    "soundUpdated": false,
    "text": "running",
    "textUpdated": false
  },
  {
    "image": "kissing",
    "imageUpdated": false,
    "sound": "kissing",
    "soundUpdated": false,
    "text": "kissing",
    "textUpdated": false
  },
  {
    "image": "clapping",
    "imageUpdated": false,
    "sound": "clapping",
    "soundUpdated": false,
    "text": "clapping",
    "textUpdated": false
  },
  {
    "image": "reading",
    "imageUpdated": false,
    "sound": "reading",
    "soundUpdated": false,
    "text": "reading",
    "textUpdated": false
  },
  {
    "image": "cutting",
    "imageUpdated": false,
    "sound": "cutting",
    "soundUpdated": false,
    "text": "cutting",
    "textUpdated": false
  },
  {
    "image": "throwing",
    "imageUpdated": false,
    "sound": "throwing",
    "soundUpdated": false,
    "text": "throwing",
    "textUpdated": false
  },
  {
    "image": "towel",
    "imageUpdated": false,
    "sound": "towel",
    "soundUpdated": false,
    "text": "towel",
    "textUpdated": false
  },
  {
    "image": "soap",
    "imageUpdated": false,
    "sound": "soap",
    "soundUpdated": false,
    "text": "soap",
    "textUpdated": false
  },
  {
    "image": "toothbrush",
    "imageUpdated": false,
    "sound": "toothbrush",
    "soundUpdated": false,
    "text": "toothbrush",
    "textUpdated": false
  },
  {
    "image": "teeth",
    "imageUpdated": false,
    "sound": "teeth",
    "soundUpdated": false,
    "text": "teeth",
    "textUpdated": false
  },
  {
    "image": "bread",
    "imageUpdated": false,
    "sound": "bread",
    "soundUpdated": false,
    "text": "bread",
    "textUpdated": false
  },
  {
    "image": "dinner",
    "imageUpdated": false,
    "sound": "dinner",
    "soundUpdated": false,
    "text": "dinner",
    "textUpdated": false
  },
  {
    "image": "juice",
    "imageUpdated": false,
    "sound": "juice",
    "soundUpdated": false,
    "text": "juice",
    "textUpdated": false
  },
  {
    "image": "yogurt",
    "imageUpdated": false,
    "sound": "yogurt",
    "soundUpdated": false,
    "text": "yogurt",
    "textUpdated": false
  },
  {
    "image": "chicken",
    "imageUpdated": false,
    "sound": "chicken",
    "soundUpdated": false,
    "text": "chicken",
    "textUpdated": false
  },
  {
    "image": "monkey",
    "imageUpdated": false,
    "sound": "monkey",
    "soundUpdated": false,
    "text": "monkey",
    "textUpdated": false
  },
  {
    "image": "rabbit",
    "imageUpdated": false,
    "sound": "rabbit",
    "soundUpdated": false,
    "text": "rabbit",
    "textUpdated": false
  },
  {
    "image": "horse",
    "imageUpdated": false,
    "sound": "horse",
    "soundUpdated": false,
    "text": "horse",
    "textUpdated": false
  },
  {
    "image": "dress",
    "imageUpdated": false,
    "sound": "dress",
    "soundUpdated": false,
    "text": "dress",
    "textUpdated": false
  },
  {
    "image": "jumper",
    "imageUpdated": false,
    "sound": "jumper",
    "soundUpdated": false,
    "text": "jumper",
    "textUpdated": false
  },
  {
    "image": "boots",
    "imageUpdated": false,
    "sound": "boots",
    "soundUpdated": false,
    "text": "boots",
    "textUpdated": false
  },
  {
    "image": "trousers",
    "imageUpdated": false,
    "sound": "trousers",
    "soundUpdated": false,
    "text": "trousers",
    "textUpdated": false
  },
  {
    "image": "foot",
    "imageUpdated": false,
    "sound": "foot",
    "soundUpdated": false,
    "text": "foot",
    "textUpdated": false
  },
  {
    "image": "tummy",
    "imageUpdated": false,
    "sound": "tummy",
    "soundUpdated": false,
    "text": "tummy",
    "textUpdated": false
  },
  {
    "image": "hand",
    "imageUpdated": false,
    "sound": "hand",
    "soundUpdated": false,
    "text": "hand",
    "textUpdated": false
  },
  {
    "image": "ear",
    "imageUpdated": false,
    "sound": "ear",
    "soundUpdated": false,
    "text": "ear",
    "textUpdated": false
  },
  {
    "image": "up",
    "imageUpdated": false,
    "sound": "up",
    "soundUpdated": false,
    "text": "up",
    "textUpdated": false
  },
  {
    "image": "down",
    "imageUpdated": false,
    "sound": "down",
    "soundUpdated": false,
    "text": "down",
    "textUpdated": false
  },
  {
    "image": "swing",
    "imageUpdated": false,
    "sound": "swing",
    "soundUpdated": false,
    "text": "swing",
    "textUpdated": false
  },
  {
    "image": "bike",
    "imageUpdated": false,
    "sound": "bike",
    "soundUpdated": false,
    "text": "bike",
    "textUpdated": false
  },
  {
    "image": "boat",
    "imageUpdated": false,
    "sound": "boat",
    "soundUpdated": false,
    "text": "boat",
    "textUpdated": false
  },
  {
    "image": "bus",
    "imageUpdated": false,
    "sound": "bus",
    "soundUpdated": false,
    "text": "bus",
    "textUpdated": false
  },
  {
    "image": "aeroplane",
    "imageUpdated": false,
    "sound": "aeroplane",
    "soundUpdated": false,
    "text": "aeroplane",
    "textUpdated": false
  },
  {
    "image": "train",
    "imageUpdated": false,
    "sound": "train",
    "soundUpdated": false,
    "text": "train",
    "textUpdated": false
  },
  {
    "image": "wet",
    "imageUpdated": false,
    "sound": "wet",
    "soundUpdated": false,
    "text": "wet",
    "textUpdated": false
  },
  {
    "image": "dirty",
    "imageUpdated": false,
    "sound": "dirty",
    "soundUpdated": false,
    "text": "dirty",
    "textUpdated": false
  },
  {
    "image": "hot",
    "imageUpdated": false,
    "sound": "hot",
    "soundUpdated": false,
    "text": "hot",
    "textUpdated": false
  },
  {
    "image": "cold",
    "imageUpdated": false,
    "sound": "cold",
    "soundUpdated": false,
    "text": "cold",
    "textUpdated": false
  }
];
