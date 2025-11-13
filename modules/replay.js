(function(){
  const Replay = {
    strokes: [],
    currentStroke: null,
    isRecording: false,
    init(app){
      this.app = app;
      const btnRecord = document.getElementById('toggleRecordingBtn');
      const btnReplay = document.getElementById('playReplayBtn');
      if(btnRecord){
        btnRecord.addEventListener('click', ()=>{
          this.isRecording = !this.isRecording;
          if(this.isRecording){
            this.strokes = [];
            btnRecord.textContent = '⏺ Recording...';
          } else {
            btnRecord.textContent = '🔴 Start Recording';
          }
        });
      }
      if(btnReplay){
        btnReplay.addEventListener('click', ()=> this.play());
      }
    },
    startStroke(meta){
      this.currentStroke = { meta, points: [meta.start] };
    },
    addPoint(x,y){
      if(!this.currentStroke) return;
      this.currentStroke.points.push({x,y});
    },
    endStroke(){
      if(this.currentStroke){
        this.strokes.push(this.currentStroke);
        this.currentStroke = null;
      }
    },
    lastStrokeMeta(){
      if(this.strokes.length===0) return null;
      return this.strokes[this.strokes.length-1].meta;
    },
    play(){
      if(!this.app || this.strokes.length===0) return;
      const ctx = this.app.ctx;
      // Clear canvas first
      ctx.clearRect(0,0,this.app.canvas.width,this.app.canvas.height);
      let strokeIndex = 0, pointIndex = 0;
      const drawNext = () => {
        if(strokeIndex >= this.strokes.length) return; // done
        const stroke = this.strokes[strokeIndex];
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.meta.size || 5;
        ctx.strokeStyle = stroke.meta.color || '#000';
        if(pointIndex === 0){
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        }
        const p = stroke.points[pointIndex];
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        pointIndex++;
        if(pointIndex >= stroke.points.length){
          strokeIndex++; pointIndex = 0;
          setTimeout(drawNext, 120); // pause between strokes
        } else {
          requestAnimationFrame(drawNext);
        }
      };
      drawNext();
    }
  };
  window.Replay = Replay;
})();
