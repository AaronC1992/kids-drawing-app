(function(){
  const prompts = [
    'Draw a happy sun', 'Create a magical forest', 'Design a funny creature', 'Make a rainbow train', 'Build a candy castle'
  ];
  const Challenges = {
    active:null,
    timer:null,
    seconds:60,
    init(app){
      this.app = app;
      const btn = document.getElementById('startChallengeBtn');
      if(btn){ btn.addEventListener('click', ()=> this.start()); }
    },
    start(){
      if(this.active){ this.stop(); }
      this.active = prompts[Math.floor(Math.random()*prompts.length)];
      this.seconds = 60;
      this.renderOverlay();
      this.tick();
    },
    tick(){
      if(!this.active) return;
      this.seconds--;
      this.updateOverlay();
      if(this.seconds <=0){ this.finish(); return; }
      this.timer = setTimeout(()=> this.tick(), 1000);
    },
    finish(){
      const overlay = document.getElementById('challengeOverlay');
      if(overlay){ overlay.innerHTML += '<p style="color:lime;margin-top:8px;">Time up! Save your art! 🎉</p>'; }
      this.active = null;
    },
    stop(){ clearTimeout(this.timer); this.active=null; this.removeOverlay(); },
    renderOverlay(){
      this.removeOverlay();
      const div = document.createElement('div');
      div.id='challengeOverlay';
      div.style.position='fixed';
      div.style.top='10px';
      div.style.right='10px';
      div.style.background='rgba(0,0,0,0.75)';
      div.style.color='#fff';
      div.style.padding='12px 16px';
      div.style.fontFamily='Arial';
      div.style.border='2px solid #FF69B4';
      div.style.borderRadius='10px';
      div.style.zIndex='7000';
      div.innerHTML = `<strong>⏱️ Challenge</strong><br><em>${this.active}</em><div id='challengeTimer'>Time: ${this.seconds}</div>`;
      document.body.appendChild(div);
    },
    updateOverlay(){
      const timerEl = document.getElementById('challengeTimer');
      if(timerEl){ timerEl.textContent = 'Time: ' + this.seconds; }
    },
    removeOverlay(){
      const old = document.getElementById('challengeOverlay');
      if(old) old.remove();
    }
  };
  window.Challenges = Challenges;
})();
