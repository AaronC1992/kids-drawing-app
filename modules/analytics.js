(function(){
  const Analytics = {
    events: [],
    init(){
      this.log('init');
      // Hook simple buttons
      ['undoBtn','clearBtn','saveBtn','startChallengeBtn','exportGifBtn'].forEach(id=>{
        const el = document.getElementById(id);
        if(el) el.addEventListener('click', ()=> this.log('click:'+id));
      });
    },
    log(name, data={}){
      this.events.push({name, data, ts: Date.now()});
      if(this.events.length>200) this.events.shift();
      // Placeholder for future dispatch to backend/native bridge
      // console.debug('[Analytics]', name, data);
    }
  };
  window.Analytics = Analytics;
})();
