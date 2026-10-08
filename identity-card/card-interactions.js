/* Extracted from the main Tamasrazim site interaction system.
   These are the original 60-FPS pointer drift and responsive-text blocks,
   narrowed to the identity-card page. */
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
  function qa(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  /* ---------- Global mouse field / everywhere interaction ---------- */
    if(!reduced){
      var pointerTargets=[
        ['.hero-title','drift',0.018,0.014,2.8,3.6],
        ['.hero-kicker','soft',0.010,0.008,0,0],
        ['.hero-alias','soft',0.014,0.010,0,0],
        ['.hero-copy','soft',0.008,0.006,0,0],
        ['.hero-actions','soft',0.012,0.010,0,0],
        ['.about-copy','soft',0.010,0.008,0,0],
        ['.id-card','drift',0.014,0.010,3.2,4.4],
        ['.social-link','soft',0.012,0.010,0,0],
        ['.contact-panel','drift',0.010,0.008,2.4,3.2],
        ['.copy','soft',0.012,0.010,0,0],
        ['.brand','soft',0.007,0.005,0,0],
        ['.header-contact','soft',0.009,0.007,0,0],
        ['.renderer-mini','soft',0.014,0.011,0,0],
        ['.hero-scan','soft',0.018,0.012,0,0]
      ];

      var pointerNodes=[];
      pointerTargets.forEach(function(spec){
        qa(spec[0]).forEach(function(el){
          var mode=spec[1],nx=spec[2],ny=spec[3],rxMax=spec[4],ryMax=spec[5];
          el.classList.add(mode==='drift'?'pointer-drift':'pointer-soft');
          pointerNodes.push({el:el,nx:nx,ny:ny,rxMax:rxMax,ryMax:ry,x:0,y:0,rx:0,ry:0});
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

      document.addEventListener('mouseleave',function(){
        pointerTX=0;
        pointerTY=0;
      },{passive:true});

      window.addEventListener('blur',function(){
        pointerTX=0;
        pointerTY=0;
      });

      document.addEventListener('visibilitychange',function(){
        if(document.hidden){
          pointerTX=0;
          pointerTY=0;
        }
      });
    }


    
  /* ---------- Local text zoom everywhere ---------- */
    if(!reduced){
      var textTargets=qa([
        '.nav a',
        '.header-contact',
        '.hero-title',
        '.hero-kicker',
        '.hero-alias strong',
        '.hero-copy',
        '.button',
        '.section-title',
        '.section-intro',
        '.eyebrow',
        '.about-copy p',
        '.project-index',
        '.project-body h3',
        '.project-body p',
        '.project-tags',
        '.project-link',
        '.window-bar',
        '.social-name',
        '.social-meta',
        '.social-arrow',
        '.contact-panel h2',
        '.contact-copy',
        '.contact-note',
        '.copy',
        '.footer-copy',
        '.footer-link',
        '.hero-meta',
        '.scroll-cue',
        '.id-kicker',
        '.id-online',
        '.id-status',
        '.id-name',
        '.id-alias',
        '.id-code'
      ].join(','));

      textTargets.forEach(function(el){
        el.classList.add('text-reactive');
        el.dataset.textZoom='1';
      });

      var textPoint={x:-9999,y:-9999};
      var zoomRAF=0;

      function textZoomTick(){
        textTargets.forEach(function(el){
          var r=el.getBoundingClientRect();
          if(r.width<2||r.height<2){return}
          var cx=r.left+r.width*.5;
          var cy=r.top+r.height*.5;
          var dx=textPoint.x-cx;
          var dy=textPoint.y-cy;
          var radius=Math.max(90,Math.min(260,Math.max(r.width,r.height)*1.15));
          var dist=Math.sqrt(dx*dx+dy*dy);
          var influence=Math.max(0,1-dist/radius);
          influence=influence*influence*(3-2*influence);
          var scale=1+.115*influence;
          var lift=-2.5*influence;
          el.style.setProperty('--text-scale',scale.toFixed(4));
          el.style.setProperty('--text-y',lift.toFixed(2)+'px');
          el.style.setProperty('--text-glow',influence.toFixed(3));
        });
        zoomRAF=0;
      }

      window.addEventListener('pointermove',function(e){
        textPoint.x=e.clientX;
        textPoint.y=e.clientY;
        if(!zoomRAF) zoomRAF=requestAnimationFrame60(textZoomTick);
      },{passive:true});

      window.addEventListener('blur',function(){
        textPoint.x=-9999;textPoint.y=-9999;
        if(!zoomRAF) zoomRAF=requestAnimationFrame60(textZoomTick);
      });
    }

    
})();
