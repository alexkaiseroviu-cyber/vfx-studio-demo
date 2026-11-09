const canvas = document.getElementById('fxCanvas');
const ctx = canvas.getContext('2d');
const timeLabel = document.getElementById('timeLabel');
const frameLabel = document.getElementById('frameLabel');
const frameReadout = document.getElementById('frameReadout');
const playhead = document.getElementById('playhead');
const modeLabel = document.getElementById('modeLabel');
const sourceLabel = document.getElementById('sourceLabel');
const toast = document.getElementById('toast');

const defaults = { intensity: 72, bloom: 61, distortion: 49, grain: 27, color: 58 };
const controls = Object.fromEntries(Object.keys(defaults).map((key) => [key, document.getElementById(key)]));
const values = Object.fromEntries(Object.keys(defaults).map((key) => [key, document.getElementById(`${key}Value`)]));
const duration = 20;
const fps = 24;
const state = {
  ...defaults,
  time: 0,
  playing: false,
  looping: true,
  particles: [],
  media: null,
  mediaUrl: null,
  lastTimestamp: 0,
  toastTimer: null
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

function updateControl(key, value) {
  const numericValue = Math.max(0, Math.min(100, Number(value)));
  state[key] = numericValue;
  controls[key].value = String(numericValue);
  values[key].value = String(numericValue);
  values[key].textContent = String(numericValue);
}

Object.keys(defaults).forEach((key) => {
  controls[key].addEventListener('input', () => updateControl(key, controls[key].value));
});

function buildParticles() {
  const width = canvas.clientWidth || 900;
  const height = canvas.clientHeight || 500;
  const count = Math.min(150, Math.max(55, Math.floor(width / 9)));
  state.particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 2 + 0.6,
    vx: (Math.random() - 0.5) * 26,
    vy: (Math.random() - 0.5) * 26,
    hue: 175 + Math.random() * 125,
    alpha: 0.25 + Math.random() * 0.7
  }));
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (!rect.width || !rect.height) return;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildParticles();
}

