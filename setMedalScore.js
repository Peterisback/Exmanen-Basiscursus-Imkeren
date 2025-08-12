// Hulp: zet score in medaille-svg (als inline <img> wordt vervangen door inline <svg> of via <object> geladen)
export function setMedalScore(root, value){ // value als '85%'
  try{
    const el = root.querySelector('#medal-score');
    if (el) el.textContent = value;
  }catch(e){/* noop */}
}


// medal-score positioning handled in styles.css via #medal-score
