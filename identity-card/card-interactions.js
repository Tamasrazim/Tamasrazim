/* Identity-card interactions extracted from the original Tamasrazim site.js.
   Behavior is scoped to the standalone card; source motion values are preserved. */
(function(){
  'use strict';
  var __raf60Last = new WeakMap();
  var __raf60Pending = new WeakSet();
  var __raf60Interval = 1000 / 60;
  function requestAnimationFrame60(callback){
    if(__raf60Pending.has(callback)) return true;
    __raf60Pending.add(callback);
    function schedule(){
      window.requestAnimationFrame(function(now){
        var last = __raf60Last.get(callback);
        if(last === undefined || now - last >= (__raf60Interval - 0.25)){
          __raf60Last.set(callback, now);
          __raf60Pending.delete(callback);
          callback(now);
        }else{
          window.setTimeout(schedule, Math.max(0, __raf60Interval - (now - last)));
        }
      });
    }
    schedule();
    return true;
  }

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function q(selector, root){ return (root || document).querySelector(selector); }
  function qa(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  /* Original reveal-in behavior for the card. */
  var revealItems = qa('[data-reveal]');
  if(!reduced && 'IntersectionObserver' in window){
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -7% 0px'});
    revealItems.forEach(function(el){ observer.observe(el); });
  }else{
    revealItems.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* Original handle scramble on hover. */
  var scramble = '!<>-_[]{}=+*#01/\\\\';
  function scrambleTo(el, target, duration){
    if(!el || reduced) return;
    duration = duration || 360;
    var start = performance.now();
    function frame(now){
      var progress = Math.min(1, (now - start) / duration);
      var reveal = Math.floor(target.length * progress);
      var output = '';
      for(var i=0;i<target.length;i++){
        if(target[i] === ' ') output += ' ';
        else output += i < reveal ? target[i] : scramble[Math.floor(Math.random()*scramble.length)];
      }
      el.textContent = output;
      if(progress < 1) requestAnimationFrame60(frame);
      else el.textContent = target;
    }
    requestAnimationFrame60(frame);
  }
  var idAlias = q('#idAlias');
  if(idAlias) idAlias.addEventListener('mouseenter', function(){ scrambleTo(idAlias,'TAMASRAZIM',260); });

  /* Original global pointer field, narrowed to the ID card only. */
  if(!reduced){
    var pointerTargets = [['.id-card','drift',0.014,0.010,3.2,4.4]];
    var pointerNodes = [];
    pointerTargets.forEach(function(spec){
      qa(spec[0]).forEach(function(el){
        var mode=spec[1],nx=spec[2],ny=spec[3],rxMax=spec[4],ryMax=spec[5];
        el.classList.add(mode==='drift'?'pointer-drift':'pointer-soft');
        pointerNodes.push({el:el,nx:nx,ny:ny,rxMax:rxMax,ryMax:ryMax,x:0,y:0,rx:0,ry:0});
      });
    });

    var pointerTX=0,pointerTY=0,pointerX=0,pointerY=0,pointerRAF=0;
    function pointerTick(now){
      var k=1-Math.exp(-Math.min(.05,Math.max(.008,(now-(pointerTick.last||now))/1000))*11);
      pointerTick.last=now;
      pointerX+=(pointerTX-pointerX)*k;
      pointerY+=(pointerTY-pointerY)*k;
      pointerNodes.forEach(function(item){
        var x=pointerX*item.nx;
        var y=pointerY*item.ny;
        var rx=(pointerY*item.rxMax);
        var ry=(pointerX*item.ryMax);
        item.el.style.setProperty('--pd-x',x.toFixed(2)+'px');
        item.el.style.setProperty('--pd-y',y.toFixed(2)+'px');
        item.el.style.setProperty('--pd-rx',(-rx).toFixed(3)+'deg');
        item.el.style.setProperty('--pd-ry',ry.toFixed(3)+'deg');
      });
      pointerRAF=requestAnimationFrame60(pointerTick);
    }
    window.addEventListener('pointermove',function(e){
      var x=(e.clientX/window.innerWidth-.5)*2;
      var y=(e.clientY/window.innerHeight-.5)*2;
      pointerTX=Math.max(-1,Math.min(1,x));
      pointerTY=Math.max(-1,Math.min(1,y));
      if(!pointerRAF) pointerRAF=requestAnimationFrame60(pointerTick);
    },{passive:true});
    document.addEventListener('mouseleave',function(){pointerTX=0;pointerTY=0;},{passive:true});
    window.addEventListener('blur',function(){pointerTX=0;pointerTY=0;});
    document.addEventListener('visibilitychange',function(){if(document.hidden){pointerTX=0;pointerTY=0;}});
  }

  /* Original local text-zoom effect, scoped to the card's own labels. */
  if(!reduced){
    var textTargets=qa('.id-kicker,.id-online,.id-status,.id-name,.id-alias,.id-code');
    textTargets.forEach(function(el){el.classList.add('text-reactive');el.dataset.textZoom='1';});
    var textPoint={x:-9999,y:-9999};
    var zoomRAF=0;
    function textZoomTick(){
      textTargets.forEach(function(el){
        var r=el.getBoundingClientRect();
        if(r.width<2||r.height<2) return;
        var cx=r.left+r.width*.5,cy=r.top+r.height*.5;
        var dx=textPoint.x-cx,dy=textPoint.y-cy;
        var radius=Math.max(90,Math.min(260,Math.max(r.width,r.height)*1.15));
        var dist=Math.sqrt(dx*dx+dy*dy);
        var influence=Math.max(0,1-dist/radius);
        influence=influence*influence*(3-2*influence);
        el.style.setProperty('--text-scale',(1+.115*influence).toFixed(4));
        el.style.setProperty('--text-y',(-2.5*influence).toFixed(2)+'px');
        el.style.setProperty('--text-glow',influence.toFixed(3));
      });
      zoomRAF=0;
    }
    window.addEventListener('pointermove',function(e){
      textPoint.x=e.clientX;textPoint.y=e.clientY;
      if(!zoomRAF) zoomRAF=requestAnimationFrame60(textZoomTick);
    },{passive:true});
    window.addEventListener('blur',function(){
      textPoint.x=-9999;textPoint.y=-9999;
      if(!zoomRAF) zoomRAF=requestAnimationFrame60(textZoomTick);
    });
  }

  /* Original crosshair cursor and click ripple. */
  var dot=q('#cursorDot'),ring=q('#cursorRing');
  if(!reduced && dot && ring){
    var mx=0,my=0,rx=0,ry=0,hasMoved=false;
    window.addEventListener('mousemove',function(e){
      mx=e.clientX;my=e.clientY;
      dot.style.opacity='1';
      dot.style.transform='translate3d('+mx+'px,'+my+'px,0) translate(-50%,-50%)';
      if(!hasMoved){rx=mx;ry=my;hasMoved=true;ring.style.opacity='1';}
    },{passive:true});
    qa('a,button,.project-card,.id-card,.email-link').forEach(function(el){
      el.addEventListener('mouseenter',function(){ring.classList.add('is-active');});
      el.addEventListener('mouseleave',function(){ring.classList.remove('is-active');});
    });
    function syncCursor(){
      rx=mx;ry=my;
      ring.style.transform='translate3d('+mx+'px,'+my+'px,0) translate(-50%,-50%)';
    }
    window.addEventListener('mousemove',syncCursor,{passive:true});
    syncCursor();
  }
  window.addEventListener('pointerdown',function(e){
    if(reduced) return;
    var ripple=document.createElement('span');
    ripple.className='tap-ripple';
    ripple.style.left=e.clientX+'px';
    ripple.style.top=e.clientY+'px';
    for(var n=0;n<4;n++) ripple.appendChild(document.createElement('i'));
    document.body.appendChild(ripple);
    window.setTimeout(function(){ripple.remove();},620);
  },{passive:true});
})();