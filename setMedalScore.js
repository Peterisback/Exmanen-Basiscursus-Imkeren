// Hulp: zet score in medaille-svg (als inline <img> wordt vervangen door inline <svg> of via <object> geladen)
export function setMedalScore(root, value){ // value als '85%'
  try{
    const el = root.querySelector('#medal-score');
    if (el) {
      el.textContent = value;
      let currentX = parseFloat(el.getAttribute("x") || 0);
      let currentY = parseFloat(el.getAttribute("y") || 0);
      el.setAttribute("x", currentX + 1); // fractie naar rechts
      el.setAttribute("y", currentY - 2); // kwart van getal omhoog
    }
  }catch(e){/* noop */}
}


// medal-score positioning handled in styles.css via #medal-score


// --- medal-score positioning & color ---
try{
  const el = document.getElementById('medal-score');
  if (el){
    // waarde zetten
    if (typeof value !== 'undefined') el.textContent = value;

    // kleur (matcht bij-kleur)
    el.setAttribute('fill', '#9c4108');

    // bereken verschuiving: klein stukje naar rechts, kwart font-hoogte omhoog
    let fontSizePx = 24;
    try{
      fontSizePx = parseFloat(getComputedStyle(el).fontSize) || fontSizePx;
    }catch(e){/* noop */}

    const dx = +(fontSizePx * 0.06).toFixed(2);   // ~6% van fontgrootte naar rechts
    const dy = +(-fontSizePx * 0.25).toFixed(2);  // ~25% van fontgrootte omhoog

    // bestaande translate verwijderen en nieuwe zetten
    const prev = el.getAttribute('transform') || '';
    const withoutTranslate = prev.replace(/translate\([^)]+\)\s*/,'').trim();
    const nextTransform = `translate(${dx},${dy}) ${withoutTranslate}`.trim();
    el.setAttribute('transform', nextTransform);
  }
}catch(e){/* noop */}

