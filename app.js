(()=>{
'use strict';
const $=id=>document.getElementById(id), E=CipherLab, content=LAB_CONTENT;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={caesar:'Caesar',atbash:'Atbash',a1z26:'A1Z26',vigenere:'Vigenère',bill:'Bill Cipher'};
const order=Object.keys(names), start=[];let total=0;content.vi.chapters.forEach(c=>{start.push(total);total+=c.duration;});
const state={lang:'vi',scene:0,time:0,playing:false,speed:1,voice:false,fx:true,cc:true,alg:'caesar',decrypt:false,key:3,word:'BILL',pos:0,phase:0,result:null,traceRunning:false,attack:'brute',attackText:'KLGH WKH NHB',picked:null,freqText:'THE MYSTERY IS NOT IN THE SHAPE OF THE SYMBOLS. THE SAME LETTER ALWAYS MAKES THE SAME SYMBOL. COUNT THE LETTERS AND THE PATTERN WILL APPEAR.',freqType:'bill',kasiskiText:'OPK WWEC IYO PKW IRG',tamperText:'MEET AT THE SHACK',tampered:false,tamperCipher:'',answers:['','',''],feedback:['','',''],hints:[false,false,false],dialogKind:'help'};
const texts={caesar:'WELCOME TO GRAVITY FALLS',atbash:'STAY WEIRD',a1z26:'HI BILL',vigenere:'ATTACK AT DAWN',bill:'TRUST NO ONE'};
const edits={};let traceTimer=null,worker=null,workerURL=null,workerTimer=null,toastTimer,lastCaption='',audioContext=null;
const t=k=>content[state.lang][k]||k;
const chapter=()=>content[state.lang].chapters[state.scene];
const glyph=s=>Array.from(String(s),c=>E.billIndex(c)>=0?`<span class="bill" aria-label="${escape(E.A[E.billIndex(c)])}">${escape(c)}</span>`:escape(c)).join('');
const fmtTime=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function typeset(){document.querySelectorAll('[data-math]').forEach(el=>{if(window.katex){try{katex.render(el.dataset.math,el,{throwOnError:false});}catch{el.textContent=el.dataset.fallback||'';}}else el.textContent=el.dataset.fallback||'';});}
function math(tex,fallback){return `<span class="math-formula" data-math="${escape(tex)}" data-fallback="${escape(fallback||'')}"></span>`;}
function chime(kind='scene'){
  if(!state.fx)return;try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);const now=audioContext.currentTime;o.type=kind==='error'?'sawtooth':kind==='packet'?'sine':'triangle';o.frequency.setValueAtTime(kind==='error'?320:kind==='packet'?680:480,now);if(kind==='packet')o.frequency.linearRampToValueAtTime(880,now+.18);g.gain.setValueAtTime(.025,now);g.gain.exponentialRampToValueAtTime(.0001,now+.16);o.start(now);o.stop(now+.18);}catch{}
}
function speak(text){
  if(!state.voice||!state.playing||!('speechSynthesis'in window))return;
  speechSynthesis.cancel();let voices=speechSynthesis.getVoices();let voice=voices.find(v=>state.lang==='vi'?/^vi(-|$)/i.test(v.lang):/^en-(US|GB)$/i.test(v.lang))||voices.find(v=>state.lang==='en'&&/^en(-|$)/i.test(v.lang));
  if(!voice){state.voice=false;syncHeader();toast(t('voiceMissing'));return;}
  const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=state.lang==='vi'?'vi-VN':'en-US';utterance.rate=state.speed;speechSynthesis.speak(utterance);
}
function syncHeader(){
  document.documentElement.lang=state.lang;
  $('credits-label').textContent=state.lang==='vi'?'NGƯỜI THỰC HIỆN':'CREATED BY';
  ['lab-label','course-title','course-meta','footer-note','sources-btn','close-dialog'].forEach((id,i)=>$(id).textContent=t(['labLabel','courseTitle','courseMeta','footer','sources','close'][i]));
  document.querySelectorAll('[data-action=language]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===state.lang));
  $('voice-btn').setAttribute('aria-pressed',state.voice);$('voice-btn').title=t('voice');$('voice-btn').setAttribute('aria-label',t('voice'));$('help-btn').title=t('help');$('help-btn').setAttribute('aria-label',t('help'));
  $('scrubber').max=total;$('scrubber').setAttribute('aria-label',t('timeline'));$('speed').setAttribute('aria-label',t('speed'));$('fs-btn').setAttribute('aria-label',t('fullscreen'));$('cc-btn').setAttribute('aria-label',t('captions'));$('cc-btn').setAttribute('aria-pressed',state.cc);$('subtitles-container').hidden=!state.cc;
  $('chapters-chips-bar').innerHTML=content[state.lang].chapters.map((c,i)=>`<button data-action="chapter" data-index="${i}" class="${i===state.scene?'current':''}" aria-current="${i===state.scene?'step':'false'}"><span>${String(i+1).padStart(2,'0')}</span>${escape(c.title)}</button>`).join('');
  $('timeline-marks').innerHTML=start.slice(1).map(n=>`<i class="timeline-mark" style="left:${n/total*100}%"></i>`).join('');
  $('study-cards').innerHTML=[1,2,3].map(i=>`<article class="study-card"><small>${String(i).padStart(2,'0')} / ${state.lang==='vi'?'GHI NHỚ':'TAKEAWAY'}</small><h3>${escape(t('summary'+i))}</h3><p>${escape(t('summaryText'+i))}</p></article>`).join('');
  $('chapters-chips-bar').setAttribute('aria-label',state.lang==='vi'?'Các phân cảnh':'Lesson scenes');
}
function syncMedia(force=false){
  $('scrubber').value=state.time;$('time-code').textContent=`${fmtTime(state.time)} / ${fmtTime(total)}`;$('current-chapter').textContent=chapter().title;$('scene-counter-badge').textContent=`${t('lesson')} ${state.scene+1} / 9`;
  $('play-btn').textContent=state.playing?'Ⅱ':'▶';$('play-btn').setAttribute('aria-label',t(state.playing?'pause':'play'));
  let c=chapter(),offset=state.time-start[state.scene],seg=Math.min(c.script.length-1,Math.floor(offset/c.duration*c.script.length));let line=c.script[Math.max(0,seg)];$('live-subtitle-text').textContent=line;
  let signature=state.lang+state.scene+seg;if(force||signature!==lastCaption){lastCaption=signature;speak(line);}
}
function stopTrace(){clearInterval(traceTimer);traceTimer=null;state.traceRunning=false;let b=$('trace-auto');if(b)b.textContent=t('auto');}
function heading(){let c=chapter();return `<div class="scene-heading"><div><span class="kicker">${t('file')} ${String(state.scene+1).padStart(2,'0')} / ${state.scene===7?t('attackStamp'):t('interactive')}</span><h1>${escape(c.heading)}</h1><p>${escape(c.desc)}</p></div><span class="scene-stamp">${state.scene===7?(state.lang==='vi'?'03 THÍ NGHIỆM':'03 EXPERIMENTS'):String(state.scene+1).padStart(2,'0')+' / 09'}</span></div>`;}
function renderScene(){stopTrace();$('stage-screen').innerHTML=heading()+(state.scene===7?renderAttack():state.scene===8?renderChallenge():renderStudio());if(state.scene<7)updateStudio();if(state.scene===7)updateAttack();typeset();syncMedia();}
function goTo(i,reset=true){
  if(i<0||i>8)return;stopTrace();state.scene=i;if(reset)state.time=start[i];
  if(i<6&&state.decrypt){if(state.result)texts[state.alg]=state.result.output;else texts[state.alg]={caesar:'WELCOME TO GRAVITY FALLS',atbash:'STAY WEIRD',a1z26:'HI BILL',vigenere:'ATTACK AT DAWN',bill:'TRUST NO ONE'}[state.alg];}
  if(i<6){state.alg=['caesar','caesar','atbash','a1z26','vigenere','bill'][i];state.decrypt=false;state.pos=state.phase=0;state.key=3;state.word='BILL';}
  renderScene();syncHeader();chime();
}
function renderStudio(){
  let a=state.alg,plain=!state.decrypt;
  let select=state.scene===6?`<label>${t('algorithm')}</label><select id="algorithm-select">${order.map(k=>`<option value="${k}" ${k===a?'selected':''}>${names[k]}</option>`).join('')}</select>`:'';
  let keyInput=a==='caesar'?`<label for="key-input">${t('shift')}</label><input id="key-input" type="number" value="${escape(state.key)}" min="-9999" max="9999" step="1">`:a==='vigenere'?`<label for="key-input">${t('keyword')}</label><input id="key-input" type="text" value="${escape(state.word)}" maxlength="40" spellcheck="false">`:`<span class="helper">${t('fixed')}</span>`;
  return `<div class="workspace"><div class="panel"><div class="panel-head"><label for="message-input" class="${plain?'plain-label':'cipher-label'}">${t(plain?'inputPlain':'inputCipher')} ${math(plain?'P':'C',plain?'P':'C')}</label><div class="segmented"><button data-action="direction" data-decrypt="false" class="${plain?'selected':''}">${t('encode')}</button><button data-action="direction" data-decrypt="true" class="${!plain?'selected':''}">${t('decode')}</button></div></div>
  <textarea id="message-input" maxlength="500" spellcheck="false" class="${a==='bill'&&!plain?'bill-input':''}">${escape(texts[a])}</textarea><div class="input-group">${select}${keyInput}</div>
  <div class="panel-head"><span class="${plain?'cipher-label':'plain-label'}">${t(plain?'outputCipher':'outputPlain')} ${math(plain?'C':'P',plain?'C':'P')}</span><span class="chip">${t('live')}</span></div><div class="output-box ${!plain?'plain':''}" id="cipher-output" tabindex="0"></div><p class="error" id="input-error" role="status"></p><p class="helper">${t(a==='a1z26'?'numberConvention':a==='bill'&&!plain?'symbolConvention':'convention')}</p>
  <div class="studio-actions"><button data-action="sample">${t('sample')}</button><button data-action="copy">${t('copy')}</button></div>
  <div class="formula-strip"><span>${t('formula')}</span><span id="formula"></span></div><div id="mapping-board"></div><p class="helper" id="roundtrip"></p></div>
  <div class="panel"><div class="panel-head"><span>${t('traceTitle')}</span><span class="chip">${names[a]}</span></div><p class="helper" style="margin:0 0 11px">${t('traceSub')}</p><div class="trace-controls"><div class="buttons"><button data-action="trace-back" title="${t('back')}" aria-label="${t('back')}">‹</button><button data-action="trace-next" class="primary">${t('step')}</button><button data-action="trace-auto" id="trace-auto">${t('auto')}</button><button data-action="trace-reset" title="${t('reset')}" aria-label="${t('reset')}">↺</button></div><span class="counter" id="trace-counter"></span></div><div class="trace-tokens" id="trace-tokens"></div><div class="trace-equation" id="trace-equation"></div><div class="pseudocode" id="pseudocode"></div><p class="helper">${t(a==='a1z26'?'numberNote':'indexNote')}</p>
  <details class="source-details" id="source-details"><summary>${t('source')}</summary><textarea class="source-editor" id="source-editor" spellcheck="false" aria-label="JavaScript">${escape(edits[a]||LAB_SOURCES[a])}</textarea><p class="helper">${t('runnerHelp')}</p><div class="studio-actions"><button class="primary" data-action="run-code">${t('run')}</button><button data-action="download-code">${t('download')}</button><button data-action="restore-code">${t('restore')}</button></div><div class="runner-output" id="runner-output" role="status" hidden></div></details></div></div>
  ${state.scene===0?`<div class="intro-list">${order.map((k,i)=>`<button class="method-card ${k===a?'selected':''}" data-action="chapter" data-index="${i+1}"><b>${names[k]}</b><small>${t(['methodCaesar','methodAtbash','methodNumbers','methodVigenere','methodBill'][i])}</small></button>`).join('')}</div>`:''}
  ${a==='bill'?`<div class="notice">${t('symbolNote')}</div>`:''}`;
}
function updateStudio(){
  if(!$('message-input'))return;
  let a=state.alg,plain=!state.decrypt,text=$('message-input').value;const key=a==='vigenere'?state.word:state.key;
  try{state.result=E.transform(text,a,key,state.decrypt);$('cipher-output').innerHTML=state.result.output?glyph(state.result.output):`<span class="helper">${t('empty')}</span>`;$('input-error').textContent='';
    let back=E.transform(state.result.output,a,key,!state.decrypt).output;let match=back===state.result.input;
    $('roundtrip').textContent=!state.decrypt&&match&&text?`${t('roundTrip')}: ${t('roundTripOK')}`:'';
  }catch(e){state.result=null;$('cipher-output').textContent='';$('input-error').textContent=t(e.code||e.message);$('roundtrip').textContent='';}
  let tex=a==='caesar'?`C=(P+k)\\bmod 26`:a==='atbash'?`C=25-P`:a==='a1z26'?`n=P+1`:a==='vigenere'?`C_i=(P_i+K_{i\\bmod m})\\bmod 26`:`C=S(P)`;
  if(!plain)tex=a==='caesar'?`P=(C-k)\\bmod 26`:a==='atbash'?`P=25-C`:a==='a1z26'?`P=n-1`:a==='vigenere'?`P_i=(C_i-K_{i\\bmod m})\\bmod 26`:`P=S^{-1}(C)`;
  $('formula').innerHTML=math(tex,a==='atbash'?'C = 25 − P':'');updateTrace();typeset();
}
function pseudo(){
  const a=state.alg,d=state.decrypt;let last=d?'P':'C';
  let vi=state.lang==='vi', lines=[vi?'Đọc ký tự kế tiếp x':'Read the next character x',vi?'Nếu là khoảng trắng/dấu câu: giữ nguyên':'If whitespace/punctuation: preserve it'];
  if(a==='a1z26')return lines.concat([d?'n ← Number(x)':'p ← index(A–Z, x)',d?'assert 1 ≤ n ≤ 26':'n ← p + 1',d?'y ← alphabet[n − 1]':'y ← String(n)',vi?'Nối y; thêm dấu phân cách khi cần':'Append y; insert separators as needed']);
  if(a==='bill')return lines.concat([d?'i ← symbolIndex(x)':'i ← index(A–Z, x)',d?'assert 0 ≤ i < 26':'S ← symbolTable',d?'y ← alphabet[i]':'y ← S[i]',vi?'Nối y vào kết quả':'Append y to the result']);
  return lines.concat(['p ← index(A–Z, x)',a==='vigenere'?'k ← index(A–Z, key[j mod m])':a==='caesar'?'k ← key mod 26':'end ← 25',a==='atbash'?'c ← end − p':`c ← (p ${d?'−':'+'} k) mod 26`,a==='vigenere'?'append alphabet[c]; j ← j + 1':'append alphabet[c]']);
}
function updateTrace(){
  const r=state.result,a=state.alg;let len=r?.trace.length||0;state.pos=Math.max(0,Math.min(state.pos,len-1));const x=r?.trace[state.pos];
  $('trace-counter').textContent=`${t('stepCount')} ${len?state.pos+1:0}/${len} · ${state.phase+1}/6`;
  $('trace-tokens').innerHTML=(r?.trace||[]).map((v,i)=>`<button class="token ${i===state.pos?'active':''}" data-action="trace-select" data-index="${i}" aria-label="${t('stepCount')} ${i+1}">${glyph(v.input===' '?'␣':v.input)}</button>`).join('');
  const p=pseudo();$('pseudocode').innerHTML=p.map((s,i)=>`<div class="code-line ${i===state.phase?'active':''}"><span>${i+1}</span>${escape(s)}</div>`).join('');
  let explanation=t('empty');
  if(x){if(x.skip)explanation=`<strong>${t('skip')}</strong>`;else{
    let calc=a==='atbash'?`25 − ${x.p} = ${x.c}`:a==='caesar'||a==='vigenere'?`(${x.p} ${state.decrypt?'−':'+'} ${x.key}) mod 26 = ${x.c}`:a==='a1z26'?state.decrypt?`${x.p} − 1 = ${x.c}`:`${x.p} + 1 = ${x.c}`:`S${state.decrypt?'⁻¹':''}(${E.A[x.p]})`;
    explanation=`<strong>${glyph(x.input)} ${state.phase>=4?'→ '+glyph(x.output):'→ ?'}</strong><small>${state.phase>=4?escape(calc):t('indexNote')}${a==='vigenere'?` · ${t('keyPos')} ${x.keyPos+1}/${state.word.length}: ${escape(x.keyLetter)} (${x.key})`:''}</small>`;
  }}$('trace-equation').innerHTML=explanation;
  let board='';if(a==='bill')board=`<div class="symbol-grid">${Array.from(E.A,(letter,i)=>`<button data-action="symbol" data-index="${i}" class="${x&&!x.skip&&x.p===i?'active':''}" title="${letter} · ${t('symbolKey')}"><span class="bill">${E.billChar(i)}</span><small>${letter}</small></button>`).join('')}</div>`;
  else board=`<div class="alphabet">${Array.from(E.A,(letter,i)=>{let k=x?.key??(a==='vigenere'?E.A.indexOf(state.word.toUpperCase()[0]||'A'):Number(state.key)||0);let n=a==='atbash'?25-i:a==='a1z26'?i+1:E.mod(i+(state.decrypt?-1:1)*k,26);let active=x&&!x.skip&&(a==='a1z26'&&state.decrypt?x.p-1:x.p)===i;return `<div class="letter-pair ${active?'active':''}">${a==='a1z26'&&state.decrypt?n:letter}<b>${a==='a1z26'?(state.decrypt?letter:n):E.A[n]}</b></div>`;}).join('')}</div>`;
  $('mapping-board').innerHTML=board;
}
function nextStep(delta=1){if(!state.result?.trace.length)return;let max=state.result.trace.length*6-1,n=state.pos*6+state.phase+delta;if(delta>0&&state.result.trace[state.pos]?.skip&&state.phase>=1){if(state.pos===state.result.trace.length-1){stopTrace();return;}n=(state.pos+1)*6;}n=Math.min(max,Math.max(0,n));state.pos=Math.floor(n/6);state.phase=n%6;updateTrace();if(n===max)stopTrace();}
function setDirection(d){if(d===state.decrypt)return;stopTrace();if(state.result)texts[state.alg]=state.result.output;state.decrypt=d;state.pos=state.phase=0;renderScene();}
function changeLanguage(lang){if(state.lang===lang)return;stopTrace();if('speechSynthesis'in window)speechSynthesis.cancel();state.lang=lang;syncHeader();renderScene();syncMedia(true);if($('help-dialog').open)showDialog(state.dialogKind,true);}
function seek(time){state.time=Math.max(0,Math.min(total,time));let i=start.findLastIndex(n=>n<=state.time);if(i!==state.scene)goTo(i,false);syncMedia(true);}
function playPause(){state.playing=!state.playing;if(state.playing&&state.time>=total)seek(0);if(!state.playing&&'speechSynthesis'in window)speechSynthesis.cancel();syncMedia(true);}
function runCode(){
  if(!window.Worker){toast(t('runUnsupported'));return;}
  if(worker)worker.terminate();clearTimeout(workerTimer);if(workerURL)URL.revokeObjectURL(workerURL);
  let a=state.alg,source=$('source-editor').value;edits[a]=source;let input=$('message-input').value,key=a==='vigenere'?state.word:state.key,d=state.decrypt,expected;
  try{expected=E.transform(input,a,key,d).output;}catch{}
  const out=$('runner-output');out.hidden=false;out.textContent=t('running');
  let code=source+'\ntry { const result = transform('+JSON.stringify(input)+','+JSON.stringify(key)+','+JSON.stringify(d)+'); postMessage({ok:true,output:String(result)}); } catch(e) { postMessage({ok:false,error:String(e.message||e)}); }';
  try{workerURL=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));worker=new Worker(workerURL);worker.onmessage=e=>{clearTimeout(workerTimer);if(e.data.ok){out.innerHTML=`${escape(t('runResult'))}: ${glyph(e.data.output)}\n\n${escape(t(e.data.output===expected?'runPass':'runDiff'))}`;}else out.textContent=t('runError')+': '+t(e.data.error);worker.terminate();URL.revokeObjectURL(workerURL);worker=null;};worker.onerror=e=>{clearTimeout(workerTimer);out.textContent=t('runError')+': '+e.message;worker.terminate();worker=null;URL.revokeObjectURL(workerURL);};workerTimer=setTimeout(()=>{worker?.terminate();worker=null;URL.revokeObjectURL(workerURL);out.textContent=t('runTimeout');},1500);}catch(e){out.textContent=t('runError')+': '+e.message;}
}
function showDialog(kind,alreadyOpen=false){
  state.dialogKind=kind;let html=kind==='help'?`<h2>${t('helpTitle')}</h2><p>${t('helpText')}</p><p>${t('helpShortcuts')}</p><p>${t('helpVoice')}</p><p>${t('helpAudio')}</p><button data-action="fx">${t(state.fx?'fxOn':'fxOff')}</button>`:`<h2>${t('sourcesTitle')}</h2><p>${t('sourcesIntro')}</p><ul class="sources-list"><li><a target="_blank" rel="noopener noreferrer" href="https://books.disney.com/book/gravity-falls-dipper-and-mabels-guide-to-mystery-and-nonstop-fun/">${t('sourceDisney')}</a><p>${t('sourceDisneyDesc')}</p></li><li><a target="_blank" rel="noopener noreferrer" href="https://www.cs.rutgers.edu/courses/419/classes/spring_2010_ganapathy/slides/lec2.pdf">${t('sourceRutgers')}</a><p>${t('sourceRutgersDesc')}</p></li><li><a target="_blank" rel="noopener noreferrer" href="https://www.dafont.com/bill-s-cipher.font">${t('sourceFont')}</a><p>${t('sourceFontDesc')}</p></li></ul><p>${t('sourcesConventions')}</p><p>${t('sourcesAudio')}</p>`;
  $('help-content').innerHTML=html;if(!alreadyOpen)$('help-dialog').showModal();
}
// Attack and exercise panels are below; they share the same verified engine.
function renderAttack(){return attackPanel();}
function renderChallenge(){return challengePanel();}
function updateAttack(){refreshAttack();}
function attackPanel(){
  let tabs=`<div class="attack-tabs">${['brute','freq','tamper'].map(k=>`<button class="${state.attack===k?'selected':''}" data-action="attack-tab" data-tab="${k}">${t(k)}</button>`).join('')}</div>`;
  if(state.attack==='brute')return tabs+`<div class="attack-grid"><div class="panel"><span class="kicker">CAESAR / 26</span><h2>${t('bruteTitle')}</h2><p class="helper">${t('bruteText')}</p><label class="field-label" for="attack-input" style="margin-top:20px">${t('attackInput')}</label><textarea id="attack-input" maxlength="500" spellcheck="false">${escape(state.attackText)}</textarea><div class="studio-actions"><button class="primary" data-action="brute-run">${t('attackRun')}</button><button data-action="attack-sample">${t('loadAttack')}</button></div><p class="error" id="attack-error"></p><p class="helper">${t('pick')}</p><div id="selected-candidate" class="output-box plain" style="margin-top:15px" hidden></div><div class="math-row">${math('|\\mathcal{K}|=26','26')}</div></div><div class="panel"><div class="panel-head"><h3>${t('candidate')}</h3><span class="chip">k = 0 … 25</span></div><div id="brute-results" class="result-table"></div></div></div>`;
  if(state.attack==='freq')return tabs+`<div class="attack-grid"><div class="panel"><h2>${t('freqTitle')}</h2><p class="helper">${t('freqText')}</p><label class="field-label" for="freq-input" style="margin-top:16px">${t('freqInput')}</label><textarea id="freq-input" maxlength="1000" spellcheck="false">${escape(state.freqText)}</textarea><div class="input-group"><select id="freq-select" aria-label="${t('algorithm')}"><option value="bill" ${state.freqType==='bill'?'selected':''}>${t('freqBill')}</option><option value="caesar" ${state.freqType==='caesar'?'selected':''}>${t('freqCaesar')}</option></select><button class="primary" data-action="freq-run">${t('freqAnalyze')}</button></div><div id="freq-cipher" class="output-box"></div><p class="error" id="attack-error"></p></div><div class="panel"><div class="panel-head"><h3>${t('freq')}</h3><span class="chip">A–Z / 26</span></div><div id="freq-chart" class="chart" role="img" aria-label="${t('freq')}"></div><div id="freq-stats" class="stats"></div><details class="source-details" open><summary>${t('kasiskiTitle')}</summary><p class="helper">${t('kasiskiText')}</p><textarea id="kasiski-input" maxlength="500" spellcheck="false" style="margin-top:10px">${escape(state.kasiskiText)}</textarea><button data-action="kasiski-run" style="margin:10px 0">${t('kasiskiRun')}</button><div id="kasiski-results" class="result-table" style="max-height:180px"></div></details></div></div>`;
  return tabs+`<div class="attack-grid"><div class="panel"><h2>${t('tamperTitle')}</h2><p class="helper">${t('tamperText')}</p><label for="tamper-input" class="field-label" style="margin-top:18px">${t('inputPlain')}</label><textarea id="tamper-input" maxlength="150" spellcheck="false">${escape(state.tamperText)}</textarea><p class="helper">Caesar · k = 3</p><div class="studio-actions"><button class="primary" data-action="packet-send">${t('send')}</button><button data-action="packet-flip">${t('flip')}</button></div><p class="error" id="attack-error"></p><div class="notice">${t('tamperHint')}</div></div><div class="panel"><div class="panel-head"><h3>${t('inputCipher')}</h3><span class="chip attack-tag">${t('eve')}</span></div><div class="output-box" id="packet-cipher"></div><div class="packet-stream" id="packet-stream"><span id="packet-badge" hidden>C</span></div><div class="packet-row"><div class="packet-card"><small>${t('sender')}</small><p id="alice-text"></p></div><div class="packet-arrow" aria-hidden="true">→</div><div class="packet-card"><small>${t('receiver')}</small><p id="bob-text"></p></div></div><p class="notice" id="tamper-status"></p></div></div>`;
}
function refreshAttack(){
  let err=$('attack-error');if(!err)return;err.textContent='';
  try{
    if(state.attack==='brute'){
      const results=E.bruteForce(state.attackText);$('brute-results').innerHTML=`<table><thead><tr><th>${t('key')}</th><th>${t('candidate')}</th></tr></thead><tbody>${results.map(r=>`<tr data-action="pick-key" data-key="${r.key}" tabindex="0" role="button" aria-label="${t('key')} ${r.key}: ${escape(r.text)}" class="${state.picked===r.key?'picked':''}"><td>${String(r.key).padStart(2,'0')}</td><td>${escape(r.text)}</td></tr>`).join('')}</tbody></table>`;
      $('selected-candidate').hidden=state.picked===null;if(state.picked!==null)$('selected-candidate').textContent=t('candidatePicked')+':\n'+results[state.picked].text;
    }else if(state.attack==='freq'){
      let cipher=E.transform(state.freqText,state.freqType,3).output;let f=E.frequencies(cipher,state.freqType);$('freq-cipher').innerHTML=glyph(cipher);let max=Math.max(1,...f.counts);
      $('freq-chart').innerHTML=f.counts.map((n,i)=>`<div class="bar-column" title="${E.A[i]}: ${n} (${f.percent[i].toFixed(1)}%)"><span class="bar-count">${n}</span><span class="bar-fill" style="height:${n/max*145}px"></span><span class="bar-label">${state.freqType==='bill'?glyph(E.billChar(i)):E.A[i]}</span></div>`).join('');
      $('freq-chart').setAttribute('aria-label',t('freq')+': '+f.counts.map((n,i)=>E.A[i]+' '+n).join(', '));let biggest=f.total?E.A[f.counts.indexOf(Math.max(...f.counts))]:'—';$('freq-stats').innerHTML=`<span>${t('letters')}: <strong>${f.total}</strong></span><span>${t('most')}: <strong>${biggest}</strong></span>`;refreshKasiski();
    }else{
      if(!state.tamperCipher){let sent=E.transform(state.tamperText,'caesar',3);state.tamperCipher=sent.output;state.sentPlain=sent.input;}
      $('packet-cipher').textContent=state.tamperCipher;$('alice-text').textContent=state.sentPlain;$('bob-text').textContent=E.transform(state.tamperCipher,'caesar',3,true).output;$('tamper-status').textContent=t(state.tampered?'changed':'untouched');
      $('tamper-status').classList.toggle('tamper-warning',state.tampered);
    }
  }catch(e){err.textContent=t(e.code||e.message);if($('brute-results'))$('brute-results').innerHTML='';if($('freq-chart'))$('freq-chart').innerHTML='';}
}
function refreshKasiski(){
  try{let rows=E.kasiski(state.kasiskiText);$('kasiski-results').innerHTML=rows.length?`<table><thead><tr><th>${t('gram')}</th><th>${t('distance')}</th><th>${t('factors')}</th></tr></thead><tbody>${rows.slice(0,20).map(r=>`<tr><td>${r.gram}</td><td>${r.distance}</td><td>${r.factors.join(', ')}</td></tr>`).join('')}</tbody></table>`:`<p class="helper" style="padding:10px">${t('noRepeat')}</p>`;}catch(e){$('kasiski-results').textContent=t(e.code||e.message);}
}
const challenges=[{alg:'caesar',key:3,plain:'HIDE THE KEY'},{alg:'atbash',key:0,plain:'STAY WEIRD'},{alg:'vigenere',key:'BILL',plain:'TRUST NO ONE'}];
function challengePanel(){return `<div class="challenge-list">${challenges.map((c,i)=>`<article class="panel"><span class="kicker">0${i+1} / ${names[c.alg].toUpperCase()}</span><h3>${t('challenge')}</h3><div class="output-box">${escape(E.transform(c.plain,c.alg,c.key).output)}</div><p class="helper">${c.alg==='caesar'?'k = 3':c.alg==='vigenere'?'K = BILL':'A ↔ Z'}</p><label class="field-label" for="answer-${i}">${t('answer')}</label><input id="answer-${i}" data-answer="${i}" value="${escape(state.answers[i])}" maxlength="100" spellcheck="false"><div class="studio-actions"><button class="primary" data-action="check-answer" data-index="${i}">${t('check')}</button><button data-action="hint" data-index="${i}">${t('hint')}</button></div><small id="feedback-${i}" role="status">${state.feedback[i]?t(state.feedback[i]):''}</small><small id="hint-${i}" ${state.hints[i]?'':'hidden'}>${t('challengeHint'+(i+1))}</small></article>`).join('')}</div><div class="notice" style="margin-top:24px">${t('summaryText3')}</div><div class="math-row">${math('P=D_K(E_K(P))','')}</div>`;}
function handleLabAction(action,b){
  if(action==='attack-tab'){state.attack=b.dataset.tab;renderScene();}
  else if(action==='brute-run'||action==='freq-run')refreshAttack();
  else if(action==='attack-sample'){state.attackText='KLGH WKH NHB';state.picked=null;$('attack-input').value=state.attackText;refreshAttack();}
  else if(action==='pick-key'){state.picked=Number(b.dataset.key);refreshAttack();}
  else if(action==='kasiski-run')refreshKasiski();
  else if(action==='packet-send'){
    try{let sent=E.transform(state.tamperText,'caesar',3);state.tamperCipher=sent.output;state.sentPlain=sent.input;state.tampered=false;refreshAttack();const packet=$('packet-badge');packet.hidden=false;packet.classList.remove('flying');void packet.offsetWidth;packet.classList.add('flying');chime('packet');setTimeout(()=>{packet.hidden=true;},1600);}catch(e){$('attack-error').textContent=t(e.code||e.message);}
  }else if(action==='packet-flip'){
    if(!state.tamperCipher)return;let i=Array.from(state.tamperCipher).findIndex(c=>E.A.includes(c));if(i<0)return;let chars=Array.from(state.tamperCipher);chars[i]=E.A[E.mod(E.A.indexOf(chars[i])+1,26)];state.tamperCipher=chars.join('');state.tampered=true;refreshAttack();chime('error');
  }else if(action==='check-answer'){let i=Number(b.dataset.index);state.feedback[i]=state.answers[i].trim().replace(/\s+/g,' ').toUpperCase()===challenges[i].plain?'correct':'incorrect';$('feedback-'+i).textContent=t(state.feedback[i]);$('feedback-'+i).style.color=state.feedback[i]==='correct'?'#059669':'#e11d48';chime(state.feedback[i]==='correct'?'scene':'error');}
  else if(action==='hint'){let i=Number(b.dataset.index);state.hints[i]=!state.hints[i];$('hint-'+i).hidden=!state.hints[i];}
}
document.addEventListener('input',e=>{
  let id=e.target.id;if(id==='scrubber'){seek(Number(e.target.value));return;}
  if(id==='message-input'){texts[state.alg]=e.target.value;stopTrace();state.pos=state.phase=0;updateStudio();}
  if(id==='key-input'){if(state.alg==='vigenere')state.word=e.target.value;else state.key=e.target.value;stopTrace();state.pos=state.phase=0;updateStudio();}
  if(id==='source-editor')edits[state.alg]=e.target.value;
  if(id==='attack-input'){state.attackText=e.target.value;state.picked=null;}
  if(id==='freq-input')state.freqText=e.target.value;
  if(id==='kasiski-input')state.kasiskiText=e.target.value;
  if(id==='tamper-input')state.tamperText=e.target.value;
  if(e.target.dataset.answer!==undefined)state.answers[Number(e.target.dataset.answer)]=e.target.value;
});
document.addEventListener('change',e=>{if(e.target.id==='speed'){state.speed=Number(e.target.value);syncMedia(true);}if(e.target.id==='algorithm-select'){stopTrace();if(state.decrypt&&state.result)texts[state.alg]=state.result.output;state.alg=e.target.value;state.decrypt=false;state.pos=state.phase=0;renderScene();}if(e.target.id==='freq-select'){state.freqType=e.target.value;refreshAttack();}});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;let a=b.dataset.action;
  if(a==='language')changeLanguage(b.dataset.lang);
  else if(a==='chapter')goTo(Number(b.dataset.index));
  else if(a==='direction')setDirection(b.dataset.decrypt==='true');
  else if(a==='sample'){stopTrace();state.decrypt=false;state.pos=state.phase=0;texts[state.alg]={caesar:'WELCOME TO GRAVITY FALLS',atbash:'STAY WEIRD',a1z26:'HI BILL',vigenere:'ATTACK AT DAWN',bill:'TRUST NO ONE'}[state.alg];state.key=3;state.word='BILL';renderScene();}
  else if(a==='copy'){if(!state.result)return;try{await navigator.clipboard.writeText(state.result.output);toast(t('copied'));}catch{toast(t('copyError'));}}
  else if(a==='trace-next')nextStep();else if(a==='trace-back'){stopTrace();nextStep(-1);}else if(a==='trace-reset'){stopTrace();state.pos=state.phase=0;updateTrace();}
  else if(a==='trace-select'){stopTrace();state.pos=Number(b.dataset.index);state.phase=0;updateTrace();}
  else if(a==='trace-auto'){if(state.traceRunning)stopTrace();else{state.traceRunning=true;$('trace-auto').textContent=t('stop');traceTimer=setInterval(()=>nextStep(),240);}}
  else if(a==='symbol'){let i=Number(b.dataset.index);if(state.decrypt){let input=$('message-input');const start=input.selectionStart,end=input.selectionEnd;input.setRangeText(E.billChar(i),start,end,'end');texts.bill=input.value;input.focus();state.pos=state.phase=0;updateStudio();}else{let pos=state.result?.trace.findIndex(v=>v.p===i);if(pos>=0){state.pos=pos;state.phase=4;updateTrace();}else toast(E.A[i]+' = '+E.billChar(i));}}
  else if(a==='run-code')runCode();else if(a==='restore-code'){edits[state.alg]=LAB_SOURCES[state.alg];$('source-editor').value=LAB_SOURCES[state.alg];$('runner-output').hidden=true;}
  else if(a==='download-code'){const code=$('source-editor').value+'\n\nconsole.log(transform('+JSON.stringify($('message-input').value)+','+JSON.stringify(state.alg==='vigenere'?state.word:state.key)+','+state.decrypt+'));\n';const u=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));const link=document.createElement('a');link.href=u;link.download=state.alg+'-cipher.js';link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  else if(a==='play')playPause();else if(a==='seek')seek(state.time+Number(b.dataset.delta));
  else if(a==='captions'){state.cc=!state.cc;syncHeader();}else if(a==='voice'){if(!('speechSynthesis'in window)){toast(t('voiceUnsupported'));return;}state.voice=!state.voice;speechSynthesis.cancel();syncHeader();if(state.voice)syncMedia(true);}
  else if(a==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('player-container').requestFullscreen();}catch{toast(t('fullscreenError'));}}
  else if(a==='help'||a==='sources')showDialog(a);else if(a==='close-dialog')$('help-dialog').close();else if(a==='fx'){state.fx=!state.fx;showDialog('help',true);}
  else handleLabAction(a,b);
});
document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,[contenteditable=true]')||$('help-dialog').open||e.ctrlKey||e.altKey||e.metaKey)return;let row=e.target.closest('tr[data-action=pick-key]');if(row&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();row.click();return;}if(e.target.closest('button')&&e.code==='Space')return;if(e.code==='Space'){e.preventDefault();playPause();}else if(e.code==='ArrowLeft'){e.preventDefault();seek(state.time-5);}else if(e.code==='ArrowRight'){e.preventDefault();seek(state.time+5);}else if(e.key.toLowerCase()==='c'){state.cc=!state.cc;syncHeader();}});
let lastTime=performance.now();function tick(now){let dt=Math.min(.5,(now-lastTime)/1000);lastTime=now;if(state.playing){state.time=Math.min(total,state.time+dt*state.speed);let i=start.findLastIndex(n=>n<=state.time);if(i!==state.scene)goTo(i,false);if(state.time>=total){state.playing=false;if('speechSynthesis'in window)speechSynthesis.cancel();}syncMedia();}requestAnimationFrame(tick);}
syncHeader();renderScene();requestAnimationFrame(tick);
})();
