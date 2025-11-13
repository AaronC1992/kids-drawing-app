(function(){
  const Achievements = {
    list: [
      {id:'first-stroke', name:'First Stroke', earned:false, test: (meta, stats)=> stats.totalStrokes===1},
      {id:'five-strokes', name:'5 Strokes', earned:false, test: (meta, stats)=> stats.totalStrokes===5},
      {id:'fireworks-fan', name:'10 Fireworks Uses', earned:false, test: (meta, stats)=> stats.fireworksUses===10},
      {id:'tools-explorer', name:'Used 5 Different Tools', earned:false, test: (meta, stats)=> stats.uniqueTools.size>=5}
    ],
    stats:{ totalStrokes:0, fireworksUses:0, uniqueTools: new Set() },
    init(){
      const btn = document.getElementById('showAchievementsBtn');
      if(btn){ btn.addEventListener('click', ()=> this.showModal()); }
    },
    onStrokeComplete(meta){
      if(!meta) return;
      this.stats.totalStrokes++;
      if(meta.tool==='fireworks') this.stats.fireworksUses++;
      if(meta.tool) this.stats.uniqueTools.add(meta.tool);
      this.list.forEach(a=>{ if(!a.earned && a.test(meta,this.stats)) a.earned = true; });
    },
    showModal(){
      let html = '<div style="position:fixed;top:10%;left:50%;transform:translateX(-50%);background:#fff;color:#333;padding:20px;border:3px solid #FF69B4;border-radius:12px;z-index:6000;max-width:320px;font-family:Arial;">';
      html += '<h3 style="margin-top:0">🏆 Achievements</h3>';
      html += '<ul style="list-style:none;padding:0;">';
      this.list.forEach(a=>{
        html += `<li style="margin:6px 0;">${a.earned?'✅':'⬜'} ${a.name}</li>`;
      });
      html += '</ul><button id="closeAchBtn" style="background:#FF69B4;color:#fff;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;">Close</button></div>';
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      document.body.appendChild(wrap);
      wrap.querySelector('#closeAchBtn').addEventListener('click', ()=> wrap.remove());
    }
  };
  window.Achievements = Achievements;
})();
