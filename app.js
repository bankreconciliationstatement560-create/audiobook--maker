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
  const dialogueLines = [
  // Chapter 2 - Forced Vows – Part I

  // Narrator
  { speaker: 'narrator', text: 'जो बारिश कभी नैना की कॉलेज वाली खिड़की के बाहर गुनगुनाया करती थी, वही आज उसके शादी के मंडप के ऊपर चेतावनी की तरह गरज रही थी।' },
  { speaker: 'narrator', text: 'लालटेन और फेरी लाइट्स चमक रही थीं, लेकिन हवा घुटन भरी थी—झूठी हँसी, अगरबत्ती के धुएँ और गेंदे के फूलों की तेज़ महक से भरी हुई।' },
  { speaker: 'narrator', text: 'गाँव वाले जिज्ञासा और मंज़ूरी से भरी मुस्कानों के साथ मंडप के चारों तरफ़ बैठे थे। उनकी नज़र में यह बस एक शाही शादी थी—उन्हें यह नहीं दिख रहा था कि एक लड़की को कर्ज़ चुकाने की तरह सौंपा जा रहा है।' },

  // Naina
  { speaker: 'naina', text: 'नैना अपनी रेशमी लहंगे में चुपचाप बैठी थी, लाल कपड़े पर सुनहरी कढ़ाई चमक रही थी, लेकिन उसकी धड़कनें शादी के ढोल से भी ज़्यादा तेज़ लग रही थीं।' },
  { speaker: 'naina', text: 'इतने भारी लिबास के नीचे उसे लगता था जैसे उसकी साँसें ही अटक गई हों। हर गहना उसे ज़ंजीर जैसा महसूस हो रहा था।' },

  // Mother
  { speaker: 'mother', text: 'वह पास झुककर बैठ गई और दुपट्टा ठीक करने लगी, जैसे सिर्फ़ कपड़ा उसकी बेटी की आँखों में छुपे डर को ढक सकता हो।' },
  { speaker: 'mother', text: 'मुस्कुराओ, बेटा। बहुत अच्छा रिश्ता है।' },

  // Naina again
  { speaker: 'naina', text: 'नैना ने कोशिश की, लेकिन उसके होंठ साथ नहीं दे रहे थे। उसकी नज़र बार‑बार फाटक की तरफ़ भागती, जहाँ से बस बारिश ही जवाब में गिरती नज़र आ रही थी।' },

  // Narrator + Raghav enters
  { speaker: 'narrator', text: 'फिर सुनाई दी उसकी आवाज़—राघव सिंह की।' },
  { speaker: 'narrator', text: 'वह वही सब कुछ था जिससे गाँव डरता था: अमीर, बेरहम और शोरगुल वाला। उसकी शेरवानी पर लगे सोने के बटन कैमरे की फ्लैश में चमक रहे थे।' },
  { speaker: 'narrator', text: 'जब उसने नैना की तरफ़ देखा, उसकी नज़र में अपनापन नहीं, मालिकाना हक़ था।' },

  // Raghav
  { speaker: 'raghav', text: 'परफेक्ट।' },

  // Narrator – rituals
  { speaker: 'narrator', text: 'पुजारी मंत्र पढ़ रहे थे, घंटियाँ बज रही थीं, और उसके भीतर कहीं, वह लड़की जो कभी कॉलेज की कैंटीन में हँसती थी, चुपचाप मर गई।' },
  { speaker: 'narrator', text: 'हर रस्म बस शोर में बदलती चली गई—कन्यादान, सिंदूर, मंगलसूत्र। उसके पिता के काँपते हाथों ने उसकी हथेली राघव की हथेली में रख दी।' },
  { speaker: 'narrator', text: 'उसकी पकड़ खुरदरी और सख़्त थी, जैसे सब कुछ यहीं ख़त्म हो गया हो।' },

  // Raghav line
  { speaker: 'raghav', text: 'हो गया। अब खाना खाते हैं।' },

  // Mansion
  { speaker: 'narrator', text: 'अगली ही शाम तक नैना राघव की हवेली में थी—संगमरमर की फ़र्श उसके धन के घमंड की तरह चमक रही थी। दीवारों से शराब और चुप्पी की मिली‑जुली गंध आ रही थी।' },
  { speaker: 'narrator', text: 'उसका कमरा फूलों से सजा एक पिंजरे जैसा लग रहा था। वह रेशम से ढकी पलंग के एक किनारे पर आकर बैठ गई और आईने में उस लड़की को घूरने लगी जिसे वह खुद पहचान नहीं पा रही थी।' },

  // Raghav enters room
  { speaker: 'narrator', text: 'तभी राघव अंदर आया, अब शेरवानी की जगह उस पर बेतकल्लुफ़ मगर घमंडी अंदाज़ चढ़ा हुआ था।' },

  // Room dialogue
  { speaker: 'naina', text: 'कृपया... मुझे बस थोड़ा आराम करना है।' },
  { speaker: 'raghav', text: 'आराम? शादी हो चुकी है। अब तुम्हें अपना रोल सीखने का वक़्त है।' },
  { speaker: 'narrator', text: 'वह उसके क़रीब आया, उसके शरीर से व्हिस्की और हुक्मरानी की गंध आ रही थी। नैना सहज ही पीछे हट गई, अपनी चांदी की चूड़ी पकड़कर—वही जो जीतू ने कॉलेज में उसके जन्मदिन पर दी थी।' },
  { speaker: 'naina', text: 'दूर रहिए…' },
  { speaker: 'raghav', text: 'अब तुम मेरी बीवी हो, कोई शहर की कॉलेज वाली लड़की नहीं। अपने पुराने ख़्वाब भूल जाओ।' },
  { speaker: 'narrator', text: 'उसकी पकड़ इतनी सख़्त हो गई कि चूड़ी चटक कर दो टुकड़ों में बँट गई। वह आवाज़ कमरे में ऐसे गूँजी जैसे बाहर की गरज हो।' },
  { speaker: 'narrator', text: 'उस रात उस हवेली ने पहली बार उसकी दबे हुए सिसकियों की आवाज़ पहचानना सीख लिया।' },

  // Abuse routine
  { speaker: 'narrator', text: 'दिन हफ्तों में बदल गए। उसकी क्रूरता अब तयशुदा पैटर्न बन गई। ऐसे निशान उभरने लगे जिन्हें कोई देख न सके। जब भी वह विरोध करती, बातें घूँसों में बदल जातीं।' },
  { speaker: 'narrator', text: 'उसने उसे पूरी तरह अलग‑थलग कर दिया—न फोन, न चिट्ठी, न बाहर की दुनिया।' },
  { speaker: 'narrator', text: 'कभी‑कभी वह सलाखों वाली खिड़की से बाहर झाँकती और बारिश में कागज़ की नावों के पीछे भागते गाँव के बच्चों को देखती। वही बारिश, जो कभी उसके लिए हँसी की निशानी थी, अब जैसे उसका मज़ाक उड़ा रही थी—बाहर आज़ादी, अंदर घुटी हुई ख़ामोशी।' },

  // Jeetu name
  { speaker: 'narrator', text: 'ऐसी ही एक रात, चमकती बिजली ने आईने में उसका चेहरा रोशन कर दिया।' },
  { speaker: 'naina', text: 'जीतू…' },

  // Promise
  { speaker: 'narrator', text: 'उसके आँसू तूफ़ान की बारिश में घुल गए। कहीं दूर, दिल्ली की नीयन रोशनी और शोर के बीच, शायद वह अनजाने में ही एक पल के लिए ठिठक गया—जैसे उसकी आवाज़ बारिश के सहारे वहाँ तक पहुँच गई हो।' },
  { speaker: 'naina', text: 'अगर ज़िंदगी कभी कोई दरवाज़ा खोले—चाहे बस एक दरार जितना—तो मैं उसे पार कर जाऊँगी। और इस बार, मैं सच में जिऊँगी।' }
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
