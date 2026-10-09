/* DMR UI — shared by the homepage and the landing pages (2026-10-09).
   1. Carousels: any [data-car] holding a .car-track (a native horizontal scroller: touch swipe,
      trackpad, keyboard arrows when focused). Optional .car-prev / .car-next / .car-count.
      [data-car-select]: the arrows move the selected item (.on) instead of just scrolling.
      Controls hide themselves (.car-static) when everything already fits.
   2. One viewer (DMRLB.open(items, index)): previous/next stay usable while open, tap/click an
      image to zoom, swipe on phones, Esc / ✕ to close, page behind does not scroll.
      [data-lb-group] wires itself: each [data-lb] inside opens the group at its own index.
      Audit cards: data-lb-slug + data-lb-pages (+ data-lb-pdf) show every page of that audit. */
(function(){
'use strict';
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}

/* ---------- carousels ---------- */
function initCar(root){
  var t=root.querySelector('.car-track');if(!t||root._car)return;root._car=1;
  var prev=root.querySelector('.car-prev'),next=root.querySelector('.car-next'),cnt=root.querySelector('.car-count');
  if(!t.hasAttribute('tabindex'))t.tabIndex=0;
  function items(){return $$(':scope > *',t).filter(function(c){return c.getClientRects().length;});}
  function step(){var it=items();return it.length>1?it[1].offsetLeft-it[0].offsetLeft:t.clientWidth;}
  function index(){var it=items(),best=0,bd=1e9,o=it.length?it[0].offsetLeft:0;
    it.forEach(function(c,i){var d=Math.abs(c.offsetLeft-o-t.scrollLeft);if(d<bd){bd=d;best=i;}});
    if(t.scrollLeft+t.clientWidth>=t.scrollWidth-4&&it.length)best=Math.max(best,it.length-1-Math.max(0,Math.round(t.clientWidth/step())-1));
    return best;}
  function upd(){var over=t.scrollWidth>t.clientWidth+4;root.classList.toggle('car-static',!over);
    if(prev)prev.disabled=t.scrollLeft<4;if(next)next.disabled=t.scrollLeft+t.clientWidth>=t.scrollWidth-4;
    if(cnt){var n=items().length;cnt.textContent=(index()+1)+' / '+n;}}
  function move(d){
    if(root.hasAttribute('data-car-select')){var it=items(),cur=it.indexOf(t.querySelector('.on'));var k=Math.min(it.length-1,Math.max(0,cur+d));
      if(it[k]){it[k].click();it[k].scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});}return;}
    t.scrollBy({left:d*step(),behavior:'smooth'});}
  if(prev)prev.addEventListener('click',function(){move(-1);});
  if(next)next.addEventListener('click',function(){move(1);});
  t.addEventListener('keydown',function(e){if(e.target!==t)return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}else if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}});
  var raf=0;t.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(function(){raf=0;upd();});},{passive:true});
  window.addEventListener('resize',upd);
  upd();
}
function initAll(){$$('[data-car]').forEach(initCar);}

