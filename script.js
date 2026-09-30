const CONFIG = {
  question: "Can I be your boyfriend?",
  subtitle: "pls say yes 🤞",
  yesText: "YOOOO YES OFC I WILL❤️",
  noTexts: ["EW NO GTFO", "waittttt say wallahi", "i didnt expect this so this button js never works"],
  finalText: "YAYYY WOOHOOO ❤️",
  yesNote: "this took a while to make, hope u like it, such a pain to get that heart animation working",
  brickUnit: 18,
  heartScale: 1,
  animationSpeed: 1,
  colors: ["#ff6f91", "#f44e7b", "#ec386a", "#ff8aa6", "#d82d5b", "#ff9bb2"]
};

const questionText = document.querySelector("#questionText");
const subtitleText = document.querySelector("#subtitleText");
const yesButton = document.querySelector("#yesButton");
const noButton = document.querySelector("#noButton");
const introScreen = document.querySelector("#introScreen");
const proposal = document.querySelector("#proposal");
const buildStage = document.querySelector("#buildStage");
const svg = document.querySelector("#heartSvg");
const finalMessage = document.querySelector("#finalMessage");
const yesNote = document.querySelector("#yesNote");
const particleLayer = document.querySelector("#particleLayer");

questionText.textContent = CONFIG.question;
subtitleText.textContent = CONFIG.subtitle;
yesButton.textContent = CONFIG.yesText;
finalMessage.textContent = CONFIG.finalText;
yesNote.textContent = CONFIG.yesNote;

let noClicks = 0;
let built = false;
let introDismissed = false;
let brickGroups = [];
let heartBounds = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shade(hex, amount) {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) => parseInt(clean.slice(index, index + 2), 16));
  return `rgb(${channels.map((channel) => clamp(channel + amount, 0, 255)).join(",")})`;
}

function makeHeartMask() {
  const rows = [
    { width: 16, gap: 6 },
    { width: 20, gap: 6 },
    { width: 24, gap: 4 },
    { width: 28, gap: 4 },
    { width: 30, gap: 2 },
    { width: 32, gap: 0 },
    { width: 32, gap: 0 },
    { width: 32, gap: 0 },
    { width: 30, gap: 0 },
    { width: 28, gap: 0 },
    { width: 26, gap: 0 },
    { width: 24, gap: 0 },
    { width: 22, gap: 0 },
    { width: 20, gap: 0 },
    { width: 18, gap: 0 },
    { width: 16, gap: 0 },
    { width: 14, gap: 0 },
    { width: 12, gap: 0 },
    { width: 10, gap: 0 },
    { width: 8, gap: 0 },
    { width: 6, gap: 0 },
    { width: 4, gap: 0 },
    { width: 2, gap: 0 }
  ];

  const width = 32;
  return rows.map((row) => {
    const cells = Array(width).fill(false);
    if (row.gap > 0) {
      const lobeWidth = (row.width - row.gap) / 2;
      const leftStart = width / 2 - row.gap / 2 - lobeWidth;
      const rightStart = width / 2 + row.gap / 2;
      for (let i = 0; i < lobeWidth; i += 1) {
        cells[leftStart + i] = true;
        cells[rightStart + i] = true;
      }
    } else {
      const start = (width - row.width) / 2;
      for (let i = 0; i < row.width; i += 1) {
        cells[start + i] = true;
      }
    }
    return cells;
  });
}

function cellTaken(mask, x, y) {
  return Boolean(mask[y] && mask[y][x]);
}

function canPlace(mask, used, x, y, w, h) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      if (!cellTaken(mask, xx, yy) || used.has(`${xx},${yy}`)) return false;
    }
  }
  return true;
}

function markUsed(used, x, y, w, h) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) {
      used.add(`${xx},${yy}`);
    }
  }
}

function tileMask(mask) {
  const used = new Set();
  const bricks = [];
  const sizes = [
    [4, 2],
    [2, 2],
    [2, 1],
    [1, 1]
  ];

  for (let y = mask.length - 1; y >= 0; y -= 1) {
    for (let x = 0; x < mask[0].length; x += 1) {
      if (!cellTaken(mask, x, y) || used.has(`${x},${y}`)) continue;
      const size = sizes.find(([w, h]) => canPlace(mask, used, x, y, w, h));
      const [w, h] = size || [1, 1];
      markUsed(used, x, y, w, h);
      bricks.push({ x, y, w, h });
    }
  }

  return bricks;
}

