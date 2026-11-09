const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');
const timeLabel = document.getElementById('timeLabel');

const controls = {
  intensity: document.getElementById('intensity'),
  bloom: document.getElementById('bloom'),
  distortion: document.getElementById('distortion'),
  grain: document.getElementById('grain')
};

const values = {
  intensity: document.getElementById('intensityValue'),
  bloom: document.getElementById('bloomValue'),
  distortion: document.getElementById('distortionValue'),
  grain: document.getElementById('grainValue')
};

const state = {
  particles: [],
  t: 0,
  intensity: Number(controls.intensity.value),
  bloom: Number(controls.bloom.value),
  distortion: Number(controls.distortion.value),
  grain: Number(controls.grain.value)
};

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildParticles();
}

function buildParticles() {
  const count = Math.min(130, Math.max(60, Math.floor(canvas.clientWidth / 12)));
  state.particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.clientWidth,
    y: Math.random() * canvas.clientHeight,
    r: Math.random() * 2 + 1,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9,
    hue: 180 + Math.random() * 120,
    alpha: Math.random() * 0.8 + 0.2
  }));
}

function updateTimeLabel() {
  const totalSeconds = Math.floor(state.t % 3600);
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  timeLabel.textContent = `00:${mins}:${secs}`;
}

function setValue(field, value) {
  state[field] = Number(value);
  values[field].textContent = value;
}

Object.entries(controls).forEach(([key, input]) => {
  input.addEventListener('input', (event) => {
    setValue(key, event.target.value);
  });
});

function renderBackground() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const gradient = ctx.createRadialGradient(
    w * 0.5,
    h * 0.45,
    40,
    w * 0.5,
    h * 0.45,
    w * 0.8
  );
  gradient.addColorStop(0, `rgba(18, 73, 95, ${0.24 + state.intensity / 200})`);
  gradient.addColorStop(0.3, `rgba(29, 22, 90, ${0.42 + state.bloom / 200})`);
  gradient.addColorStop(1, 'rgba(4, 8, 14, 1)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(94, 227, 255, ${0.08 + i * 0.03})`;
    ctx.arc(
      w * (0.24 + i * 0.18),
      h * (0.55 + Math.sin(state.t * 0.6 + i) * 0.08),
      140 + i * 90,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function renderParticles() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  for (const p of state.particles) {
    p.x += p.vx * (0.8 + state.intensity / 80);
    p.y += p.vy * (0.8 + state.distortion / 80);

    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;

    const glow = 4 + state.bloom / 18;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${p.alpha})`;
    ctx.shadowBlur = glow;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, 0.9)`;
    ctx.arc(p.x, p.y, p.r + state.intensity / 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function renderWave() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.beginPath();
  const amp = 28 + state.distortion * 0.6;
  const freq = 0.012 + state.bloom / 9000;

  for (let x = 0; x <= w; x += 10) {
    const y = h * 0.58 + Math.sin(x * freq + state.t * 1.9) * amp + Math.cos(x * (freq * 2.1) - state.t) * (amp * 0.5);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.strokeStyle = `rgba(94, 227, 255, ${0.35 + state.bloom / 180})`;
  ctx.lineWidth = 2.2;
  ctx.shadowBlur = 20 + state.intensity / 5;
  ctx.shadowColor = 'rgba(94, 227, 255, 0.8)';
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.fillStyle = 'rgba(125, 100, 255, 0.08)';
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 20) {
    const y = h * 0.78 + Math.sin(x * 0.025 + state.t * 1.4) * (22 + state.distortion * 0.3);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function renderGrain() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const grainStrength = state.grain / 140;

  for (let i = 0; i < 150; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const alpha = grainStrength * (0.2 + Math.random() * 0.8);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function animate() {
  state.t += 0.016;
  updateTimeLabel();

  renderBackground();
  renderWave();
  renderParticles();
  renderGrain();

  requestAnimationFrame(animate);
}

window.addEventListener('resize', resizeCanvas);

Object.entries(controls).forEach(([key, input]) => setValue(key, input.value));
resizeCanvas();
animate();