function drawCover(source, width, height, alpha = 1) {
  const sourceWidth = source.videoWidth || source.naturalWidth || source.width;
  const sourceHeight = source.videoHeight || source.naturalHeight || source.height;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.filter = `saturate(${1 + state.color / 130}) contrast(1.08) brightness(${0.82 + state.intensity / 250})`;
  ctx.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function renderBackground(width, height) {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.45, 20, width * 0.5, height * 0.48, width * 0.8);
  gradient.addColorStop(0, `rgba(27, 76, 101, ${0.14 + state.intensity / 280})`);
  gradient.addColorStop(0.42, `rgba(34, 32, 92, ${0.24 + state.bloom / 300})`);
  gradient.addColorStop(1, '#04080e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const pulse = 0.92 + Math.sin(state.time * 2) * 0.08;
  const glow = ctx.createRadialGradient(width * 0.5, height * 0.55, 2, width * 0.5, height * 0.55, height * 0.36 * pulse);
  glow.addColorStop(0, `hsla(${185 + state.color * 0.6}, 100%, 70%, ${0.12 + state.intensity / 650})`);
  glow.addColorStop(0.5, `hsla(${245 + state.color * 0.25}, 100%, 62%, ${0.07 + state.bloom / 900})`);
  glow.addColorStop(1, 'rgba(20, 25, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function renderRift(width, height) {
  const centerX = width * 0.5;
  const centerY = height * 0.54;
  const pulse = 1 + Math.sin(state.time * 2.8) * 0.035;
  const radiusX = Math.min(width * 0.31, height * 0.58) * pulse;
  const radiusY = radiusX * 0.55;
  const rings = 5;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.sin(state.time * 0.3) * 0.06);
  for (let i = rings; i >= 0; i -= 1) {
    const scale = 0.32 + i * 0.16;
    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX * scale, radiusY * scale, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${185 + state.color * 0.65 + i * 9}, 100%, ${67 - i * 2}%, ${0.16 + state.bloom / 310 + (rings - i) * 0.025})`;
    ctx.lineWidth = i === 0 ? 3 : 1.2;
    ctx.shadowColor = '#65e9ff';
    ctx.shadowBlur = 8 + state.bloom * 0.35;
    ctx.stroke();
  }
  ctx.restore();

  const core = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, radiusX * 0.34);
  core.addColorStop(0, `rgba(245, 255, 255, ${0.42 + state.intensity / 240})`);
  core.addColorStop(0.2, `hsla(${185 + state.color * 0.65}, 100%, 67%, 0.35)`);
  core.addColorStop(1, 'rgba(92, 82, 255, 0)');
  ctx.fillStyle = core;
  ctx.fillRect(centerX - radiusX * 0.4, centerY - radiusY * 0.65, radiusX * 0.8, radiusY * 1.3);

  // Radial light streaks make the preview read as an energy portal.
  ctx.save();
  ctx.translate(centerX, centerY);
  for (let i = 0; i < 34; i += 1) {
    const angle = (i / 34) * Math.PI * 2 + state.time * 0.12;
    const inner = radiusX * (0.28 + (i % 4) * 0.025);
    const outer = radiusX * (0.52 + ((i * 17) % 31) / 100);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner * 0.56);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer * 0.56);
    ctx.strokeStyle = `hsla(${180 + (i * 13 + state.color) % 130}, 100%, 75%, ${0.08 + state.intensity / 700})`;
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.shadowBlur = state.bloom * 0.2;
    ctx.shadowColor = '#73e7ff';
    ctx.stroke();
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

function renderWave(width, height) {
  const amplitude = 16 + state.distortion * 0.5;
  const frequency = 0.009 + state.bloom / 16000;
  ctx.beginPath();
  for (let x = 0; x <= width; x += 8) {
    const y = height * 0.72 + Math.sin(x * frequency + state.time * 1.7) * amplitude + Math.cos(x * frequency * 1.9 - state.time) * amplitude * 0.42;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = `rgba(115, 231, 255, ${0.22 + state.bloom / 330})`;
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 8 + state.intensity * 0.18;
  ctx.shadowColor = '#73e7ff';
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function renderParticles(width, height, deltaSeconds) {
  for (const particle of state.particles) {
    particle.x += particle.vx * (0.35 + state.intensity / 120) * deltaSeconds;
    particle.y += particle.vy * (0.35 + state.distortion / 120) * deltaSeconds;
    if (particle.x < 0) particle.x = width;
    if (particle.x > width) particle.x = 0;
    if (particle.y < 0) particle.y = height;
    if (particle.y > height) particle.y = 0;

    ctx.beginPath();
    ctx.fillStyle = `hsla(${particle.hue + state.color * 0.25}, 100%, 76%, ${particle.alpha})`;
    ctx.shadowBlur = 4 + state.bloom * 0.18;
    ctx.shadowColor = `hsl(${particle.hue}, 100%, 70%)`;
    ctx.arc(particle.x, particle.y, particle.radius + state.intensity * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function renderGrain(width, height) {
  const count = Math.round((width * height / 4200) * (state.grain / 100));
  if (count < 1) return;
  for (let i = 0; i < count; i += 1) {
    const brightness = Math.random() > 0.5 ? 255 : 70;
    ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
  }
}

function updateTimeline() {
  const totalFrames = Math.round(duration * fps);
  const frame = Math.min(totalFrames, Math.floor(state.time * fps));
  const minutes = String(Math.floor(state.time / 60)).padStart(2, '0');
  const seconds = String(Math.floor(state.time % 60)).padStart(2, '0');
  const frameNumber = String(frame).padStart(4, '0');
  timeLabel.textContent = `00:${minutes}:${seconds}`;
  frameLabel.textContent = frameNumber;
  frameReadout.textContent = `Frame ${frameNumber} / ${String(totalFrames).padStart(4, '0')}`;
  playhead.style.left = `${(state.time / duration) * 100}%`;
  modeLabel.textContent = state.playing ? 'Playing' : 'Paused';
  document.getElementById('playButton').textContent = state.playing ? 'Pause' : 'Play';
  document.getElementById('playButton').setAttribute('aria-pressed', String(state.playing));
}

function render(timestamp = 0) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) {
    requestAnimationFrame(render);
    return;
  }
  const delta = state.lastTimestamp ? Math.min((timestamp - state.lastTimestamp) / 1000, 0.05) : 0;
  state.lastTimestamp = timestamp;
  if (state.playing) {
    state.time += delta;
    if (state.time >= duration) state.time = state.looping ? state.time % duration : duration;
    if (!state.looping && state.time >= duration) state.playing = false;
  }

  renderBackground(width, height);
  if (state.media?.tagName === 'VIDEO' && state.media.readyState >= 2) drawCover(state.media, width, height, 0.76);
  else if (state.media?.tagName === 'IMG' && state.media.complete) drawCover(state.media, width, height, 0.76);
  renderRift(width, height);
  renderWave(width, height);
  renderParticles(width, height, delta);
  renderGrain(width, height);
  updateTimeline();
  requestAnimationFrame(render);
}

function saveProject() {
  const project = { controls: Object.fromEntries(Object.keys(defaults).map((key) => [key, state[key]])), time: state.time, looping: state.looping };
  try {
    localStorage.setItem('helios-vfx-project', JSON.stringify(project));
    showToast('Project settings saved in this browser.');
  } catch {
    showToast('Could not save settings in browser storage.');
  }
}

function restoreProject() {
  try {
    const project = JSON.parse(localStorage.getItem('helios-vfx-project') || 'null');
    if (!project) return;
    Object.entries(project.controls || {}).forEach(([key, value]) => {
      if (key in defaults) updateControl(key, value);
    });
    if (Number.isFinite(project.time)) state.time = Math.max(0, Math.min(duration, project.time));
    if (typeof project.looping === 'boolean') state.looping = project.looping;
    document.getElementById('loopButton').textContent = state.looping ? 'Loop on' : 'Loop off';
    document.getElementById('loopButton').setAttribute('aria-pressed', String(state.looping));
  } catch {
    showToast('Saved project data could not be restored.');
  }
}

function renderPng() {
  try {
    const link = document.createElement('a');
    link.download = `helios-shot-013-frame-${String(Math.floor(state.time * fps)).padStart(4, '0')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Preview frame exported as PNG.');
  } catch {
    showToast('PNG export failed. Try removing imported media and retry.');
  }
}

function removeMedia() {
  if (state.media?.tagName === 'VIDEO') state.media.pause();
  if (state.mediaUrl) URL.revokeObjectURL(state.mediaUrl);
  state.media = null;
  state.mediaUrl = null;
  sourceLabel.textContent = 'Procedural scene';
  document.getElementById('clearMediaButton').hidden = true;
  document.getElementById('mediaUpload').value = '';
}

document.getElementById('mediaUpload').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    showToast('Choose a supported image or video file.');
    event.target.value = '';
    return;
  }
  removeMedia();
  state.mediaUrl = URL.createObjectURL(file);
  if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = state.mediaUrl;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.addEventListener('loadeddata', () => video.play().catch(() => {}), { once: true });
    video.addEventListener('error', () => showToast('This video could not be decoded by the browser.'), { once: true });
    state.media = video;
  } else {
    const image = new Image();
    image.onload = () => showToast('Image added to the live composite.');
    image.onerror = () => showToast('This image could not be opened.');
    image.src = state.mediaUrl;
    state.media = image;
  }
  sourceLabel.textContent = file.name.length > 22 ? `${file.name.slice(0, 19)}…` : file.name;
  document.getElementById('clearMediaButton').hidden = false;
});