function createSvgElement(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function drawBrick(brick, index, unit, offsetX, offsetY) {
  const depth = unit * 0.28;
  const studR = unit * 0.23;
  const color = CONFIG.colors[index % CONFIG.colors.length];
  const x = offsetX + brick.x * unit;
  const y = offsetY + brick.y * unit;
  const width = brick.w * unit;
  const height = brick.h * unit;
  const group = createSvgElement("g", { class: "lego-brick" });
  group.dataset.final = "1";
  group.style.opacity = "0";

  const shadow = createSvgElement("rect", {
    x: x + depth * 0.9,
    y: y + depth * 1.25,
    width,
    height,
    rx: unit * 0.16,
    fill: "rgba(94,20,43,0.16)"
  });
  const side = createSvgElement("path", {
    class: "brick-side",
    d: `M ${x + width} ${y + depth} L ${x + width + depth} ${y} L ${x + width + depth} ${y + height - depth} L ${x + width} ${y + height} Z`,
    fill: shade(color, -34)
  });
  const top = createSvgElement("path", {
    class: "brick-top",
    d: `M ${x} ${y + depth} L ${x + depth} ${y} L ${x + width + depth} ${y} L ${x + width} ${y + depth} Z`,
    fill: shade(color, 34)
  });
  const body = createSvgElement("rect", {
    class: "brick-body",
    x,
    y: y + depth,
    width,
    height: height - depth,
    rx: unit * 0.14,
    fill: color
  });

  group.append(shadow, side, top, body);

  for (let sy = 0; sy < brick.h; sy += 1) {
    for (let sx = 0; sx < brick.w; sx += 1) {
      const cx = x + sx * unit + unit / 2 + depth * 0.55;
      const cy = y + sy * unit + unit * 0.34;
      group.append(
        createSvgElement("ellipse", {
          class: "stud-side",
          cx,
          cy: cy + unit * 0.1,
          rx: studR,
          ry: studR * 0.34,
          fill: shade(color, -22)
        }),
        createSvgElement("ellipse", {
          class: "stud-top",
          cx,
          cy,
          rx: studR,
          ry: studR * 0.5,
          fill: shade(color, 50)
        })
      );
    }
  }

  return group;
}

function renderHeart() {
  svg.replaceChildren();
  const mask = makeHeartMask();
  const bricks = tileMask(mask);
  const unit = CONFIG.brickUnit * CONFIG.heartScale;
  const gridW = mask[0].length * unit;
  const gridH = mask.length * unit;
  const depth = unit * 0.35;
  const viewW = gridW + unit * 3;
  const viewH = gridH + unit * 4.5;
  const offsetX = unit * 1.1;
  const offsetY = unit * 1.3;
  svg.setAttribute("viewBox", `0 0 ${viewW} ${viewH}`);

  const sorted = bricks.sort((a, b) => (b.y - a.y) || (Math.abs(a.x - mask[0].length / 2) - Math.abs(b.x - mask[0].length / 2)));
  brickGroups = sorted.map((brick, index) => drawBrick(brick, index, unit, offsetX, offsetY));
  brickGroups.forEach((group) => svg.appendChild(group));
  heartBounds = { viewW, viewH, centerX: viewW / 2, centerY: offsetY + gridH * 0.48, width: gridW, height: gridH + depth };
}

function scatterBrick(group, index, total) {
  const side = index % 4;
  const distance = 260 + (index % 11) * 18;
  const x = side === 0 ? -distance : side === 1 ? distance : (index % 2 ? -110 : 110);
  const y = side === 2 ? -distance : side === 3 ? distance : (index % 5 - 2) * 42;
  const rot = ((index * 47) % 80) - 40;
  const scale = 0.82 + (index % 5) * 0.035;
  group.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
  group.style.opacity = "0";
  group.style.transition = "none";
  group.getBoundingClientRect();

  const delay = 220 + index * (34 / CONFIG.animationSpeed);
  const duration = (760 + (index % 8) * 24) / CONFIG.animationSpeed;
  window.setTimeout(() => {
    group.style.opacity = "1";
    group.style.transition = `transform ${duration}ms cubic-bezier(.16,.86,.24,1.08), opacity 260ms ease`;
    group.style.transform = "translate(0, 0) rotate(0deg) scale(1)";
  }, delay);

  window.setTimeout(() => {
    group.animate(
      [
        { transform: "translate(0, 0) scale(1)" },
        { transform: "translate(0, -3px) scale(1.018)" },
        { transform: "translate(0, 0) scale(1)" }
      ],
      { duration: 240, easing: "ease-out" }
    );
  }, delay + duration - 70);

  return delay + duration;
}

function celebrate() {
  const lastLanding = brickGroups.reduce((max, group, index) => Math.max(max, scatterBrick(group, index, brickGroups.length)), 0);
  window.setTimeout(() => {
    svg.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.045) translateY(-5px)" },
        { transform: "scale(1)" }
      ],
      { duration: 620, easing: "cubic-bezier(.2,1.4,.2,1)" }
    );
    burstParticles();
  }, lastLanding + 220);

  window.setTimeout(() => {
    finalMessage.classList.add("visible");
    svg.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-4px)" },
        { transform: "translateY(0)" }
      ],
      { duration: 2500, iterations: Infinity, easing: "ease-in-out" }
    );
  }, lastLanding + 650);
}

