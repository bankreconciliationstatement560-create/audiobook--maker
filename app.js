// Global variables
let synth = window.speechSynthesis;
let currentUtterance = null;
let mediaRecorder = null;
let audioChunks = [];
let isDark = localStorage.getItem('darkMode') === 'true';
let history = JSON.parse(localStorage.getItem('audiobookHistory')) || [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    applyTheme();
    loadLanguages();
    loadVoices();
    loadHistory();
    updateSliders();
    
    // Auto-save text
    document.getElementById('textInput').addEventListener('input', autoSave);
});

// Theme toggle
function toggleTheme() {
    isDark = !isDark;
    localStorage.setItem('darkMode', isDark);
    applyTheme();
}

function applyTheme() {
    document.body.classList.toggle('dark', isDark);
}

// Languages list (100+ supported)
const languages = [
    {code: 'hi-IN', name: 'हिंदी (India)'},
    {code: 'en-US', name: 'English (US)'},
    {code: 'en-GB', name: 'English (UK)'},
    {code: 'ta-IN', name: 'तमिल'},
    {code: 'te-IN', name: 'తెలుగు'},
    {code: 'mr-IN', name: 'मराठी'},
    {code: 'bn-IN', name: 'বাংলা'},
    {code: 'gu-IN', name: 'ગુજરાતી'},
    {code: 'kn-IN', name: 'ಕನ್ನಡ'},
    {code: 'ml-IN', name: 'മലയാളം'},
    {code: 'pa-IN', name: 'ਪੰਜਾਬੀ'}
];

function loadLanguages() {
    const select = document.getElementById('language');
    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        select.appendChild(option);
    });
}

// Voices loader
function loadVoices() {
    const voices = synth.getVoices();
    const select = document.getElementById('voiceSelect');
    select.innerHTML = '<option value="">Auto Select (Male/Female)</option>';
    
    voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        select.appendChild(option);
    });
}

synth.onvoiceschanged = loadVoices;

// Play/Pause
function playAudio() {
    const text = document.getElementById('textInput').value;
    if (!text.trim()) return alert('कृपया text लिखें! 📝');
    
    pauseAudio();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = document.getElementById('language').value;
    const voiceIndex = document.getElementById('voiceSelect').value;
    const voices = synth.getVoices();
    
    utterance.lang = lang;
    utterance.rate = parseFloat(document.getElementById('rate').value);
    utterance.pitch = parseFloat(document.getElementById('pitch').value);
    
    if (voiceIndex && voices[voiceIndex]) {
        utterance.voice = voices[voiceIndex];
    }
    
    // Events
    utterance.onstart = () => {
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-flex';
        document.getElementById('progressSection').style.display = 'block';
        saveToHistory(text);
    };
    
    utterance.onend = () => {
        resetControls();
    };
    
    utterance.onerror = () => resetControls();
    
    currentUtterance = utterance;
    synth.speak(utterance);
}

function pauseAudio() {
    synth.cancel();
    resetControls();
}

function resetControls() {
    document.getElementById('playBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
}

// Download MP3
async function downloadAudio() {
    const text = document.getElementById('textInput').value;
    if (!text.trim()) return alert('Text लिखें पहले!');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunks = [];
        
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audiobook_${new Date().toISOString().slice(0,10)}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            stream.getTracks().forEach(track => track.stop());
            alert('✅ MP3 Downloaded! 🎉');
        };
        
        playAudio();
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        }, text.length * 150);
        
        mediaRecorder.start();
    } catch (err) {
        alert('Microphone permission दें या HTTPS पर चलाएं! 🔒');
    }
}

// Utility functions
function clearText() {
    document.getElementById('textInput').value = '';
    localStorage.removeItem('lastText');
}

function copyText() {
    const text = document.getElementById('textInput').value;
    navigator.clipboard.writeText(text).then(() => alert('Copied! 📋'));
}

function autoSave() {
    const text = document.getElementById('textInput').value;
    localStorage.setItem('lastText', text);
}

function updateSliders() {
    document.getElementById('rate').oninput = function() {
        document.getElementById('rateValue').textContent = this.value + 'x';
    };
    document.getElementById('pitch').oninput = function() {
        document.getElementById('pitchValue').textContent = this.value;
    };
}

