/* Main Tamasrazim motion-core.js, trimmed before the unrelated scene-wide background engine.
   The identity card's original motion-layer tracking is preserved. */
(function(){
'use strict';
    /* Site animation governor: keep continuous JS motion at a maximum of 60 updates/sec.
       The renderer/export engine is independent and may still render at 120 FPS. */
    var __raf60Last = new WeakMap();
    var __raf60Interval = 1000 / 60;
    function requestAnimationFrame60(callback){
      function schedule(){
        window.requestAnimationFrame(function(now){
          var last = __raf60Last.get(callback);
          if(last === undefined || now - last >= (__raf60Interval - 0.25)){
            __raf60Last.set(callback, now);
            callback(now);
          }else{
            window.setTimeout(schedule, Math.max(0, __raf60Interval - (now - last)));
          }
        });
      }
      schedule();
    }

if(window.__tamasrazimMotionCore)return;
window.__tamasrazimMotionCore=true;

var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__tamasrazimMotionState={
  reduced:!!reduce,
  startedAt:performance.now()
};
var fine=window.matchMedia&&window.matchMedia('(pointer: fine)').matches;
var horizontal=!!(document.body&&document.body.dataset.horizontalMode==='true');
var axisScroller=document.getElementById('axisScroller') || document.scrollingElement || document.documentElement;
function pageX(){return horizontal?(axisScroller.scrollLeft||0):0;}
function pageY(){return horizontal?0:(window.scrollY||0);}
function pageMax(){return horizontal?Math.max(1,(axisScroller.scrollWidth||0)-innerWidth):Math.max(1,document.documentElement.scrollHeight-innerHeight);}
if(reduce)return;

var style=document.createElement('style');
style.textContent=String.raw`
:root{
  --motion-px:0;--motion-py:0;--motion-vx:0;--motion-vy:0;
  --motion-scroll:0;--motion-scroll-v:0;--motion-progress:0;
  --motion-energy:0;
}
.motion-layer{
  --ml-x:0px;--ml-y:0px;--ml-s:1;
  translate:var(--ml-x) var(--ml-y);
  scale:var(--ml-s);
  transform-style:preserve-3d;
  will-change:translate,scale;
}
.motion-text{
  --mt-s:1;--mt-y:0px;--mt-x:0px;
  scale:var(--mt-s);translate:var(--mt-x) var(--mt-y);
  transform-origin:50% 50%;
  will-change:scale,translate;
}
.motion-depth{
  --depth-x:0px;--depth-y:0px;--depth-z:0px;
  translate:var(--depth-x) var(--depth-y);
  transform:translateZ(var(--depth-z));
  will-change:translate;
}
.infinity-field{
  position:relative;isolation:isolate;
  --if-strength:0;--if-x:0px;--if-y:0px;--if-scale:1;
  translate:var(--if-x) var(--if-y);scale:var(--if-scale);
  will-change:translate,scale;
}
.infinity-field:before,.infinity-field:after{
  content:"";position:absolute;left:50%;top:50%;
  border:1px solid currentColor;border-radius:50%;
  pointer-events:none;z-index:-1;
  opacity:calc(var(--if-strength)*.75);
  transform:translate(-50%,-50%) scale(calc(1 + var(--if-strength)*5));
}
.infinity-field:before{width:28px;height:28px}
.infinity-field:after{width:76px;height:76px;opacity:calc(var(--if-strength)*.2);filter:blur(.5px)}
.motion-ready .project-card,
.motion-ready .id-card,
.motion-ready .contact-panel,
.motion-ready .social-link{transform-style:preserve-3d}
@media(pointer:coarse){
  .motion-layer,.motion-text,.motion-depth,.infinity-field{
    translate:none!important;scale:1!important;transform:none!important
  }
  .infinity-field:before,.infinity-field:after{display:none}
}
`;
document.head.appendChild(style);

var root=document.documentElement;
root.classList.add('motion-ready');
root.dataset.motionEngine='active';
window.__tamasrazimMotionActive=true;

var pointer={
  x:innerWidth*.5,y:innerHeight*.5,
  tx:innerWidth*.5,ty:innerHeight*.5,
  vx:0,vy:0,px:innerWidth*.5,py:innerHeight*.5
};
var scroll={x:pageX(),y:pageY(),targetX:pageX(),targetY:pageY(),velocityX:0,velocityY:0,lastX:pageX(),lastY:pageY()};
var nodes=[],texts=[],email=null,emailLetters=[];
var boundsDirty=true,last=performance.now(),raf=0;
var pageVisible=!document.hidden;
document.addEventListener('visibilitychange',function(){
  pageVisible=!document.hidden;
  if(pageVisible) last=performance.now();
},{passive:true});

function qa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function ease(v){v=clamp(v,0,1);return v*v*(3-2*v)}
function smooth(a,b,k){return a+(b-a)*k}

function add(selector,type,strength){
  qa(selector).forEach(function(el){
    if(el.dataset.motionCore)return;
    el.dataset.motionCore='1';
    el.classList.add('motion-layer');
    nodes.push({el:el,type:type,strength:strength,x:0,y:0,scale:1,w:1,h:1,cx:0,cy:0});
  });
}

add('.hero-title','hero',1.35);
add('.hero-kicker,.hero-alias,.hero-copy,.hero-actions','hero',.7);
add('.about-copy','about',.48);
add('.id-card','card',1.15);
add('.project-card','card',1.05);
add('.social-link','social',.8);
add('.contact-panel','contact',.78);
add('.renderer-mini','surface',.82);
add('.brand,.header-contact,.button,.project-link,.copy','control',.5);

qa('.hero-title,.section-title,.social-name,.project-body h3,.id-name,.id-alias,.email-link').forEach(function(el){
  if(el.dataset.motionText)return;
  el.dataset.motionText='1';
  el.classList.add('motion-text');
  texts.push({el:el,s:1,x:0,y:0,cx:0,cy:0,w:1,h:1});
});

email=document.querySelector('.email-link');
if(email){
  email.classList.add('infinity-field');
  var raw=email.textContent;
  email.textContent='';
  emailLetters=[];
  for(var li=0;li<raw.length;li++){
    var span=document.createElement('span');
    span.className='infinity-letter';
    span.textContent=raw[li]===' '? '\u00a0' : raw[li];
    email.appendChild(span);
    emailLetters.push({el:span,x:0,y:0,r:0,s:1,w:1,h:1,cx:0,cy:0});
  }
}

function refreshBounds(){
  var sx=pageX(),sy=pageY();
  nodes.forEach(function(n){
    var r=n.el.getBoundingClientRect();
    n.w=r.width||1;n.h=r.height||1;
    n.cx=r.left+n.w*.5+sx;n.cy=r.top+n.h*.5+sy;
  });
  texts.forEach(function(t){
    var r=t.el.getBoundingClientRect();
    t.w=r.width||1;t.h=r.height||1;
    t.cx=r.left+t.w*.5+sx;t.cy=r.top+t.h*.5+sy;
  });
  boundsDirty=false;
}

function invalidate(){boundsDirty=true}
window.addEventListener('resize',invalidate,{passive:true});
window.addEventListener('load',invalidate,{once:true});
window.addEventListener('pointermove',function(e){pointer.tx=e.clientX;pointer.ty=e.clientY},{passive:true});
window.addEventListener('blur',function(){pointer.tx=innerWidth*.5;pointer.ty=innerHeight*.5},{passive:true});
(horizontal?axisScroller:window).addEventListener('scroll',function(){
  scroll.targetX=pageX();scroll.targetY=pageY();invalidate();
},{passive:true});

  /* Nested vertical panels are independent scroll containers in horizontal mode.
     Invalidate cached element bounds whenever one of them moves. */
  if(horizontal){
    Array.prototype.forEach.call(document.querySelectorAll('main#content > section, main#content > .band'),function(panel){
      if(panel.scrollHeight>panel.clientHeight+1){
        panel.addEventListener('scroll',function(){invalidate();},{passive:true});
      }
    });
  }

function frame(now){
  if(!pageVisible){raf=requestAnimationFrame60(frame);return;}
  var dt=Math.min(.05,Math.max(.008,(now-last)/1000));last=now;
  if(boundsDirty)refreshBounds();

  var pk=1-Math.exp(-dt*13);
  pointer.x=smooth(pointer.x,pointer.tx,pk);
  pointer.y=smooth(pointer.y,pointer.ty,pk);
  pointer.vx=smooth(pointer.vx,(pointer.x-pointer.px)/Math.max(dt,.008),.2);
  pointer.vy=smooth(pointer.vy,(pointer.y-pointer.py)/Math.max(dt,.008),.2);
  pointer.px=pointer.x;pointer.py=pointer.y;

  scroll.x=smooth(scroll.x,scroll.targetX,1-Math.exp(-dt*18));
  scroll.y=smooth(scroll.y,scroll.targetY,1-Math.exp(-dt*18));
  scroll.velocityX=smooth(scroll.velocityX,(scroll.x-scroll.lastX)/Math.max(dt,.008),.16);
  scroll.velocityY=smooth(scroll.velocityY,(scroll.y-scroll.lastY)/Math.max(dt,.008),.16);
  scroll.lastX=scroll.x;scroll.lastY=scroll.y;

  var nx=(pointer.x/Math.max(1,innerWidth)-.5)*2;
  var ny=(pointer.y/Math.max(1,innerHeight)-.5)*2;
  var maxScroll=pageMax();
  var pageProgress=horizontal?scroll.x/maxScroll:scroll.y/maxScroll;
  var pageVelocity=horizontal?scroll.velocityX:scroll.velocityY;
  var progress=clamp(pageProgress,0,1);
  var energy=clamp(Math.hypot(pointer.vx,pointer.vy)*.0025+Math.abs(pageVelocity)*.00045,0,1);

  root.style.setProperty('--motion-px',nx.toFixed(4));
  root.style.setProperty('--motion-py',ny.toFixed(4));
  root.style.setProperty('--motion-vx',pointer.vx.toFixed(2));
  root.style.setProperty('--motion-vy',pointer.vy.toFixed(2));
  root.style.setProperty('--motion-scroll',(horizontal?scroll.x:scroll.y).toFixed(2));
  root.style.setProperty('--motion-scroll-v',(horizontal?scroll.velocityX:scroll.velocityY).toFixed(2));
  root.style.setProperty('--motion-progress',progress.toFixed(4));
  root.style.setProperty('--motion-energy',energy.toFixed(4));

  nodes.forEach(function(n){
    var localX=n.cx-scroll.x;
    var localY=n.cy-scroll.y;
    if(horizontal){
      if(localX < -innerWidth*.4 || localX > innerWidth*1.4)return;
    }else if(localY < -innerHeight*.4 || localY > innerHeight*1.4)return;

    var screenX=horizontal?localX:localX;
    var screenY=localY;
    var dx=pointer.x-screenX,dy=pointer.y-screenY;
    var radius=Math.max(120,Math.min(500,Math.max(n.w,n.h)*1.2));
    var influence=ease(1-Math.hypot(dx,dy)/radius);
    var s=n.strength;

    var ax=n.type==='hero'?8:n.type==='card'?5:n.type==='social'?3:n.type==='control'?2:n.type==='about'?2.4:2.6;
    var ay=n.type==='hero'?4.8:n.type==='card'?3.2:n.type==='social'?2:n.type==='control'?1.4:n.type==='about'?1.8:1.7;

    var viewport=horizontal?(innerWidth*.58-localX)/innerWidth:(innerHeight*.58-localY)/innerHeight;
    var localScroll=clamp(viewport,-1,1);
    var scrollPower=n.type==='hero'?localScroll*.85:
      n.type==='card'?localScroll*1.1:
      n.type==='contact'?localScroll*.85:
      n.type==='social'?localScroll*.55:
      n.type==='about'?localScroll*.42:localScroll*.3;

    var vx=pointer.vx*.0035*s;
    var vy=pointer.vy*.0025*s;
    var tx=nx*ax*s*influence+vx+(horizontal?scrollPower*5:0);
    var ty=ny*ay*s*influence+vy+(horizontal?0:scrollPower*5);
    var targetScale=1+influence*(.014+.012*s)+energy*.008;

    n.x=smooth(n.x,tx,1-Math.exp(-dt*(9+influence*13)));
    n.y=smooth(n.y,ty,1-Math.exp(-dt*(9+influence*13)));
    n.scale=smooth(n.scale,targetScale,1-Math.exp(-dt*10));

    n.el.style.setProperty('--ml-x',n.x.toFixed(2)+'px');
    n.el.style.setProperty('--ml-y',n.y.toFixed(2)+'px');
    n.el.style.setProperty('--ml-s',n.scale.toFixed(4));
    n.el.style.setProperty('--motion-proximity',influence.toFixed(3));
  });

  texts.forEach(function(t){
    var localX=t.cx-scroll.x;
    var localY=t.cy-scroll.y;
    if(horizontal){
      if(localX < -innerWidth*.35 || localX > innerWidth*1.35)return;
    }else if(localY < -innerHeight*.35 || localY > innerHeight*1.35)return;

    var screenX=horizontal?localX:t.cx;
    var screenY=horizontal?localY:localY;
    var dist=Math.hypot(pointer.x-screenX,pointer.y-screenY);
    var radius=Math.max(110,Math.min(300,Math.max(t.w,t.h)*1.18));
    var f=ease(1-dist/radius);
    t.s=smooth(t.s,1+f*.065,1-Math.exp(-dt*14));
    t.y=smooth(t.y,-f*(2.2+energy*2),1-Math.exp(-dt*13));
    t.x=smooth(t.x,(pointer.x-screenX)/Math.max(1,t.w)*f*2.2,1-Math.exp(-dt*11));
    t.el.style.setProperty('--mt-s',t.s.toFixed(4));
    t.el.style.setProperty('--mt-y',t.y.toFixed(2)+'px');
    t.el.style.setProperty('--mt-x',t.x.toFixed(2)+'px');
  });

  if(email){
    var er=email.getBoundingClientRect();
    var ecx=er.left+er.width*.5, ecy=er.top+er.height*.5;
    var radius=Math.max(220,Math.min(620,er.width*3.2));
    var dist=Math.hypot(pointer.x-ecx,pointer.y-ecy);
    var proximity=clamp(1-dist/radius,0,1);
    var field=proximity*proximity*(3-2*proximity);

    email.classList.add('infinity-email');
    email.style.setProperty('--if-strength',field.toFixed(3));

    /* Cursor-driven fluid field:
       near the word, letters flow around the pointer instead of simply
       translating away from it. The tangential component creates the
       characteristic wrap/warp motion while the radial component preserves
       readable resistance. */
    var letters=emailLetters;
    if(letters&&letters.length){
      for(var li=0;li<letters.length;li++){
        var item=letters[li];
        var lr=item.el.getBoundingClientRect();
        var lcx=lr.left+lr.width*.5, lcy=lr.top+lr.height*.5;
        var dx=pointer.x-lcx, dy=pointer.y-lcy;
        var d=Math.max(1,Math.hypot(dx,dy));
        var local=clamp(1-d/Math.max(85,Math.min(245,er.width*.82)),0,1);
        local=local*local*(3-2*local);

        var ux=dx/d, uy=dy/d;
        var tx=-uy, ty=ux;
        var side=(pointer.x-ecx)/Math.max(1,er.width*.5);
        var bend=local*(9+energy*8);
        var repel=local*(5+energy*4);
        var edge=(lcx-ecx)/Math.max(1,er.width*.5);
        var edgeBias=clamp(Math.abs(edge),0,1);

        /* Strongest bend around the cursor, tapering toward the word edges. */
        var px=tx*bend-ux*repel;
        var py=ty*bend-uy*repel*.72;
        var curve=(side*.85-edge*.55)*local;
        var rotate=clamp(curve*4.2,-7,7);
        var scale=1+local*(.045+energy*.018);

        item.x=smooth(item.x,px,1-Math.exp(-dt*(14+local*18)));
        item.y=smooth(item.y,py,1-Math.exp(-dt*(14+local*18)));
        item.r=smooth(item.r,rotate,1-Math.exp(-dt*(13+local*16)));
        item.s=smooth(item.s,scale,1-Math.exp(-dt*14));

        item.el.style.setProperty('--il-x',item.x.toFixed(2)+'px');
        item.el.style.setProperty('--il-y',item.y.toFixed(2)+'px');
        item.el.style.setProperty('--il-r',item.r.toFixed(3)+'deg');
        item.el.style.setProperty('--il-s',item.s.toFixed(4));
        item.el.style.setProperty('--il-edge',edgeBias.toFixed(3));
      }
    }

    /* The whole word follows the field very slightly; the letters do the
       actual deformation, so the interaction reads as elastic typography. */
    var wordX=-(pointer.x-ecx)*field*.018;
    var wordY=-(pointer.y-ecy)*field*.010;
    var wordScale=1+field*(.006+energy*.006);
    email.style.setProperty('--if-x',wordX.toFixed(2)+'px');
    email.style.setProperty('--if-y',wordY.toFixed(2)+'px');
    email.style.setProperty('--if-scale',wordScale.toFixed(4));
  }

  raf=requestAnimationFrame60(frame);
}
raf=requestAnimationFrame60(frame);

})();
