// ===== GLOBAL =====
let synth = window.speechSynthesis;
let history = JSON.parse(localStorage.getItem('audiobookHistory') || '[]');
let isDark = localStorage.getItem('darkMode') === 'true';

let boy1Voice, boy2Voice, girl1Voice, girl2Voice;

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  loadLanguages();
  loadVoices();
  loadHistory();
  updateSliders();

  const saved = localStorage.getItem('lastText');
  if (saved) document.getElementById('textInput').value = saved;

  document.getElementById('textInput').addEventListener('input', autoSave);
});

// ===== THEME =====
function toggleTheme(){
  isDark = !isDark;
  localStorage.setItem('darkMode', isDark);
  applyTheme();
}
function applyTheme(){ document.body.classList.toggle('dark', isDark); }

// ===== LANGUAGES =====
const languages = [
  {code:'hi-IN',name:'हिंदी (India)'},
  {code:'en-US',name:'English (US)'},
  {code:'en-GB',name:'English (UK)'},
  {code:'ta-IN',name:'தமிழ்'},
  {code:'te-IN',name:'తెలుగు'},
  {code:'mr-IN',name:'मराठी'},
  {code:'bn-IN',name:'বাংলা'},
  {code:'gu-IN',name:'ગુજરાતી'},
  {code:'kn-IN',name:'ಕನ್ನಡ'},
  {code:'ml-IN',name:'മലയാളം'},
  {code:'pa-IN',name:'ਪੰਜਾਬੀ'}
];

function loadLanguages(){
  const select = document.getElementById('language');
  languages.forEach(l=>{
    const opt=document.createElement('option');
    opt.value=l.code; opt.textContent=l.name;
    select.appendChild(opt);
  });
  select.value='hi-IN';
}

// ===== VOICES =====
function loadVoices(){
  const voices = synth.getVoices();
  const select = document.getElementById('voiceSelect');
  select.innerHTML = '<option value="">Auto Select</option>';
  voices.forEach((v,i)=>{
    const opt=document.createElement('option');
    opt.value=i;
    opt.textContent=`${v.name} (${v.lang})`;
    select.appendChild(opt);
  });
  initCharacterVoices();
}
synth.onvoiceschanged = loadVoices;

function initCharacterVoices(){
  const voices = synth.getVoices();
  boy1Voice = voices.find(v=>v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) || voices.find(v=>v.lang.startsWith('en'));
  boy2Voice = voices.find(v=>v!==boy1Voice && v.lang.startsWith('en')) || boy1Voice;
  girl1Voice = voices.find(v=>v.lang.startsWith('hi') && v.name.toLowerCase().includes('female')) || voices.find(v=>v.lang.startsWith('hi'));
  girl2Voice = voices.find(v=>v!==girl1Voice && v.lang.startsWith('hi')) || girl1Voice;
}

// ===== BASIC PLAY =====
function playAudio(){
  const text=document.getElementById('textInput').value;
  if(!text.trim()){alert('Text लिखो!'); return;}

  pauseAudio();

  const u=new SpeechSynthesisUtterance(text);
  const lang=document.getElementById('language').value;
  const voiceIndex=document.getElementById('voiceSelect').value;
  const voices=synth.getVoices();

  u.lang=lang;
  u.rate=parseFloat(document.getElementById('rate').value);
  u.pitch=parseFloat(document.getElementById('pitch').value);
  if(voiceIndex && voices[voiceIndex]) u.voice=voices[voiceIndex];

  u.onstart=()=>{
    document.getElementById('pauseBtn').disabled=false;
    document.getElementById('progressSection').style.display='block';
    saveToHistory(text);
  };
  u.onend=resetControls;
  u.onerror=resetControls;

  synth.speak(u);
}

function pauseAudio(){
  synth.cancel();
  resetControls();
}
function resetControls(){
  document.getElementById('pauseBtn').disabled=true;
  document.getElementById('progressSection').style.display='none';
  document.getElementById('progressFill').style.width='0%';
  document.getElementById('progressText').textContent='0%';
}

// ===== LONG TEXT CHUNKING =====
const MAX_CHARS_PER_CHUNK = 2500;
let longQueue = [];

function splitTextIntoChunks(text){
  const chunks=[]; let current='';
  const parts=text.split(/([.?!।…]s+)/);
  parts.forEach(p=>{
    if((current+p).length>MAX_CHARS_PER_CHUNK){
      if(current.trim()) chunks.push(current.trim());
      current=p;
    }else current+=p;
  });
  if(current.trim()) chunks.push(current.trim());
  return chunks;
}

