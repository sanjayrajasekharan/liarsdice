import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;
const DICE_SIZE = 32;
const GAP = 4;
const DICE_OPACITY = 0.75;
const BG_COLOR = '#f5f5f5';
const BRAND_COLOR = '#ef4444'; // primary-600 red
const TEXT_COLOR = '#282828'; // softer off-black

// Read all dice SVGs
const diceFiles = ['one', 'two', 'three', 'four', 'five', 'six'];
const diceSvgs = diceFiles.map(name =>
  readFileSync(join(__dirname, '../public/images/dice', `${name}.svg`), 'utf-8')
);

// Create brand-colored versions of dice for background
const brandDiceSvgs = diceSvgs.map(svg =>
  svg.replaceAll('#171717', BRAND_COLOR)
);

// Calculate grid dimensions (add extra row/col for offset)
const cols = Math.ceil(WIDTH / (DICE_SIZE + GAP)) + 2;
const rows = Math.ceil(HEIGHT / (DICE_SIZE + GAP)) + 2;

// Offset to cut off first row/column
const GRID_OFFSET = -(DICE_SIZE / 2);

// Seeded random for reproducibility
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate dice grid as SVG
function generateDiceGrid() {
  let diceElements = '';
  let seed = 42;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = GRID_OFFSET + col * (DICE_SIZE + GAP);
      const y = GRID_OFFSET + row * (DICE_SIZE + GAP);
      const diceIndex = Math.floor(seededRandom(seed++) * 6);

      // Skip dice that overlap with the clear zone
      const diceRight = x + DICE_SIZE;
      const diceBottom = y + DICE_SIZE;
      // if (diceRight > CLEAR_ZONE.left && x < CLEAR_ZONE.right &&
      //   diceBottom > CLEAR_ZONE.top && y < CLEAR_ZONE.bottom) {
      //   continue;
      // }

      // Extract the inner content of the dice SVG (without outer svg tags) - use brand color
      const svgContent = brandDiceSvgs[diceIndex]
        .replace(/<svg[^>]*>/, '')
        .replace(/<\/svg>/, '');

      diceElements += `
        <g transform="translate(${x}, ${y}) scale(${DICE_SIZE / 64})" opacity="${DICE_OPACITY}">
          ${svgContent}
        </g>
      `;
    }
  }

  return diceElements;
}

// Get the five dice SVG content for logo (use softer color)
const fiveDiceSvg = diceSvgs[4]; // index 4 = five.svg
const logoContent = fiveDiceSvg
  .replace(/<svg[^>]*>/, '')
  .replace(/<\/svg>/, '')
  .replaceAll('#171717', TEXT_COLOR);

// Layout constants for text + logo (centered as a unit)
const LOGO_SIZE = 64;
const LOGO_GAP = 28; // match the word spacing in "Liar's Dice"
const TEXT_WIDTH = 435; // measured width of "Liar's Dice" at 72px
const TOTAL_CONTENT_WIDTH = TEXT_WIDTH + LOGO_GAP + LOGO_SIZE;
const CONTENT_START_X = (WIDTH - TOTAL_CONTENT_WIDTH) / 2;
const TEXT_X = CONTENT_START_X + TEXT_WIDTH / 2; // center of text
const LOGO_X = CONTENT_START_X + TEXT_WIDTH + LOGO_GAP;

// Clear zone around text (no dice rendered here)
const CLEAR_PADDING_X = 0;
const CLEAR_PADDING_Y = 0;
const CLEAR_ZONE = {
  left: CONTENT_START_X - CLEAR_PADDING_X + 24,
  right: LOGO_X + LOGO_SIZE + CLEAR_PADDING_X - 8,
  top: HEIGHT / 2 - CLEAR_PADDING_Y + 4,
  bottom: HEIGHT / 2 + CLEAR_PADDING_Y,
};

// Generate the complete SVG
const fullSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG_COLOR}"/>
  
  <!-- Dice grid -->
  <g>
    ${generateDiceGrid()}
  </g>
  
  <!-- Title text (centered) -->
  <text 
    x="${TEXT_X + 12}" 
    y="${HEIGHT / 2}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    font-family="'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace"
    font-size="72"
    font-weight="700"
    fill="${TEXT_COLOR}"
    letter-spacing="-2"
  >Liar's Dice</text>
  
  <!-- Logo dice (five) - to the right of text -->
  <g transform="translate(${LOGO_X + 15}, ${HEIGHT / 2 - LOGO_SIZE / 2}) scale(${LOGO_SIZE / 64})">
    ${logoContent}
  </g>
</svg>
`;

// Generate PNG
async function generateImage() {
  const outputPath = join(__dirname, '../public/og-image.png');

  await sharp(Buffer.from(fullSvg))
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

generateImage().catch(console.error);
