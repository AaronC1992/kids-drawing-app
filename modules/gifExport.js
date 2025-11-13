(function(){
  const GifExport = {
    init(){
      const btn = document.getElementById('exportGifBtn');
      if(btn){ btn.addEventListener('click', ()=> this.export()); }
    },
    export(){
      if(!window.Replay || window.Replay.strokes.length===0){ alert('Record a replay first.'); return; }
      const canvas = window.appInstance?.canvas;
      if(!canvas){ alert('Canvas missing'); return; }
      const gif = new GIF({workers:2, quality:10});
      // Render each stroke progressively for animation frames
      const temp = document.createElement('canvas');
      temp.width = canvas.width; temp.height = canvas.height;
      const tctx = temp.getContext('2d');
      tctx.fillStyle = '#FFF'; tctx.fillRect(0,0,temp.width,temp.height);
      window.Replay.strokes.forEach((stroke, si)=>{
        tctx.lineCap='round'; tctx.lineJoin='round'; tctx.lineWidth=stroke.meta.size||5; tctx.strokeStyle=stroke.meta.color||'#000';
        tctx.beginPath(); tctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for(let i=1;i<stroke.points.length;i++){ const p=stroke.points[i]; tctx.lineTo(p.x,p.y); }
        tctx.stroke();
        gif.addFrame(tctx, {copy:true, delay:120});
      });
      gif.on('finished', blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'drawing.gif'; a.click();
        URL.revokeObjectURL(url);
      });
      gif.render();
    }
  };
  window.GifExport = GifExport;
})();
