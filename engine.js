(function(root){
  'use strict';
  const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const mod=(x,n)=>((x%n)+n)%n;
  class CipherError extends Error { constructor(code){super(code);this.code=code;} }
  function normalize(s){return String(s).toUpperCase();}
  function validatePlain(s){
    s=normalize(s);
    if (/[^A-Z\s.,!?':;()\-]/u.test(s)) throw new CipherError('alphabetError');
    return s;
  }
  function keyValue(k){
    if(!Number.isFinite(Number(k)) || !Number.isInteger(Number(k))) throw new CipherError('shiftError');
    return mod(Number(k),26);
  }
  function keyword(k){k=normalize(k);if(!/^[A-Z]+$/.test(k))throw new CipherError('keyError');return k;}
  function billChar(p){return String.fromCodePoint(0xE000+p);}
  function billIndex(c){let p=c.codePointAt(0)-0xE000;return p>=0&&p<26?p:-1;}
  function displayBill(c){let p=billIndex(c);return p<0?c:A[p];}
  function transform(text,algorithm='caesar',key=3,decrypt=false){
    const trace=[];let output='';let letters=0;
    if(algorithm==='a1z26' && decrypt){
      let input=String(text), core=input.trim();
      // Canonical format: hyphens separate letters, spaces separate words.
      if(core && !/^(?:[1-9]|1\d|2[0-6])(?:-(?:[1-9]|1\d|2[0-6]))*(?:\s+(?:[1-9]|1\d|2[0-6])(?:-(?:[1-9]|1\d|2[0-6]))*)*$/.test(core))throw new CipherError('numberError');
      let pos=0;
      for(const token of input.split(/(-|\s+)/).filter(Boolean)){
        if(token==='-')continue;
        if(/^\s+$/.test(token)){output+=token;trace.push({input:token,output:token,skip:true,index:pos++});continue;}
        let n=Number(token),out=A[n-1];output+=out;trace.push({input:token,p:n,output:out,c:n-1,key:null,index:pos++});letters++;
      }
      return {output,trace,input,letters};
    }
    if(algorithm==='a1z26'){
      let input=normalize(text);
      if(/[^A-Z\s]/.test(input))throw new CipherError('numberPlainError');
      let prev=false;
      for(const [index,ch] of Array.from(input).entries()){
        let p=A.indexOf(ch);
        if(p<0){output+=ch;prev=false;trace.push({input:ch,output:ch,index,skip:true});continue;}
        let out=String(p+1);output+=(prev?'-':'')+out;prev=true;
        trace.push({input:ch,p,output:out,c:p+1,key:null,index});letters++;
      }
      return {output,trace,input,letters};
    }
    let input=algorithm==='bill'&&decrypt?String(text):validatePlain(text);
    let shift=algorithm==='caesar'?keyValue(key):0;
    let word=algorithm==='vigenere'?keyword(key):'';
    if(algorithm==='bill'&&decrypt && /[^\uE000-\uE019\s.,!?':;()\-]/u.test(input))throw new CipherError('symbolError');
    for(const [index,ch] of Array.from(input).entries()){
      let p=algorithm==='bill'&&decrypt?billIndex(ch):A.indexOf(ch);
      if(p<0){output+=ch;trace.push({input:ch,output:ch,index,skip:true});continue;}
      let k=algorithm==='vigenere'?A.indexOf(word[letters%word.length]):shift;
      let c,out;
      if(algorithm==='caesar'||algorithm==='vigenere'){c=mod(p+(decrypt?-k:k),26);out=A[c];}
      else if(algorithm==='atbash'){c=25-p;out=A[c];}
      else if(algorithm==='bill'){c=p;out=decrypt?A[p]:billChar(p);}
      else throw new CipherError('algorithmError');
      output+=out;trace.push({input:ch,output:out,p,c,key:k,keyLetter:word?word[letters%word.length]:null,keyPos:word?letters%word.length:null,index,letterIndex:letters});letters++;
    }
    return {output,trace,input,letters};
  }
  function bruteForce(text){return Array.from({length:26},(_,key)=>({key,text:transform(text,'caesar',key,true).output}));}
  function frequencies(text,algorithm='caesar'){
    let counts=Array(26).fill(0),total=0;
    for(const ch of normalize(text)){let p=algorithm==='bill'?billIndex(ch):A.indexOf(ch);if(p>=0){counts[p]++;total++;}}
    return {counts,total,percent:counts.map(n=>total?n/total*100:0)};
  }
  function kasiski(text,size=3){
    text=validatePlain(text).replace(/[^A-Z]/g,'');
    const seen=new Map(),matches=[];
    for(let i=0;i<=text.length-size;i++){let gram=text.slice(i,i+size);if(seen.has(gram)){let first=seen.get(gram),distance=i-first;matches.push({gram,first,second:i,distance,factors:Array.from({length:Math.min(distance,20)},(_,j)=>j+1).filter(j=>distance%j===0)});}else seen.set(gram,i);}
    return matches;
  }
  const api={A,mod,CipherError,transform,bruteForce,frequencies,kasiski,billChar,billIndex,displayBill};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.CipherLab=api;
})(typeof window!=='undefined'?window:globalThis);