function saveToHistory(text) {
    const item = { text: text.slice(0, 100) + '...', time: new Date().toLocaleString('hi-IN') };
    history.unshift(item);
    if (history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('audiobookHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<strong>${item.text}</strong><br><small>${item.time}</small>`;
        div.onclick = () => document.getElementById('textInput').value = item.text.replace('...', '');
        container.appendChild(div);
    });
}

// Load last text
if (localStorage.getItem('lastText')) {
    document.getElementById('textInput').value = localStorage.getItem('lastText');
let boy1Voice, boy2Voice, girl1Voice, girl2Voice;

function initCharacterVoices() {
  const voices = speechSynthesis.getVoices();
  // English boys
  boy1Voice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) || voices.find(v => v.lang.startsWith('en'));
  boy2Voice = voices.find(v => v !== boy1Voice && v.lang.startsWith('en')) || boy1Voice;

  // Hindi girls
  girl1Voice = voices.find(v => v.lang.startsWith('hi') && v.name.toLowerCase().includes('female')) || voices.find(v => v.lang.startsWith('hi'));
  girl2Voice = voices.find(v => v !== girl1Voice && v.lang.startsWith('hi')) || girl1Voice;
}

speechSynthesis.onvoiceschanged = initCharacterVoices;

function speakWithVoice(text, voice) {
  const u = new SpeechSynthesisUtterance(text);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  }
  u.rate = 0.95;
  u.pitch = 1;
  speechSynthesis.speak(u);
}

// Example dialogue – tum apna text daal sakte ho
const dialogueLines = [
  { speaker: 'boy1', text: 'I built this audiobook just for you.' },
  { speaker: 'girl1', text: 'मैंने ये कहानी सिर्फ तुम्हारे लिए लिखी है।' },
  { speaker: 'boy2', text: 'Even the silence between our lines feels like music.' },
  { speaker: 'girl2', text: 'जब तुम सुनते हो, मुझे लगता है मेरी रूह बोल रही है।' }
];

function playDialogue() {
  if (!speechSynthesis.getVoices().length) initCharacterVoices();
  speechSynthesis.cancel();

  let delay = 0;
  dialogueLines.forEach(line => {
    const voice =
      line.speaker === 'boy1' ? boy1Voice :
      line.speaker === 'boy2' ? boy2Voice :
      line.speaker === 'girl1' ? girl1Voice :
      girl2Voice;

    setTimeout(() => speakWithVoice(line.text, voice), delay);
    // approx 1s per 8 chars
    delay += line.text.length * 120;
  });
// --- Long text chunking settings ---
const MAX_CHARS_PER_CHUNK = 2500; // approx 2–3k characters ek baar [web:151]

function splitTextIntoChunks(text) {
  const chunks = [];
  let current = '';

  const sentences = text.split(/([.?!।…]s+)/); // English + Hindi sentence separators

  sentences.forEach(part => {
    if ((current + part).length > MAX_CHARS_PER_CHUNK) {
      if (current.trim().length) chunks.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  });

  if (current.trim().length) chunks.push(current.trim());
  return chunks;
}

let longQueue = [];
let longIsPlaying = false;

function speakChunkQueue(lang, voice, rate = 0.95, pitch = 1) {
  if (!longQueue.length) {
    longIsPlaying = false;
    return;
  }

  const text = longQueue.shift();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else if (lang) {
    u.lang = lang;
  }
  u.rate = rate;
  u.pitch = pitch;

  u.onend = () => {
    speakChunkQueue(lang, voice, rate, pitch);
  };

  u.onerror = () => {
    speakChunkQueue(lang, voice, rate, pitch);
  };

  speechSynthesis.speak(u);
}

function speakVeryLongText(fullText, lang, voice) {
  speechSynthesis.cancel();
  longQueue = splitTextIntoChunks(fullText);
  if (!longQueue.length) return;
  longIsPlaying = true;
  speakChunkQueue(lang, voice);
function playLongText() {
  const text = document.getElementById('textInput').value;
  if (!text.trim()) {
    alert('Text likho pehle!');
    return;
  }

  const lang = document.getElementById('language').value;
  const voiceSelect = document.getElementById('voiceSelect').value;
  const voices = speechSynthesis.getVoices();
  const voice = voiceSelect ? voices[voiceSelect] : null;

  speakVeryLongText(text, lang, voice);
}