/* ---------- viewer ---------- */
var lb,body,ttl,num,bp,bn,bc,zl,zs,zi,onShow=null,items=[],at=0,last=null,sx=0,sy=0,drag=null;
var CSS='.dlb{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;background:rgba(17,27,42,.95)}'+
'.dlb[hidden]{display:none}'+
'.dlb-bar{display:flex;align-items:center;gap:.5rem;padding:.65rem .9rem;color:#fff;font-family:inherit}'+
'.dlb-t{flex:1;min-width:0;font-weight:600;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
'.dlb-n{font-size:.8rem;color:rgba(255,255,255,.75);margin-right:.2rem;white-space:nowrap}'+
'.dlb-b{flex:none;width:44px;height:44px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);background:transparent;color:#fff;font:inherit;font-size:1.25rem;line-height:1;display:grid;place-items:center;cursor:pointer;transition:border-color .2s}'+
'.dlb-b:hover{border-color:#fff}.dlb-b:disabled{opacity:.3;cursor:default}'+
'.dlb-body{flex:1;overflow:auto;padding:0 1rem 1rem;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}'+
'.dlb-in{max-width:980px;margin:0 auto}'+
'.dlb-body img{display:block;max-width:100%;height:auto;margin:0 auto 1rem;border-radius:8px;background:#fff;cursor:zoom-in}'+
'.dlb-zl{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;background:#0b121c}.dlb-zl[hidden]{display:none}'+
'.dlb-zs{flex:1;display:flex;overflow:auto;cursor:grab;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;outline:0}.dlb-zs.drag{cursor:grabbing}'+
'.dlb-zs img{display:block;flex:none;max-width:none;height:auto;margin:auto;background:#fff;user-select:none;-webkit-user-drag:none}'+
'.dlb-zc{position:absolute;top:.65rem;right:.9rem;z-index:1;background:rgba(17,27,42,.8)}'+

'.dlb-card{background:#fff;border-radius:14px;overflow:hidden;color:#3d4858}'+
'.dlb-link{display:table;margin:0 auto 1rem;padding:.6rem 1.1rem;border-radius:999px;background:#fff;color:#1d2e45;font-weight:700;font-size:.88rem;text-decoration:none}'+
'.dlb-hint{margin:0;padding:.25rem 0 .65rem;text-align:center;font-size:.74rem;color:rgba(255,255,255,.62)}'+
'@media(max-width:600px){.dlb-bar{padding:.55rem .6rem;gap:.35rem}.dlb-b{width:40px;height:40px}.dlb-body{padding:0 .6rem .8rem}}';
function build(){
  var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  lb=document.createElement('div');lb.className='dlb';lb.hidden=true;lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
  lb.innerHTML='<div class="dlb-bar"><span class="dlb-t"></span><span class="dlb-n"></span><button type="button" class="dlb-b dlb-p" aria-label="Previous">‹</button><button type="button" class="dlb-b dlb-x" aria-label="Next">›</button><button type="button" class="dlb-b dlb-c" aria-label="Close">✕</button></div><div class="dlb-body"></div><p class="dlb-hint">Tap a screenshot to zoom in · arrows or swipe for the next one</p>'+
    '<div class="dlb-zl" hidden><button type="button" class="dlb-b dlb-zc" aria-label="Zoom out">✕</button><div class="dlb-zs" tabindex="0"><img alt=""></div><p class="dlb-hint">Drag or swipe to move around · tap to zoom out</p></div>';
  document.body.appendChild(lb);
  body=lb.querySelector('.dlb-body');ttl=lb.querySelector('.dlb-t');num=lb.querySelector('.dlb-n');
  bp=lb.querySelector('.dlb-p');bn=lb.querySelector('.dlb-x');bc=lb.querySelector('.dlb-c');
  zl=lb.querySelector('.dlb-zl');zs=lb.querySelector('.dlb-zs');zi=zs.querySelector('img');
  bp.onclick=function(){show(at-1);};bn.onclick=function(){show(at+1);};bc.onclick=close;lb.querySelector('.dlb-zc').onclick=zoomOut;
  body.addEventListener('click',function(e){if(e.target.tagName==='IMG')zoomIn(e.target,e);});
  /* zoom layer: mouse drag pans (touch pans natively); a click without dragging zooms back out */
  zs.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;drag={x:e.clientX,y:e.clientY,l:zs.scrollLeft,t:zs.scrollTop,m:false};zs.classList.add('drag');});
  window.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.m=true;zs.scrollLeft=drag.l-dx;zs.scrollTop=drag.t-dy;});
  window.addEventListener('pointerup',function(){if(drag){zs.classList.remove('drag');setTimeout(function(){drag=null;},0);}});
  zs.addEventListener('click',function(){if(drag&&drag.m)return;zoomOut();});
  lb.addEventListener('touchstart',function(e){if(e.touches.length!==1)return;sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
  lb.addEventListener('touchend',function(e){if(!zl.hidden||!e.changedTouches.length)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>70&&Math.abs(dy)<60)show(at+(dx<0?1:-1));},{passive:true});
  document.addEventListener('keydown',function(e){if(lb.hidden)return;
    if(!zl.hidden){if(e.key==='Escape')zoomOut();return;}
    if(e.key==='Escape')close();else if(e.key==='ArrowRight')show(at+1);else if(e.key==='ArrowLeft')show(at-1);
    else if(e.key==='Tab'&&!lb.contains(document.activeElement)){e.preventDefault();bc.focus();}});
}
function zoomIn(img,e){var r=img.getBoundingClientRect(),rx=(e.clientX-r.left)/r.width,ry=(e.clientY-r.top)/r.height;
  zi.src=img.currentSrc||img.src;zi.alt=img.alt||'';zl.hidden=false;
  var w=Math.max(r.width*2.5,zs.clientWidth*1.5);zi.style.width=Math.round(w)+'px';
  function centre(){zs.scrollLeft=rx*zi.offsetWidth-zs.clientWidth/2;zs.scrollTop=ry*zi.offsetHeight-zs.clientHeight/2;}
  if(zi.complete)centre();else zi.onload=centre;zs.focus();}