function speakChunkQueue(lang, voice, rate, pitch){
  if(!longQueue.length){ resetControls(); return; }
  const t=longQueue.shift();
  const u=new SpeechSynthesisUtterance(t);
  if(voice){ u.voice=voice; u.lang=voice.lang; }
  else if(lang){ u.lang=lang; }
  u.rate=rate; u.pitch=pitch;

  u.onend=()=>{ speakChunkQueue(lang, voice, rate, pitch); };
  u.onerror=()=>{ speakChunkQueue(lang, voice, rate, pitch); };

  synth.speak(u);
}

function speakVeryLongText(fullText, lang, voice){
  synth.cancel();
  longQueue = splitTextIntoChunks(fullText);
  if(!longQueue.length) return;
  const rate=parseFloat(document.getElementById('rate').value);
  const pitch=parseFloat(document.getElementById('pitch').value);
  speakChunkQueue(lang, voice, rate, pitch);
}

function playLongText(){
  const text=document.getElementById('textInput').value;
  if(!text.trim()){alert('Text लिखो!'); return;}
  const lang=document.getElementById('language').value;
  const voiceIndex=document.getElementById('voiceSelect').value;
  const voices=synth.getVoices();
  const voice = voiceIndex ? voices[voiceIndex] : null;
  saveToHistory(text);
  speakVeryLongText(text, lang, voice);
}

// ===== MULTI‑CHARACTER DEMO =====
const dialogueLines=[
  {speaker:'boy1', text:'I built this little audiobook studio just for you.'},
  {speaker:'girl1', text:'मैंने ये कहानी सिर्फ तुम्हारे लिए लिखी है।'},
  {speaker:'boy2', text:'When you press play, it feels like my heart is speaking.'},
  {speaker:'girl2', text:'और जब तुम सुनते हो, मुझे लगता है मेरी रूह बोल रही है।'}
];

function speakWithVoice(text, voice){
  const u=new SpeechSynthesisUtterance(text);
  if(voice){u.voice=voice; u.lang=voice.lang;}
  u.rate=0.95; u.pitch=1;
  synth.speak(u);
}

function playDialogueDemo(){
  if(!synth.getVoices().length) loadVoices();
  synth.cancel();
  let delay=0;
  dialogueLines.forEach(line=>{
    const v =
      line.speaker==='boy1'?boy1Voice:
      line.speaker==='boy2'?boy2Voice:
      line.speaker==='girl1'?girl1Voice:girl2Voice;
    setTimeout(()=>speakWithVoice(line.text, v), delay);
    delay += line.text.length*120;
  });
}

// ===== DOWNLOAD (best effort) =====
let mediaRecorder, audioChunks=[];
async function downloadAudio(){
  const text=document.getElementById('textInput').value;
  if(!text.trim()){alert('Text लिखो!');return;}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    mediaRecorder=new MediaRecorder(stream,{mimeType:'audio/webm'});
    audioChunks=[];
    mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);
    mediaRecorder.onstop=()=>{
      const blob=new Blob(audioChunks,{type:'audio/webm'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download='audiobook.webm';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      stream.getTracks().forEach(t=>t.stop());
      alert('File download ho gayi (agar na chale to converter se MP3 banao).');
    };
    mediaRecorder.start();
    playAudio();
    setTimeout(()=>{ if(mediaRecorder.state==='recording') mediaRecorder.stop(); }, text.length*150);
  }catch(e){
    alert('Mic permission ya browser limitation ki wajah se record nahi ho raha.');
  }
}

// ===== UTIL =====
function clearText(){ document.getElementById('textInput').value=''; localStorage.removeItem('lastText'); }
function copyText(){ const t=document.getElementById('textInput').value; navigator.clipboard.writeText(t); }
function autoSave(){ localStorage.setItem('lastText', document.getElementById('textInput').value); }

function updateSliders(){
  document.getElementById('rate').oninput=function(){document.getElementById('rateValue').textContent=this.value+'x';};
  document.getElementById('pitch').oninput=function(){document.getElementById('pitchValue').textContent=this.value;};
}

function saveToHistory(text){
  const item={text:text.slice(0,100)+'...', time:new Date().toLocaleString('hi-IN')};
  history.unshift(item);
  if(history.length>5) history=history.slice(0,5);
  localStorage.setItem('audiobookHistory',JSON.stringify(history));
  loadHistory();
}
function loadHistory(){
  const box=document.getElementById('historyList'); box.innerHTML='';
  history.forEach(it=>{
    const d=document.createElement('div');
    d.className='history-item';
    d.innerHTML=`<strong>${it.text}</strong><br><small>${it.time}</small>`;
    d.onclick=()=>{ document.getElementById('textInput').value=it.text.replace('...',''); };
    box.appendChild(d);
  });
     }
