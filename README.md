const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');
const timeLabel = document.getElementById('timeLabel');

const controls = {
  intensity: document.getElementById('intensity'),
  bloom: document.getElementById('bloom'),
  distortion: document.getElementById('distortion'),
  grain: document.getElementById('grain'),
  color: document.getElementById('color')
};

const valueLabels = {
  intensity: document.getElementById('intensityValue'),
  bloom: document.getElementById('bloomValue'),
  distortion: document.getElementById('distortionValue'),
  grain: document.getElementById('grainValue'),
  color: document.getElementById('colorValue')
};

const state = {
  particles: [],
  time: 0,
  intensity: Number(controls.intensity.value),
  bloom: Number(controls.bloom.value),
  distortion: Number(controls.distortion.value),
  grain: Number(controls.grain.value),
  color: Number(controls.color.value),
  uploadedImage: null
};

Object.entries(controls).forEach(([key, input]) => {
  input.addEventListener('input', (event) => {
    const value = Number(event.target.value);
    state[key] = value;
    valueLabels[key].textContent = value;
  });
});

function buildParticles() {
  const width = canvas.clientWidth || 1200;
  const height = canvas.clientHeight || 560;
  const count = Math.min(180, Math.max(80, Math.floor(width / 8)));

  state.particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2.2 + 1,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    hue: 170 + Math.random() * 130,
    alpha: Math.random() * 0.8 + 0.2
  }));
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildParticles();
}

function updateTimeDisplay() {
  const total = Math.floor(state.time % 3600);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  timeLabel.textContent = `00:${minutes}:${seconds}`;
}

function renderBackground() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const g = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    40,
    w * 0.5,
    h * 0.45,
    w * 0.78
  );

  g.addColorStop(0, `rgba(27, 76, 101, ${0.22 + state.intensity / 200})`);
  g.addColorStop(0.3, `rgba(34, 32, 92, ${0.42 + state.bloom / 180})`);
  g.addColorStop(1, 'rgba(4, 8, 14, 1)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.beginPath();
  ctx.fillStyle = 'rgba(115, 231, 255, 0.12)';
  ctx.arc(w * 0.28, h * 0.6, 160 + state.bloom * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = `rgba(${110 + state.color * 0.6}, 120, 255, 0.12)`;
  ctx.arc(w * 0.72, h * 0.52, 190 + state.intensity * 0.85, 0, Math.PI * 2);
  ctx.fill();
}

function renderWave() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const amplitude = 28 + state.distortion * 0.7;
  const frequency = 0.012 + state.bloom / 9000;

  ctx.beginPath();
  for (let x = 0; x <= w; x += 8) {
    const y = h * 0.56 + Math.sin(x * frequency + state.time * 1.8) * amplitude + Math.cos(x * (frequency * 1.8) - state.time) * (amplitude * 0.55);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = `rgba(115, 231, 255, ${0.35 + state.bloom / 170})`;
  ctx.lineWidth = 2.2;
  ctx.shadowBlur = 18 + state.intensity / 6;
  ctx.shadowColor = 'rgba(115, 231, 255, 0.8)';
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.fillStyle = 'rgba(126, 118, 255, 0.08)';
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 22) {
    const y = h * 0.78 + Math.sin(x * 0.024 + state.time * 1.4) * (26 + state.distortion * 0.3);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function renderParticles() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  for (const p of state.particles) {
    p.x += p.vx * (1 + state.intensity / 90);
    p.y += p.vy * (1 + state.distortion / 90);

    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue + state.color * 0.35}, 100%, 72%, ${p.alpha})`;
    ctx.shadowBlur = 12 + state.bloom / 10;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, 0.9)`;
    ctx.arc(p.x, p.y, p.r + state.intensity / 180, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function renderGrain() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const grainAmount = state.grain / 120;

  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const alpha = grainAmount * (0.18 + Math.random() * 0.9);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

function renderUploadedMedia() {
  if (!state.uploadedImage) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const img = state.uploadedImage;

  const ratio = Math.min(w / img.width, h / img.height);
  const drawW = img.width * ratio;
  const drawH = img.height * ratio;
  const x = (w - drawW) / 2;
  const y = (h - drawH) / 2;

  ctx.save();
  ctx.globalAlpha = 0.22 + state.intensity / 220;
  ctx.filter = 'saturate(1.4) contrast(1.2) brightness(1.15)';
  ctx.drawImage(img, x, y, drawW, drawH);
  ctx.restore();
}

function tick() {
  state.time += 0.016;
  updateTimeDisplay();
  renderBackground();
  renderUploadedMedia();
  renderWave();
  renderParticles();
  renderGrain();
  requestAnimationFrame(tick);
}

window.addEventListener('resize', resizeCanvas);

const mediaUpload = document.getElementById('mediaUpload');
mediaUpload.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const img = new Image();
    img.onload = () => {
      state.uploadedImage = img;
    };
    img.src = loadEvent.target.result;
  };
  reader.readAsDataURL(file);
});

Object.entries(controls).forEach(([key, input]) => {
  valueLabels[key].textContent = input.value;
  state[key] = Number(input.value);
});

resizeCanvas();
requestAnimationFrame(tick);
