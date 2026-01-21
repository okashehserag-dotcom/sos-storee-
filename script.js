(() => {
  const $ = (s, r=document) => r.querySelector(s);

  const LS = {
    theme: "sos_theme_final",
    like: (id) => `sos_like_${id}`,
    wish: "sos_wish_final",
    cart: "sos_cart_final",
    comments: (id) => `sos_comments_${id}`
  };

  const STORE = {
    brand: "SOS STORE",
    instagram: "https://instagram.com/sos_sstorre",
    themes: ["beige","dark","red"],
    tags: ["all","new","popular","limited","sale","accessory","classic","sport","lux"],
    collections: [
      { id:"c1", title:"New Arrivals", sub:"جاهز للتعبئة", tag:"new", color:"red" },
      { id:"c2", title:"Best Sellers", sub:"الأكثر طلبًا", tag:"popular", color:"blue" },
      { id:"c3", title:"Accessories", sub:"لمسة فخمة", tag:"accessory", color:"green" },
      { id:"c4", title:"Limited", sub:"كميات محدودة", tag:"limited", color:"yellow" },
      { id:"c5", title:"Classic", sub:"ستايل ثابت", tag:"classic", color:"blue" },
      { id:"c6", title:"Sport", sub:"خفيف وحيوي", tag:"sport", color:"green" },
      { id:"c7", title:"Sale", sub:"عروض", tag:"sale", color:"red" },
      { id:"c8", title:"Luxury", sub:"فخامة", tag:"lux", color:"yellow" }
    ],
    products: []
  };

  const state = { tag:"all", search:"", sort:"featured", pageSize:20, page:1, collectionId:null };

  function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
  function escXML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]))}
  function getJSON(k,f){try{const r=localStorage.getItem(k);return r?JSON.parse(r):f}catch{return f}}
  function setJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
  function isLiked(id){return localStorage.getItem(LS.like(id))==="1"}
  function debounce(fn,w){let t=null;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),w)}}
  function toast(m){const t=$("#toast"); if(!t) return; t.textContent=m; t.classList.add("is-show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("is-show"),1100)}
  function safeText(id, val){const el=document.getElementById(id); if(el) el.textContent=val}
  function formatPrice(n){return Number(n||0)+" JD"}

  function placeholderImg(brand, title){
    const bg="#E7D9C4", fg="#201810";
    const t1=escXML((brand||"SOS STORE").slice(0,18));
    const t2=escXML((title||"SOON").slice(0,22));
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#F8F0E3"/>
      </linearGradient></defs>
      <rect width="1200" height="1200" fill="url(#g)"/>
      <rect x="86" y="86" width="1028" height="1028" rx="90" fill="rgba(255,255,255,.35)" stroke="rgba(32,24,16,.16)"/>
      <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="96" fill="${fg}" opacity=".92" letter-spacing="10">${t1}</text>
      <text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="34" fill="${fg}" opacity=".60">${t2}</text>
      <text x="50%" y="66%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="30" fill="${fg}" opacity=".55">SOON</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }

  function seed(){
    const now=Date.now(), day=86400000;
    let n=1;
    const add=(cid,tags)=>{
      for(let i=0;i<22;i++){
        const id="p"+(n++);
        const title="SOS Item "+id.toUpperCase();
        const desc="جاهز للتعبئة — عدّل النص لاحقًا.";
        const price=10+(n%13)*4;
        STORE.products.push({
          id,title,desc,price,collection:cid,createdAt:now-(n*day),
          tags:Array.from(new Set(tags.concat(i%3===0?["popular"]:[]).concat(i%5===0?["limited"]:[]))),
          image:placeholderImg(STORE.brand,title)
        });
      }
    };
    add("c1",["new","classic","lux"]);
    add("c2",["popular","classic"]);
    add("c3",["accessory","lux"]);
    add("c4",["limited","lux"]);
    add("c5",["classic"]);
    add("c6",["sport","new"]);
    add("c7",["sale","popular"]);
    add("c8",["lux","classic"]);
  }

  function scoreFeatured(p){
    const t=new Set(p.tags||[]);
    return (t.has("popular")?5:0)+(t.has("limited")?3:0)+(t.has("new")?2:0);
  }

  function getFilteredSorted(){
    let items=STORE.products.slice();
    if(state.tag!=="all") items=items.filter(p=>(p.tags||[]).includes(state.tag));
    if(state.search){
      const q=state.search;
      items=items.filter(p=>(p.title||"").toLowerCase().includes(q)||(p.desc||"").toLowerCase().includes(q)||(p.tags||[]).some(t=>t.includes(q)));
    }
    switch(state.sort){
      case "newest": items.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)); break;
      case "priceLow": items.sort((a,b)=>(a.price||0)-(b.price||0)); break;
      case "priceHigh": items.sort((a,b)=>(b.price||0)-(a.price||0)); break;
      case "nameAZ": items.sort((a,b)=>(a.title||"").localeCompare(b.title||"","ar")); break;
      default: items.sort((a,b)=>scoreFeatured(b)-scoreFeatured(a));
    }
    return items;
  }

  function productCard(p){
    const liked=isLiked(p.id);
    const el=document.createElement("article");
    el.className="product";
    el.innerHTML=`
      <div class="product__media"><img src="${p.image}" alt="SOS STORE" loading="lazy" decoding="async"></div>
      <div class="product__body">
        <h3 class="product__title">${esc(p.title)}</h3>
        <p class="product__desc">${esc(p.desc)}</p>
        <div class="product__row">
          <span class="pill">${formatPrice(p.price)}</span>
          <span class="pill">${(p.tags||[]).slice(0,2).join(" • ").toUpperCase()}</span>
        </div>
        <div class="product__actions">
          <button class="actionBtn" data-like="${p.id}" ${liked?"disabled":""}>${liked?"Liked":"Like"}</button>
          <button class="actionBtn" data-comment="${p.id}">Comment</button>
          <button class="actionBtn" data-add="${p.id}">Add</button>
        </div>
      </div>`;
    return el;
  }

  function buildTags(){
    const opt=STORE.tags.map(t=>`<option value="${t}">${t.toUpperCase()}</option>`).join("");
    const tag=$("#tagSelect"); const col=$("#collectionFilter");
    if(tag) tag.innerHTML=opt;
    if(col) col.innerHTML=opt;
    if(tag) tag.value="all";
    if(col) col.value="all";
  }

  function buildCollections(){
    const grid=$("#collectionsGrid"); if(!grid) return;
    grid.innerHTML="";
    STORE.collections.forEach(c=>{
      const el=document.createElement("div");
      el.className="collectionCard";
      el.tabIndex=0;
      el.innerHTML=`<div class="collectionCard__top"><div class="collectionCard__title">${esc(c.title)}</div><div class="collectionCard__sub">${esc(c.sub)}</div></div><div class="collectionCard__bar"></div>`;
      el.onclick=()=>openCollection(c.id);
      el.onkeydown=(e)=>{if(e.key==="Enter") openCollection(c.id)};
      grid.appendChild(el);
    });
  }

  function renderProducts(append){
    const grid=$("#productsGrid"); if(!grid) return;
    if(!append) grid.innerHTML="";
    const all=getFilteredSorted();
    const slice=all.slice(0,state.page*state.pageSize);
    const existing=append?grid.children.length:0;
    slice.slice(existing).forEach(p=>grid.appendChild(productCard(p)));
    const lm=$("#loadMore");
    if(lm) lm.style.display = slice.length<all.length ? "inline-flex" : "none";
  }

  function openCollection(cid){
    const c=STORE.collections.find(x=>x.id===cid); if(!c) return;
    state.collectionId=cid;
    safeText("collectionTitle", c.title);
    safeText("collectionSub", c.sub);
    const drawer=document.getElementById("collectionDrawer");
    if(drawer) drawer.setAttribute("data-color", c.color);
    const cs=$("#collectionSearch"); const cf=$("#collectionFilter");
    if(cs) cs.value="";
    if(cf) cf.value="all";
    filterCollection();
    openDrawer("collection");
    toast("Opened: "+c.title);
  }

  function filterCollection(){
    const q=($("#collectionSearch")?.value||"").trim().toLowerCase();
    const tg=($("#collectionFilter")?.value||"all");
    const base=STORE.products.filter(p=>p.collection===state.collectionId);
    let items=base.slice();
    if(tg!=="all") items=items.filter(p=>(p.tags||[]).includes(tg));
    if(q) items=items.filter(p=>(p.title||"").toLowerCase().includes(q)||(p.desc||"").toLowerCase().includes(q)||(p.tags||[]).some(t=>t.includes(q)));
    const show=items.slice(0,20);
    const grid=$("#collectionGrid");
    if(grid){
      grid.innerHTML="";
      show.forEach(p=>grid.appendChild(productCard(p)));
    }
    safeText("colCount", show.length+" / "+base.length);
  }

  function openDrawer(key){
    const el = key==="cart" ? document.getElementById("cartDrawer")
      : key==="wish" ? document.getElementById("wishDrawer")
      : document.getElementById("collectionDrawer");
    if(!el) return;
    el.classList.add("is-open");
    document.body.style.overflow="hidden";
  }

  function closeDrawer(key){
    const el = key==="cart" ? document.getElementById("cartDrawer")
      : key==="wish" ? document.getElementById("wishDrawer")
      : document.getElementById("collectionDrawer");
    if(!el) return;
    el.classList.remove("is-open");
    if(!anyOpen() && !document.getElementById("commentModal")?.classList.contains("is-open")){
      document.body.style.overflow="";
    }
  }

  function anyOpen(){
    return ["cartDrawer","wishDrawer","collectionDrawer"].some(id=>document.getElementById(id)?.classList.contains("is-open"));
  }

  function syncCounts(){
    const wish=getJSON(LS.wish,[]);
    const cart=getJSON(LS.cart,{});
    safeText("wishCount", String(wish.length));
    safeText("cartCount", String(Object.values(cart).reduce((a,b)=>a+(b||0),0)));
  }

  function renderWish(){
    const wrap=$("#wishItems"); if(!wrap) return;
    const ids=getJSON(LS.wish,[]);
    if(!ids.length){wrap.innerHTML=`<div class="comment__text">لا يوجد عناصر</div>`;return;}
    wrap.innerHTML="";
    ids.slice(0,120).forEach(id=>{
      const p=STORE.products.find(x=>x.id===id); if(!p) return;
      const row=document.createElement("div");
      row.className="comment";
      row.innerHTML=`<div class="comment__top"><div class="comment__name">${esc(p.title)}</div><div class="comment__time">${formatPrice(p.price)}</div></div><div class="comment__text">${esc(p.desc)}</div>`;
      wrap.appendChild(row);
    });
  }

  function addToWish(id){
    const w=getJSON(LS.wish,[]);
    if(!w.includes(id)) w.unshift(id);
    setJSON(LS.wish,w.slice(0,400));
    renderWish();
    syncCounts();
  }

  function clearWish(){
    localStorage.removeItem(LS.wish);
    renderWish();
    syncCounts();
    toast("تم تفريغ المفضلة");
  }

  function renderCart(){
    const wrap=$("#cartItems"); if(!wrap) return;
    const cart=getJSON(LS.cart,{});
    const ids=Object.keys(cart);
    if(!ids.length){wrap.innerHTML=`<div class="comment__text">السلة فارغة</div>`; safeText("cartTotal","0"); return;}
    let total=0;
    wrap.innerHTML="";
    ids.forEach(id=>{
      const p=STORE.products.find(x=>x.id===id); if(!p) return;
      const q=cart[id]; total += (p.price||0)*q;
      const row=document.createElement("div");
      row.className="comment";
      row.innerHTML=`<div class="comment__top"><div class="comment__name">${esc(p.title)}</div><div class="comment__time">${formatPrice(p.price)} × ${q}</div></div>
      <div class="product__actions" style="margin-top:10px">
        <button class="actionBtn" data-qminus="${id}">-</button>
        <button class="actionBtn" data-qplus="${id}">+</button>
        <button class="actionBtn" data-remove="${id}">حذف</button>
      </div>`;
      wrap.appendChild(row);
    });
    safeText("cartTotal", String(total));
  }

  function addToCart(id,qty){
    const cart=getJSON(LS.cart,{});
    cart[id]=(cart[id]||0)+qty;
    if(cart[id]<=0) delete cart[id];
    setJSON(LS.cart,cart);
    renderCart();
    syncCounts();
  }

  function setQty(id,qty){
    const cart=getJSON(LS.cart,{});
    if(qty<=0) delete cart[id]; else cart[id]=qty;
    setJSON(LS.cart,cart);
    renderCart();
    syncCounts();
  }

  function clearCart(){
    localStorage.removeItem(LS.cart);
    renderCart();
    syncCounts();
    toast("تم تفريغ السلة");
  }

  function openComments(pid){
    const p=STORE.products.find(x=>x.id===pid); if(!p) return;
    safeText("commentTitle","تعليقات: "+p.title);
    safeText("commentSub","بدون نجوم — تعليق فقط");
    const form=$("#commentForm");
    if(form) form.dataset.pid=pid;
    const m=document.getElementById("commentModal");
    if(m) m.classList.add("is-open");
    document.body.style.overflow="hidden";
    renderComments(pid);
  }

  function closeComments(){
    const m=document.getElementById("commentModal");
    if(m) m.classList.remove("is-open");
    if(!anyOpen()) document.body.style.overflow="";
  }

  function renderComments(pid){
    const list=$("#commentList"); if(!list) return;
    const items=getJSON(LS.comments(pid),[]);
    if(!items.length){
      list.innerHTML=`<div class="comment"><div class="comment__top"><div class="comment__name">لا يوجد تعليقات</div><div class="comment__time">جاهز</div></div><div class="comment__text">اكتب أول تعليق.</div></div>`;
      return;
    }
    list.innerHTML=items.slice(0,80).map(c=>`
      <div class="comment">
        <div class="comment__top">
          <div class="comment__name">${esc(c.name)}</div>
          <div class="comment__time">${esc(c.time)}</div>
        </div>
        <div class="comment__text">${esc(c.text)}</div>
      </div>`).join("");
  }

  function initTheme(){
    const saved=localStorage.getItem(LS.theme);
    if(saved && STORE.themes.includes(saved)) document.documentElement.setAttribute("data-theme",saved);
    const btn=$("#themeBtn");
    if(!btn) return;
    btn.onclick=()=>{
      const cur=document.documentElement.getAttribute("data-theme")||"beige";
      const i=STORE.themes.indexOf(cur);
      const next=STORE.themes[(i+1)%STORE.themes.length];
      document.documentElement.setAttribute("data-theme",next);
      localStorage.setItem(LS.theme,next);
      toast(next);
    };
  }

  function initTop(){
    const btn=$("#toTop"); if(!btn) return;
    const on=()=>btn.classList.toggle("is-on",window.scrollY>650);
    window.addEventListener("scroll",debounce(on,80),{passive:true});
    btn.onclick=()=>window.scrollTo({top:0,behavior:"smooth"});
  }

  function initControls(){
    const gs=$("#globalSearch");
    if(gs){
      gs.addEventListener("input",debounce(()=>{
        state.search=gs.value.trim().toLowerCase();
        state.page=1;
        renderProducts(false);
      },140));
    }
    const sc=$("#searchClear");
    if(sc){
      sc.onclick=()=>{
        if(gs) gs.value="";
        state.search="";
        state.page=1;
        renderProducts(false);
        toast("تم مسح البحث");
      };
    }
    const ts=$("#tagSelect");
    if(ts) ts.onchange=(e)=>{state.tag=e.target.value;state.page=1;renderProducts(false)};
    const ss=$("#sortSelect");
    if(ss) ss.onchange=(e)=>{state.sort=e.target.value;state.page=1;renderProducts(false)};
    const rb=$("#resetBtn");
    if(rb){
      rb.onclick=()=>{
        state.tag="all";state.search="";state.sort="featured";state.page=1;
        if(gs) gs.value="";
        if(ts) ts.value="all";
        if(ss) ss.value="featured";
        renderProducts(false);
        toast("Reset");
      };
    }
    const lm=$("#loadMore");
    if(lm) lm.onclick=()=>{state.page+=1;renderProducts(true)};

    const cs=$("#collectionSearch");
    if(cs) cs.addEventListener("input",debounce(filterCollection,140));
    const cf=$("#collectionFilter");
    if(cf) cf.onchange=filterCollection;
    const cc=$("#collectionClear");
    if(cc) cc.onclick=()=>{ if(cs) cs.value=""; filterCollection(); };
  }

  function bindClicks(){
    document.addEventListener("click",(e)=>{
      const close = e.target.closest("[data-close]");
      if(close){
        const k=close.dataset.close;
        if(k==="cart") closeDrawer("cart");
        if(k==="wish") closeDrawer("wish");
        if(k==="collection") closeDrawer("collection");
        if(k==="comment") closeComments();
        return;
      }

      const like=e.target.closest("[data-like]");
      const com=e.target.closest("[data-comment]");
      const add=e.target.closest("[data-add]");
      const qm=e.target.closest("[data-qminus]");
      const qp=e.target.closest("[data-qplus]");
      const rm=e.target.closest("[data-remove]");

      if(like){
        const id=like.dataset.like;
        if(!id || isLiked(id)) return;
        localStorage.setItem(LS.like(id),"1");
        like.textContent="Liked";
        like.disabled=true;
        addToWish(id);
        toast("تم حفظ اللايك");
        return;
      }
      if(com){ openComments(com.dataset.comment); return; }
      if(add){ addToCart(add.dataset.add,1); toast("تمت الإضافة للسلة"); return; }

      if(qm){ const id=qm.dataset.qminus; const cart=getJSON(LS.cart,{}); setQty(id,(cart[id]||1)-1); return; }
      if(qp){ const id=qp.dataset.qplus; const cart=getJSON(LS.cart,{}); setQty(id,(cart[id]||0)+1); return; }
      if(rm){ setQty(rm.dataset.remove,0); return; }
    }, true);

    const cartBtn=$("#cartBtn");
    if(cartBtn) cartBtn.onclick=()=>{renderCart();openDrawer("cart")};

    const wishBtn=$("#wishBtn");
    if(wishBtn) wishBtn.onclick=()=>{renderWish();openDrawer("wish")};

    const clearC=$("#clearCart");
    if(clearC) clearC.onclick=clearCart;

    const clearW=$("#clearWish");
    if(clearW) clearW.onclick=clearWish;

    const checkout=$("#checkoutBtn");
    if(checkout){
      checkout.onclick=()=>{
        const cart=getJSON(LS.cart,{});
        const ids=Object.keys(cart);
        if(!ids.length){toast("السلة فارغة");return;}
        window.open(STORE.instagram,"_blank");
      };
    }

    const form=$("#commentForm");
    if(form){
      form.addEventListener("submit",(ev)=>{
        ev.preventDefault();
        const pid=form.dataset.pid;
        const name=$("#commentName")?.value.trim()||"";
        const text=$("#commentText")?.value.trim()||"";
        if(!pid || !name || !text) return;
        const items=getJSON(LS.comments(pid),[]);
        items.unshift({name,text,time:new Date().toLocaleString("ar-JO")});
        setJSON(LS.comments(pid),items.slice(0,160));
        if($("#commentName")) $("#commentName").value="";
        if($("#commentText")) $("#commentText").value="";
        renderComments(pid);
        toast("تم حفظ التعليق");
      });
    }

    const clearComments=$("#clearComments");
    if(clearComments){
      clearComments.onclick=()=>{
        const pid=$("#commentForm")?.dataset.pid;
        if(!pid) return;
        localStorage.removeItem(LS.comments(pid));
        renderComments(pid);
        toast("تم مسح التعليقات");
      };
    }

    ["cartDrawer","wishDrawer","collectionDrawer"].forEach(id=>{
      const d=document.getElementById(id);
      const p=d?.querySelector(".drawer__panel");
      if(p) p.addEventListener("click",(ev)=>ev.stopPropagation());
    });

    document.addEventListener("keydown",(e)=>{
      if(e.key==="Escape"){
        closeComments();
        closeDrawer("cart");
        closeDrawer("wish");
        closeDrawer("collection");
      }
    });
  }

  function boot(){
    safeText("year", String(new Date().getFullYear()));
    seed();
    buildTags();
    buildCollections();
    initTheme();
    initTop();
    initControls();
    bindClicks();
    renderProducts(false);
    renderCart();
    renderWish();
    syncCounts();
    toast("Ready");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
