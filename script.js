// --- CONFIGURAÇÃO DE VÍDEOS E SONS ---
const groups = [
  {
    videoSrc: 'videos/video1.mov',
    sounds: [
      { name: 'Waves', src: 'sounds/beat1.mp3' },
      { name: 'Birds',  src: 'sounds/clap.mp3'      },
      { name: 'Wind',  src: 'sounds/kick.mp3'      }
    ]
  },
  {
    videoSrc: 'videos/video2.mp4',
    sounds: [
      { name: 'Trafic', src: 'sounds/loop1.mp3' },
      { name: 'Wind',  src: 'sounds/snare.mp3' },
      { name: 'Music',    src: 'sounds/hat.mp3'   }
    ]
  }
];

// --- ELEMENTOS DO DOM ---
const videoEl      = document.getElementById('video-element');
const canvas       = document.getElementById('video-canvas');
const ctx          = canvas.getContext('2d');
const soundList    = document.getElementById('sound-list');
const addBtn       = document.getElementById('add-sound-btn');
const addInput     = document.getElementById('add-sound-input');
const tracksPanel  = document.getElementById('tracks');

let activeTracks = [];

// Escolhe grupo aleatório
const group = groups[Math.floor(Math.random() * groups.length)];
videoEl.src = group.videoSrc;

// Constrói lista de sons para arrastar
function buildSoundItems() {
  soundList.innerHTML = '';
  group.sounds.forEach(s => {
    const div = document.createElement('div');
    div.classList.add('sound-item');
    div.draggable = true;
    div.dataset.src  = s.src;
    div.dataset.name = s.name;
    div.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="#333" d="M3 9v6h4l5 5V4L7 9H3z"/>
      </svg>
      <span>${s.name}</span>`;
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('audio-src',  s.src);
      e.dataTransfer.setData('audio-name', s.name);
    });
    soundList.appendChild(div);
  });
}

// Adicionar sons do user
addBtn.addEventListener('click', () => addInput.click());
addInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const name = file.name;
  group.sounds.push({ name, src: url });
  buildSoundItems();
});

// Drag & Drop no vídeo
const videoContainer = document.getElementById('video-container');
videoContainer.addEventListener('dragover', e => e.preventDefault());
videoContainer.addEventListener('drop', e => {
  e.preventDefault();
  const src  = e.dataTransfer.getData('audio-src');
  const name = e.dataTransfer.getData('audio-name');
  if (src && name) addTrack({ src, name });
});

// Adiciona uma nova trilha e sincroniza com o vídeo
function addTrack({ src, name }) {
  const audio = new Audio(src);
  audio.crossOrigin = "anonymous";
  audio.volume = 1;
  audio.playbackRate = 1;

  if (!videoEl.paused) {
    audio.currentTime = videoEl.currentTime;
    audio.play();
  }

  const onPlay  = () => { audio.currentTime = videoEl.currentTime; audio.play(); };
  const onPause = () => audio.pause();
  const onSeek  = () => { audio.currentTime = videoEl.currentTime; };

  videoEl.addEventListener('play', onPlay);
  videoEl.addEventListener('pause', onPause);
  videoEl.addEventListener('seeked', onSeek);

  // UI dos controles
  const div = document.createElement('div');
  div.classList.add('track');
  div.innerHTML = `
    <div class="track-info">
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path fill="#fff" d="M3 9v6h4l5 5V4L7 9H3z"/>
      </svg>
      <span>${name}</span>
    </div>
    <div class="sliders">
      <label>Vol. <input type="range" min="0" max="1" step="0.01" value="1" class="vol"></label>
      <label>Vel. <input type="range" min="0.5" max="2" step="0.1" value="1" class="spd"></label>
    </div>
    <button class="remove-btn">Remove</button>
  `;
  tracksPanel.appendChild(div);

  const volSlider = div.querySelector('.vol');
  const spdSlider = div.querySelector('.spd');
  volSlider.addEventListener('input', () => audio.volume = volSlider.value);
  spdSlider.addEventListener('input', () => audio.playbackRate = spdSlider.value);

  const removeBtn = div.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    audio.pause();
    videoEl.removeEventListener('play', onPlay);
    videoEl.removeEventListener('pause', onPause);
    videoEl.removeEventListener('seeked', onSeek);
    div.remove();
    activeTracks = activeTracks.filter(t => t.audio !== audio);
  });

  activeTracks.push({ audio, onPlay, onPause, onSeek });
}

// Desenha o vídeo no canvas em loop
videoEl.addEventListener('loadedmetadata', () => {
  canvas.width  = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  videoEl.play();
  drawLoop();
});
function drawLoop() {
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(drawLoop);
}

// --- BOTÃO RESTART ---
const restartBtn = document.getElementById('restart-btn');
restartBtn.addEventListener('click', () => {
  // volta o vídeo ao início e toca
  videoEl.currentTime = 0;
  videoEl.play();

  // para cada track ativa, reseta e toca em sincronia
  activeTracks.forEach(t => {
    t.audio.currentTime = 0;
    t.audio.play();
  });
});

// Inicializa
buildSoundItems();