function burstParticles() {
  const rect = svg.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height * 0.42;
  const palette = ["#e9436f", "#ff8aa6", "#d82d5b", "#f7b7c4", "#c91f50"];

  for (let i = 0; i < 34; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";
    particle.textContent = i % 3 === 0 ? "♥" : "♡";
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.setProperty("--particle-color", palette[i % palette.length]);
    particle.style.setProperty("--size", `${14 + (i % 5) * 3}px`);
    particle.style.setProperty("--tx", `${Math.cos(i * 0.85) * (70 + (i % 7) * 16)}px`);
    particle.style.setProperty("--ty", `${Math.sin(i * 0.85) * (58 + (i % 6) * 15) - 70}px`);
    particle.style.setProperty("--rot", `${(i % 2 ? 1 : -1) * (35 + i * 7)}deg`);
    particleLayer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

function startBuild() {
  if (built) return;
  built = true;
  renderHeart();
  proposal.classList.add("hidden");
  window.setTimeout(() => {
    buildStage.classList.add("active");
    buildStage.setAttribute("aria-hidden", "false");
    yesNote.classList.add("visible");
    window.setTimeout(() => {
      yesNote.classList.remove("visible");
    }, 5600);
    celebrate();
  }, 430);
}

function showProposal() {
  if (introDismissed) return;
  introDismissed = true;
  introScreen.classList.add("dismissed");
  proposal.classList.remove("awaiting-intro");
  proposal.classList.add("intro-ready");
  window.setTimeout(() => {
    introScreen.setAttribute("aria-hidden", "true");
  }, 850);
}

function dodgeNoButton() {
  noClicks += 1;
  const textIndex = Math.min(noClicks, CONFIG.noTexts.length - 1);
  noButton.textContent = CONFIG.noTexts[textIndex];
  const maxX = Math.min(86, window.innerWidth * 0.18);
  const maxY = 28;
  const direction = noClicks % 2 ? 1 : -1;
  const x = direction * (28 + (noClicks % 3) * 18);
  const y = (noClicks % 2 ? -1 : 1) * (8 + (noClicks % 4) * 5);
  noButton.style.transform = `translate(${clamp(x, -maxX, maxX)}px, ${clamp(y, -maxY, maxY)}px)`;
}

introScreen.addEventListener("click", showProposal);
introScreen.addEventListener("touchend", (event) => {
  event.preventDefault();
  showProposal();
});
introScreen.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    showProposal();
  }
});
yesButton.addEventListener("click", startBuild);
noButton.addEventListener("click", dodgeNoButton);
window.addEventListener("resize", () => {
  if (!built) return;
  renderHeart();
  brickGroups.forEach((group) => {
    group.style.opacity = "1";
    group.style.transform = "translate(0, 0) rotate(0deg) scale(1)";
  });
});

renderHeart();
