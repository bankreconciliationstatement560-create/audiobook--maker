// ====== LONG TEXT CHUNKING ======
const MAX_CHARS_PER_CHUNK = 2500;
let longQueue = [];

function splitTextIntoChunks(text) {
  const chunks = [];
  let current = '';
  const parts = text.split(/([.?!।…]s+)/);

  parts.forEach(p => {
    if ((current + p).length > MAX_CHARS_PER_CHUNK) {
      if (current.trim()) chunks.push(current.trim());
      current = p;
    } else {
      current += p;
    }
  });
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function speakChunkQueue(lang, voice, rate, pitch) {
  if (!longQueue.length) { resetControls(); return; }

  const t = longQueue.shift();
  const u = new SpeechSynthesisUtterance(t);
  if (voice) { u.voice = voice; u.lang = voice.lang; }
  else if (lang) { u.lang = lang; }
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

  const rate = parseFloat(document.getElementById('rate').value);
  const pitch = parseFloat(document.getElementById('pitch').value);
  speakChunkQueue(lang, voice, rate, pitch);
}

function playLongText() {
  const text = document.getElementById('textInput').value;
  if (!text.trim()) {
    alert('Text लिखो!');
    return;
  }

  const lang = document.getElementById('language').value;
  const voiceSelect = document.getElementById('voiceSelect').value;
  const voices = speechSynthesis.getVoices();
  const voice = voiceSelect ? voices[voiceSelect] : null;

  saveToHistory(text);
  speakVeryLongText(text, lang, voice);
}
