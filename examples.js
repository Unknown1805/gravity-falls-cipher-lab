window.LAB_SOURCES={
caesar:`function transform(text, key = 3, decrypt = false) {
  const mod = n => ((n % 26) + 26) % 26;
  if (!Number.isInteger(Number(key))) throw Error('shiftError');
  const k = mod(Number(key));
  text = String(text).toUpperCase();
  if (/[^A-Z\\s.,!?':;()\\-]/u.test(text)) throw Error('alphabetError');
  return Array.from(text, ch => {
    if (!/[A-Z]/.test(ch)) return ch;
    const p = ch.charCodeAt(0) - 65;
    const c = mod(p + (decrypt ? -k : k));
    return String.fromCharCode(65 + c);
  }).join('');
}`,
atbash:`function transform(text, key, decrypt = false) {
  text = String(text).toUpperCase();
  if (/[^A-Z\\s.,!?':;()\\-]/u.test(text)) throw Error('alphabetError');
  return Array.from(text, ch => {
    if (!/[A-Z]/.test(ch)) return ch;
    const p = ch.charCodeAt(0) - 65;
    return String.fromCharCode(65 + 25 - p);
  }).join('');
}`,
vigenere:`function transform(text, key = 'BILL', decrypt = false) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const mod = n => ((n % 26) + 26) % 26;
  key = String(key).toUpperCase();
  if (!/^[A-Z]+$/.test(key)) throw Error('keyError');
  text = String(text).toUpperCase();
  if (/[^A-Z\\s.,!?':;()\\-]/u.test(text)) throw Error('alphabetError');
  let j = 0;
  return Array.from(text, ch => {
    const p = A.indexOf(ch);
    if (p < 0) return ch;
    const k = A.indexOf(key[j % key.length]);
    j++;
    return A[mod(p + (decrypt ? -k : k))];
  }).join('');
}`,
a1z26:`function transform(text, key, decrypt = false) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  text = String(text).toUpperCase();
  if (decrypt) {
    const pattern = /^(?:[1-9]|1\\d|2[0-6])(?:-(?:[1-9]|1\\d|2[0-6]))*(?:\\s+(?:[1-9]|1\\d|2[0-6])(?:-(?:[1-9]|1\\d|2[0-6]))*)*$/;
    if (text.trim() && !pattern.test(text.trim())) throw Error('numberError');
    return text.split(/(-|\\s+)/).filter(Boolean).map(t =>
      t === '-' ? '' : /^\\s+$/.test(t) ? t : A[Number(t) - 1]
    ).join('');
  }
  if (/[^A-Z\\s]/.test(text)) throw Error('numberPlainError');
  let previousLetter = false;
  return Array.from(text, ch => {
    const p = A.indexOf(ch);
    if (p < 0) { previousLetter = false; return ch; }
    const out = (previousLetter ? '-' : '') + (p + 1);
    previousLetter = true;
    return out;
  }).join('');
}`,
bill:`function transform(text, key, decrypt = false) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  text = decrypt ? String(text) : String(text).toUpperCase();
  const pattern = decrypt
    ? /[^\\uE000-\\uE019\\s.,!?':;()\\-]/u
    : /[^A-Z\\s.,!?':;()\\-]/u;
  if (pattern.test(text)) throw Error(decrypt ? 'symbolError' : 'alphabetError');
  return Array.from(text, ch => {
    const p = decrypt ? ch.codePointAt(0) - 0xE000 : A.indexOf(ch);
    if (p < 0 || p > 25) return ch;
    return decrypt ? A[p] : String.fromCodePoint(0xE000 + p);
  }).join('');
}`
};
