const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const primaryColor = '#c10742';
const primaryColorR = 193;
const primaryColorG = 7;
const primaryColorB = 66;
const maxOpacity = 240;
const opacityIncreaseFactor = 1.5;
const r = 100;
const thicc = 10;
const neighborSize = 5;
const width = window.innerWidth;
const height = window.innerHeight;

const resizeCanvas = () => {
  canvas.setAttribute('width', window.innerWidth);
  canvas.setAttribute('height', window.innerHeight);
};

resizeCanvas();

const drawInitialCircle = (pixels, cx, cy) => {
  const width = pixels.length;
  const height = pixels[0].length;

  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
      if (Math.abs(r - dist) < thicc) {
        pixels[x][y] = Math.min(maxOpacity, pixels[x][y] + maxOpacity * (thicc - Math.abs(r - dist)) / thicc);
      }
    }
  }
};

const starts = {
  circle: drawInitialCircle,
  venn: (pixels, mx, my) => {
    drawInitialCircle(pixels, mx - r / 2, my);
    drawInitialCircle(pixels, mx + r / 2, my);
  }
};

const generateInitialPixels = pixels => {
  const width = pixels.length;
  const height = pixels[0].length;

  const mx = width / 2;
  const my = height / 2;

  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      pixels[x][y] = 0;
    }
  }

  const paramStart = new URLSearchParams(window.location.search).get('start') ?? 'circle';
  (starts[paramStart] ?? starts.circle)(pixels, mx, my);

  return pixels;
};

const getNeighborSum = (pixels, cx, cy) => {
  const xlower = Math.max(cx - neighborSize, 0);
  const xupper = Math.min(cx + neighborSize, pixels.length);
  const ylower = Math.max(cy - neighborSize, 0);
  const yupper = Math.min(cy + neighborSize, pixels[0].length);

  let sum = 0;

  for (let x = xlower; x < xupper; ++x) {
    for (let y = ylower; y < yupper; ++y) {
      sum += pixels[x][y];
    };
  }

  return { sum, count: (xupper - xlower) * (yupper - ylower) };
};


const genNextState = ([current, next]) => {
  const width = current.length;
  const height = current[0].length;

  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const { sum, count } = getNeighborSum(current, x, y);
      const newOpacity = opacityIncreaseFactor * sum / count;
      next[x][y] = newOpacity <= maxOpacity ? newOpacity : 0;
    }
  }

  return [next, current];
};

const drawPixels = pixelsToDraw => {
  ctx.clearRect(0, 0, width, height);
  const id = ctx.getImageData(0, 0, width, height);
  const pixels = id.data;

  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const off = (y * id.width + x) * 4;
      pixels[off] = primaryColorR;
      pixels[off + 1] = primaryColorG;
      pixels[off + 2] = primaryColorB;
      pixels[off + 3] = pixelsToDraw[x][y];
    }
  }

  ctx.putImageData(id, 0, 0);
};

let firstCopy = Array(width).fill([0]).map(_ => Array(height).fill(0));
let secondCopy = Array(width).fill([0]).map(_ => Array(height).fill(0));
generateInitialPixels(firstCopy);
generateInitialPixels(secondCopy);
let pixels = [firstCopy, secondCopy];
const sleep = ms => new Promise(res => setTimeout(res, ms));
drawPixels(pixels[0]);
setTimeout(async () => {
  for (let i = 0; i < 50; ++i) {
    console.time(`gen state #${i}`);
    pixels = genNextState(pixels);
    console.timeEnd(`gen state #${i}`);
    console.time(`render state #${i}`);
    drawPixels(pixels[0]);
    console.timeEnd(`render state #${i}`);
    await sleep(50);
  };
}, 500);

// window.addEventListener('resize', resizeCanvas);