function zoomOut(){if(!zl||zl.hidden)return;zl.hidden=true;zi.removeAttribute('src');bc.focus();}
function show(i){if(i<0||i>=items.length)return;zoomOut();at=i;var it=items[i];
  ttl.textContent=it.title||'';num.textContent=items.length>1?(i+1)+' / '+items.length:'';
  bp.disabled=i===0;bn.disabled=i===items.length-1;bp.hidden=bn.hidden=items.length<2;
  body.innerHTML='<div class="dlb-in">'+it.html+'</div>';body.scrollTop=0;lb.setAttribute('aria-label',it.title||'Viewer');
  if(onShow)try{onShow(i);}catch(err){}}
/* opts.onShow(i): lets the page keep its own carousel on the same result while the viewer moves */
function open(list,i,opts){if(!lb)build();items=list;onShow=opts&&opts.onShow||null;last=document.activeElement;show(i||0);lb.hidden=false;
  document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';bc.focus();}
function close(){if(!lb||lb.hidden)return;zoomOut();lb.hidden=true;body.innerHTML='';document.documentElement.style.overflow='';document.body.style.overflow='';if(last&&last.focus)last.focus();}

function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function itemFrom(el){var d=el.dataset,h='';
  if(d.lbSlug&&d.lbPages){for(var p=1;p<=+d.lbPages;p++)h+='<img src="/audits/'+esc(d.lbSlug)+'-'+p+'.webp" alt="'+esc(d.lbTitle)+', page '+p+'" loading="lazy" width="520" height="736">';
    if(d.lbPdf)h+='<a class="dlb-link" href="'+esc(d.lbPdf)+'" target="_blank" rel="noopener">Open the PDF</a>';}
  if(d.lbImgs)d.lbImgs.split(',').forEach(function(src){h+='<img src="'+esc(src.trim())+'" alt="'+esc(d.lbTitle)+'">';});
  var x=el.querySelector('template.lb-extra');if(x)h+=x.innerHTML;
  return {title:d.lbTitle||'',html:h};}
document.addEventListener('click',function(e){var el=e.target.closest&&e.target.closest('[data-lb]');if(!el)return;
  var g=el.closest('[data-lb-group]');var els=g?$$('[data-lb]',g):[el];e.preventDefault();
  open(els.map(itemFrom),els.indexOf(el));});

window.DMRLB={open:open,close:close};
window.DMRCar={init:initAll};
if(document.readyState!=='loading')initAll();else document.addEventListener('DOMContentLoaded',initAll);
})();
