(function(){
  const DailyUnlock = {
    key:'dailyStickerUnlock',
    init(){
      const today = new Date().toISOString().slice(0,10);
      let data = JSON.parse(localStorage.getItem(this.key)||'{}');
      if(data.date !== today){
        const stickers = Array.from(document.querySelectorAll('.sticker'));
        const pick = stickers[Math.floor(Math.random()*stickers.length)];
        data = {date: today, emoji: pick.textContent};
        localStorage.setItem(this.key, JSON.stringify(data));
      }
      this.highlight(data.emoji);
    },
    highlight(emoji){
      const stickers = document.querySelectorAll('.sticker');
      stickers.forEach(s=>{ if(s.textContent===emoji){ s.style.outline='3px solid gold'; s.title='Daily Unlock'; }});
    }
  };
  window.DailyUnlock = DailyUnlock;
})();
