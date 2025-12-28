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
}
