const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function getChosung(str) {
  if (!str) return '';
  return str.split('').map(char => {
    const code = char.charCodeAt(0) - 0xAC00;
    if (code >= 0 && code <= 11172) return CHOSUNG[Math.floor(code / 588)];
    return char;
  }).join('');
}

export function matchSearch(target, query) {
  if (!query) return true;
  const cleanTarget = (target || '').toLowerCase();
  const cleanQuery = query.toLowerCase();
  if (cleanTarget.includes(cleanQuery)) return true;
  const targetChosung = getChosung(cleanTarget);
  return targetChosung.includes(cleanQuery);
}