document.getElementById('clearMediaButton').addEventListener('click', removeMedia);
document.getElementById('saveButton').addEventListener('click', saveProject);
document.getElementById('renderButton').addEventListener('click', renderPng);
document.getElementById('playButton').addEventListener('click', () => {
  state.playing = !state.playing;
  if (state.playing && state.time >= duration) state.time = 0;
});
document.getElementById('loopButton').addEventListener('click', (event) => {
  state.looping = !state.looping;
  event.currentTarget.textContent = state.looping ? 'Loop on' : 'Loop off';
  event.currentTarget.setAttribute('aria-pressed', String(state.looping));
});
document.getElementById('resetButton').addEventListener('click', () => {
  Object.entries(defaults).forEach(([key, value]) => updateControl(key, value));
  showToast('Effect controls reset to defaults.');
});

document.querySelectorAll('[data-preset]').forEach((button) => {
  button.addEventListener('click', () => {
    const presets = {
      rift: { intensity: 82, bloom: 78, distortion: 48, grain: 18, color: 62 },
      haze: { intensity: 54, bloom: 68, distortion: 24, grain: 12, color: 38 },
      energy: { intensity: 95, bloom: 92, distortion: 76, grain: 22, color: 84 },
      film: { intensity: 64, bloom: 42, distortion: 16, grain: 58, color: 56 }
    };
    Object.entries(presets[button.dataset.preset]).forEach(([key, value]) => updateControl(key, value));
    showToast(`${button.textContent.trim()} preset applied.`);
  });
});

document.getElementById('timeline').addEventListener('click', (event) => {
  const bounds = event.currentTarget.getBoundingClientRect();
  state.time = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration));
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !['INPUT', 'BUTTON'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    state.playing = !state.playing;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveProject();
  }
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('beforeunload', () => {
  if (state.mediaUrl) URL.revokeObjectURL(state.mediaUrl);
});

restoreProject();
resizeCanvas();
requestAnimationFrame(render);
