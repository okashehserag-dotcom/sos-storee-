(() => {
  const STORE = {
    brand: "SOS STORE",
    instagram: "https://instagram.com/sos_sstorre",
    checkoutWhatsApp: "",
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
    products: seedProducts()
  };

  function seedProducts(){
    const now = Date.now();
    const day = 86400000;
    const items = [];
    let n = 1;

    const make = (collectionId, tags) => {
      for(let i=0;i<22;i++){
        const id = `p${n++}`;
        const title = `SOS Item ${id.toUpperCase()}`;
        const desc = "صورة داخلية باسم المحل + وصف جاهز للتعبئة بدون تعقيد.";
        const price = 10 + (n % 13) * 4;
        const createdAt = now - (n * day);
        items.push({
          id, title, desc, price, tags: Array.from(new Set(tags.concat(i%3===0?["popular"]:[]).concat(i%5===0?["limited"]:[]))),
          collection: collectionId,
          createdAt,
          image: placeholderImg(STORE.brand, title)
        });
      }
    };

    make("c1", ["new","classic","lux"]);
    make("c2", ["popular","classic"]);
    make("c3", ["accessory","lux"]);
    make("c4", ["limited","lux"]);
    make("c5", ["classic"]);
    make("c6", ["sport","new"]);
    make("c7", ["sale","popular"]);
    make("c8", ["lux","classic"]);

    return items;
  }

  function placeholderImg(brand, title){
    const bg = "#E7D9C4";
    const fg = "#201810";
    const t1 = escXML((brand || "SOS STORE").slice(0,18));
    const t2 = escXML((title || "SOON").slice(0,22));
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${bg}" stop-opacity="1"/>
            <stop offset="1" stop-color="#F8F0E3" stop-opacity="1"/>
          </linearGradient>
          <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="rgba(0,0,0,.18)"/>
          </filter>
        </defs>
        <rect width="1200" height="1200" fill="url(#g)"/>
        <rect x="86" y="86" width="1028" height="1028" rx="90" fill="rgba(255,255,255,.35)" stroke="rgba(32,24,16,.16)" filter="url(#s)"/>
        <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="96" fill="${fg}" opacity=".92" letter-spacing="10">${t1}</text>
        <text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="34" fill="${fg}" opacity=".60">${t2}</text>
        <text x="50%" y="66%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="30" fill="${fg}" opacity=".55">SOON</text>
      </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function escXML(s){
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;" }[c]));
  }

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const LS = {
    theme: "sos_theme_v2",
    like: (id) => `sos_like_${id}`,
    wish: "sos_wish_v2",
    cart: "sos_cart_v2",
    comments: (id) => `sos_comments_${id}`
  };

  const state = {
    tag: "all",
    search: "",
    sort: "featured",
    pageSize: 20,
    page: 1,
    collectionId: null,
    collectionItems: []
  };

  document.addEventListener("DOMContentLoaded", () => {
    $("#year").textContent = String(new Date().getFullYear());
    initTheme();
    initReveal();
    initTopButton();
    initControls();
    buildTagSelects();
    buildCollections();
    renderProducts(false);
    bindGlobalHandlers();
    syncCounts();
  });

  function initTheme(){
    const saved = localStorage.getItem(LS.theme);
    if(saved && STORE.themes.includes(saved)) document.documentElement.setAttribute("data-theme", saved);
    $("#themeBtn").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "beige";
      const idx = STORE.themes.indexOf(cur);
      const next = STORE.themes[(idx + 1) % STORE.themes.length];
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(LS.theme, next);
      toast(next === "beige" ? "Beige" : next === "dark" ? "Dark" : "Red");
    });
  }

  function initReveal(){
    const els = $$(".reveal");
    if(!("IntersectionObserver" in window)){ els.forEach(e=>e.classList.add("is-in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if(!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, {threshold:0.12});
    els.forEach(e=>io.observe(e));
  }

  function initTopButton(){
    const btn = $("#toTop");
    const on = () => btn.classList.toggle("is-on", window.scrollY > 650);
    window.addEventListener("scroll", debounce(on, 80), {passive:true});
    btn.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
  }

  function initControls(){
    const s = $("#globalSearch");
    const clear = $("#searchClear");

    s.addEventListener("input", debounce(() => {
      state.search = s.value.trim().toLowerCase();
      state.page = 1;
      renderProducts(false);
    }, 140));

    clear.addEventListener("click", () => {
      s.value = "";
      state.search = "";
      state.page = 1;
      renderProducts(false);
      toast("تم مسح البحث");
    });

    $("#tagSelect").addEventListener("change", (e) => {
      state.tag = e.target.value;
      state.page = 1;
      renderProducts(false);
    });

    $("#sortSelect").addEventListener("change", (e) => {
      state.sort = e.target.value;
      state.page = 1;
      renderProducts(false);
    });

    $("#resetBtn").addEventListener("click", () => {
      state.tag = "all";
      state.search = "";
      state.sort = "featured";
      state.page = 1;
      $("#globalSearch").value = "";
      $("#tagSelect").value = "all";
      $("#sortSelect").value = "featured";
      renderProducts(false);
      toast("Reset");
    });

    $("#loadMore").addEventListener("click", () => {
      state.page += 1;
      renderProducts(true);
    });
  }

  function buildTagSelects(){
    const options = STORE.tags.map(t => `<option value="${t}">${t.toUpperCase()}</option>`).join("");
    $("#tagSelect").innerHTML = options;
    $("#collectionFilter").innerHTML = options;
    $("#tagSelect").value = "all";
    $("#collectionFilter").value = "all";
  }

  function buildCollections(){
    const grid = $("#collectionsGrid");
    grid.innerHTML = "";
    STORE.collections.forEach(c => {
      const el = document.createElement("div");
      el.className = "collectionCard reveal";
      el.tabIndex = 0;
      el.setAttribute("role","button");
      el.innerHTML = `
        <div class="collectionCard__top">
          <div class="collectionCard__title">${esc(c.title)}</div>
          <div class="collectionCard__sub">${esc(c.sub)}</div>
        </div>
        <div class="collectionCard__bar"></div>
      `;
      el.addEventListener("click", () => openCollection(c.id));
      el.addEventListener("keydown", (e) => { if(e.key === "Enter") openCollection(c.id); });
      grid.appendChild(el);
    });
  }

  function openCollection(collectionId){
    const c = STORE.collections.find(x => x.id === collectionId);
    if(!c) return;

    state.collectionId = c.id;
    $("#collectionTitle").textContent = c.title;
    $("#collectionSub").textContent = c.sub;

    const drawer = $("#collectionDrawer");
    drawer.setAttribute("data-color", c.color);

    $("#collectionSearch").value = "";
    $("#collectionFilter").value = "all";

    const base = STORE.products.filter(p => p.collection === c.id);
    state.collectionItems = base.slice(0, 20);

    renderCollectionGrid(state.collectionItems);
    $("#colCount").textContent = `${state.collectionItems.length} / ${base.length}`;
    openDrawer("collection");
    toast(`Opened: ${c.title}`);
  }

  function renderCollectionGrid(items){
    const grid = $("#collectionGrid");
    grid.innerHTML = "";
    if(items.length === 0){
      grid.innerHTML = `<div class="muted">لا يوجد نتائج</div>`;
      return;
    }
    items.forEach(p => grid.appendChild(productCard(p, true)));
  }

  function filterCollection(){
    const q = $("#collectionSearch").value.trim().toLowerCase();
    const tg = $("#collectionFilter").value;
    const base = STORE.products.filter(p => p.collection === state.collectionId);

    let items = base.slice();
    if(tg !== "all") items = items.filter(p => (p.tags||[]).includes(tg));
    if(q) items = items.filter(p => (p.title||"").toLowerCase().includes(q) || (p.desc||"").toLowerCase().includes(q) || (p.tags||[]).some(t=>t.includes(q)));

    state.collectionItems = items.slice(0, 20);
    renderCollectionGrid(state.collectionItems);
    $("#colCount").textContent = `${state.collectionItems.length} / ${base.length}`;
  }

  function renderProducts(append){
    const grid = $("#productsGrid");
    if(!append) grid.innerHTML = "";

    const all = getFilteredSortedProducts();
    const slice = all.slice(0, state.page * state.pageSize);

    const existing = append ? grid.children.length : 0;
    const chunk = slice.slice(existing);

    chunk.forEach(p => grid.appendChild(productCard(p, false)));
    $("#loadMore").style.display = slice.length < all.length ? "inline-flex" : "none";
  }

  function getFilteredSortedProducts(){
    let items = STORE.products.slice();

    if(state.tag !== "all") items = items.filter(p => (p.tags||[]).includes(state.tag));
    if(state.search){
      const q = state.search;
      items = items.filter(p =>
        (p.title||"").toLowerCase().includes(q) ||
        (p.desc||"").toLowerCase().includes(q) ||
        (p.tags||[]).some(t => t.includes(q))
      );
    }

    switch(state.sort){
      case "newest": items.sort((a,b)=> (b.createdAt||0) - (a.createdAt||0)); break;
      case "priceLow": items.sort((a,b)=> (a.price||0) - (b.price||0)); break;
      case "priceHigh": items.sort((a,b)=> (b.price||0) - (a.price||0)); break;
      case "nameAZ": items.sort((a,b)=> (a.title||"").localeCompare(b.title||"", "ar")); break;
      default: items.sort((a,b)=> scoreFeatured(b) - scoreFeatured(a));
    }

    return items;
  }

  function scoreFeatured(p){
    const t = new Set(p.tags||[]);
    return (t.has("popular")?5:0) + (t.has("limited")?3:0) + (t.has("new")?2:0);
  }

  function productCard(p){
    const liked = isLiked(p.id);
    const el = document.createElement("article");
    el.className = "product";
    el.innerHTML = `
      <div class="product__media">
        <img src="${escAttr(p.image)}" alt="SOS STORE" loading="lazy" decoding="async">
      </div>
      <div class="product__body">
        <h3 class="product__title">${esc(p.title)}</h3>
        <p class="product__desc">${esc(p.desc)}</p>
        <div class="product__row">
          <span class="pill">${formatPrice(p.price)}</span>
          <span class="pill">${(p.tags||[]).slice(0,2).join(" • ").toUpperCase()}</span>
        </div>
        <div class="product__actions">
          <button class="actionBtn" data-like="${escAttr(p.id)}" ${liked ? "disabled" : ""}>${liked ? "Liked" : "Like"}</button>
          <button class="actionBtn" data-comment="${escAttr(p.id)}">Comment</button>
          <button class="actionBtn" data-add="${escAttr(p.id)}">Add</button>
        </div>
      </div>
    `;
    return el;
  }

  function bindGlobalHandlers(){
    document.addEventListener("click", (e) => {
      const close = e.target.closest("[data-close]");
      if(close){
        const key = close.dataset.close;
        if(key === "comment") closeComments();
        if(key === "cart") closeDrawer("cart");
        if(key === "wish") closeDrawer("wish");
        if(key === "collection") closeDrawer("collection");
        return;
      }

      const likeBtn = e.target.closest("[data-like]");
      const commentBtn = e.target.closest("[data-comment]");
      const addBtn = e.target.closest("[data-add]");

      if(likeBtn){
        const id = likeBtn.dataset.like;
        if(!id || isLiked(id)) return;
        localStorage.setItem(LS.like(id), "1");
        likeBtn.textContent = "Liked";
        likeBtn.disabled = true;
        addToWish(id);
        toast("تم حفظ اللايك");
        syncCounts();
        return;
      }

      if(commentBtn){
        openComments(commentBtn.dataset.comment);
        return;
      }

      if(addBtn){
        addToCart(addBtn.dataset.add, 1);
        toast("تمت الإضافة للسلة");
        syncCounts();
        return;
      }
    });

    $("#cartBtn").addEventListener("click", () => { renderCart(); openDrawer("cart"); });
    $("#wishBtn").addEventListener("click", () => { renderWish(); openDrawer("wish"); });

    $("#clearCart").addEventListener("click", () => { clearCart(); });
    $("#clearWish").addEventListener("click", () => { clearWish(); });

    $("#checkoutBtn").addEventListener("click", () => {
      const cart = getJSON(LS.cart, {});
      const ids = Object.keys(cart);
      if(ids.length === 0){ toast("السلة فارغة"); return; }

      const lines = ids.map(id => {
        const p = STORE.products.find(x => x.id === id);
        const q = cart[id];
        return p ? `${p.title} × ${q}` : "";
      }).filter(Boolean);

      const msg = encodeURIComponent(`طلب جديد من ${STORE.brand}:\n` + lines.join("\n"));
      if(STORE.checkoutWhatsApp){
        window.open(`https://wa.me/${STORE.checkoutWhatsApp}?text=${msg}`, "_blank");
      }else{
        window.open(STORE.instagram, "_blank");
      }
    });

    $("#commentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const pid = e.currentTarget.dataset.pid;
      const name = $("#commentName").value.trim();
      const text = $("#commentText").value.trim();
      if(!pid || !name || !text) return;

      const items = getJSON(LS.comments(pid), []);
      items.unshift({ name, text, time: new Date().toLocaleString("ar-JO") });
      setJSON(LS.comments(pid), items.slice(0, 160));
      $("#commentName").value = "";
      $("#commentText").value = "";
      renderComments(pid);
      toast("تم حفظ التعليق");
    });

    $("#clearComments").addEventListener("click", () => {
      const pid = $("#commentForm").dataset.pid;
      if(!pid) return;
      localStorage.removeItem(LS.comments(pid));
      renderComments(pid);
      toast("تم مسح التعليقات");
    });

    $("#collectionSearch").addEventListener("input", debounce(filterCollection, 140));
    $("#collectionFilter").addEventListener("change", filterCollection);

    $("#collectionClear").addEventListener("click", () => {
      $("#collectionSearch").value = "";
      filterCollection();
      toast("تم مسح بحث القسم");
    });

    ["cartDrawer","wishDrawer","collectionDrawer"].forEach(id => {
      const d = document.getElementById(id);
      if(!d) return;
      const panel = d.querySelector(".drawer__panel");
      if(panel) panel.addEventListener("click", (ev) => ev.stopPropagation());
    });

    document.addEventListener("keydown", (e) => {
      if(e.key === "Escape"){
        closeComments();
        closeDrawer("cart");
        closeDrawer("wish");
        closeDrawer("collection");
      }
    });
  }

  function openDrawer(key){
    const el = drawerEl(key);
    if(!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer(key){
    const el = drawerEl(key);
    if(!el) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden","true");
    if(!anyOpen() && !$("#commentModal").classList.contains("is-open")) document.body.style.overflow = "";
  }

  function anyOpen(){
    return ["cart","wish","collection"].some(k => drawerEl(k).classList.contains("is-open"));
  }

  function drawerEl(key){
    if(key === "cart") return $("#cartDrawer");
    if(key === "wish") return $("#wishDrawer");
    if(key === "collection") return $("#collectionDrawer");
    return null;
  }

  function openComments(productId){
    const p = STORE.products.find(x => x.id === productId);
    if(!p) return;

    $("#commentTitle").textContent = `تعليقات: ${p.title}`;
    $("#commentSub").textContent = "بدون نجوم — تعليق فقط";
    $("#commentForm").dataset.pid = productId;

    $("#commentName").value = "";
    $("#commentText").value = "";

    $("#commentModal").classList.add("is-open");
    $("#commentModal").setAttribute("aria-hidden","false");
    renderComments(productId);
    toast("Comments");
  }

  function closeComments(){
    const m = $("#commentModal");
    if(!m.classList.contains("is-open")) return;
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden","true");
    if(!anyOpen()) document.body.style.overflow = "";
  }

  function renderComments(productId){
    const list = $("#commentList");
    const items = getJSON(LS.comments(productId), []);
    if(items.length === 0){
      list.innerHTML = `<div class="comment"><div class="comment__top"><div class="comment__name">لا يوجد تعليقات</div><div class="comment__time">جاهز</div></div><div class="comment__text">اكتب أول تعليق.</div></div>`;
      return;
    }
    list.innerHTML = items.slice(0, 80).map(c => `
      <div class="comment">
        <div class="comment__top">
          <div class="comment__name">${esc(c.name)}</div>
          <div class="comment__time">${esc(c.time)}</div>
        </div>
        <div class="comment__text">${esc(c.text)}</div>
      </div>
    `).join("");
  }

  function addToWish(productId){
    const list = getJSON(LS.wish, []);
    if(!list.includes(productId)) list.unshift(productId);
    setJSON(LS.wish, list.slice(0, 400));
    renderWish();
  }

  function renderWish(){
    const wrap = $("#wishItems");
    const ids = getJSON(LS.wish, []);
    if(ids.length === 0){
      wrap.innerHTML = `<div class="muted">لا يوجد عناصر</div>`;
      return;
    }
    wrap.innerHTML = "";
    ids.slice(0, 120).forEach(id => {
      const p = STORE.products.find(x => x.id === id);
      if(!p) return;
      const row = document.createElement("div");
      row.className = "comment";
      row.innerHTML = `
        <div class="comment__top">
          <div class="comment__name">${esc(p.title)}</div>
          <div class="comment__time">${formatPrice(p.price)}</div>
        </div>
        <div class="comment__text">${esc(p.desc)}</div>
      `;
      wrap.appendChild(row);
    });
  }

  function clearWish(){
    localStorage.removeItem(LS.wish);
    renderWish();
    syncCounts();
    toast("تم تفريغ المفضلة");
  }

  function addToCart(productId, qty){
    const cart = getJSON(LS.cart, {});
    cart[productId] = (cart[productId] || 0) + qty;
    if(cart[productId] <= 0) delete cart[productId];
    setJSON(LS.cart, cart);
    renderCart();
  }

  function setQty(productId, qty){
    const cart = getJSON(LS.cart, {});
    if(qty <= 0) delete cart[productId];
    else cart[productId] = qty;
    setJSON(LS.cart, cart);
    renderCart();
  }

  function clearCart(){
    localStorage.removeItem(LS.cart);
    renderCart();
    syncCounts();
    toast("تم تفريغ السلة");
  }

  function renderCart(){
    const wrap = $("#cartItems");
    const cart = getJSON(LS.cart, {});
    const ids = Object.keys(cart);

    if(ids.length === 0){
      wrap.innerHTML = `<div class="muted">السلة فارغة</div>`;
      $("#cartTotal").textContent = "0";
      return;
    }

    let total = 0;
    wrap.innerHTML = "";

    ids.forEach(id => {
      const p = STORE.products.find(x => x.id === id);
      if(!p) return;
      const q = cart[id];
      total += (p.price || 0) * q;

      const row = document.createElement("div");
      row.className = "comment";
      row.innerHTML = `
        <div class="comment__top">
          <div class="comment__name">${esc(p.title)}</div>
          <div class="comment__time">${formatPrice(p.price)} × ${q}</div>
        </div>
        <div class="product__actions" style="margin-top:10px">
          <button class="actionBtn" data-qminus="${escAttr(id)}">-</button>
          <button class="actionBtn" data-qplus="${escAttr(id)}">+</button>
          <button class="actionBtn" data-remove="${escAttr(id)}">حذف</button>
        </div>
      `;
      wrap.appendChild(row);
    });

    $("#cartTotal").textContent = String(total);

    wrap.onclick = (e) => {
      const minus = e.target.closest("[data-qminus]");
      const plus = e.target.closest("[data-qplus]");
      const remove = e.target.closest("[data-remove]");
      if(!minus && !plus && !remove) return;

      const cart = getJSON(LS.cart, {});
      if(minus){
        const id = minus.dataset.qminus;
        setQty(id, (cart[id]||1) - 1);
        syncCounts();
        return;
      }
      if(plus){
        const id = plus.dataset.qplus;
        setQty(id, (cart[id]||0) + 1);
        syncCounts();
        return;
      }
      if(remove){
        const id = remove.dataset.remove;
        setQty(id, 0);
        syncCounts();
      }
    };
  }

  function syncCounts(){
    const wish = getJSON(LS.wish, []);
    $("#wishCount").textContent = String(wish.length);

    const cart = getJSON(LS.cart, {});
    const count = Object.values(cart).reduce((a,b)=>a+(b||0),0);
    $("#cartCount").textContent = String(count);
  }

  function isLiked(id){
    return localStorage.getItem(LS.like(id)) === "1";
  }

  function toast(msg){
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-show"), 1200);
  }

  function formatPrice(n){
    return `${Number(n||0)} JD`;
  }

  function debounce(fn, wait){
    let t=null;
    return (...args) => {
      clearTimeout(t);
      t=setTimeout(()=>fn(...args), wait);
    };
  }

  function esc(s){
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  }

  function escAttr(s){
    return esc(s).replace(/`/g, "&#096;");
  }

  function getJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch{
      return fallback;
    }
  }

  function setJSON(key, val){
    localStorage.setItem(key, JSON.stringify(val));
  }
})();
