  // ========= SHEETS CONFIG =========
  const SHEET_ID = "16fNB7oX2-PIIuNDjrzL3xgtNSQTTnxC2gxW2x78GoHI";
  const SHEET_NAME = "Produk";
  const DEFAULT_WA = "6282340915319";
  const SHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

  // ========= STATE =========
  let produkVariants = []; // tiap baris sheet = varian
  let produkGroups = [];   // hasil dikelompokkan per kolom group
  let viewData = [];
  let page = 1;
  const perPage = 12;

  const produkList = document.getElementById("produk-list");
  const searchInput = document.getElementById("searchInput");
  const btnLoadMore = document.getElementById("btnLoadMore");


  const CART_KEY = "pbt_cart";
  const WISH_KEY = "pbt_wishlist";

  const categoryIconsFA = {
    "Langganan":"fa-bell","Streaming":"fa-tv","Penyimpanan":"fa-hard-drive","Software":"fa-puzzle-piece",
    "Desain":"fa-palette","Produktivitas":"fa-book","AI Tools":"fa-robot","Keamanan":"fa-shield-halved",
    "Game":"fa-gamepad","Voucher":"fa-gift","Instagram":"fa-brands fa-instagram","TikTok":"fa-brands fa-tiktok"
  };
  const categories = [
    {value:"", label:"Semua", icon:"fa-rotate"},
    ...["Instagram","TikTok","Langganan","Streaming","Penyimpanan","Software","Desain","Produktivitas","AI Tools","Keamanan","Game","Voucher"]
      .map(k=>({value:k,label:k,icon:categoryIconsFA[k]}))
  ];

  const money = n => `Rp${(Number(n)||0).toLocaleString('id-ID')}`;
  const getStorage = (k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}};;
  const setStorage = (k,v)=>localStorage.setItem(k,JSON.stringify(v));

  function setNavOffset(){
    const nav = document.getElementById('mainNavbar');
    if(!nav) return;
    const h = nav.offsetHeight || 64;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  window.addEventListener('resize', setNavOffset);
  document.addEventListener('shown.bs.collapse', setNavOffset);
  document.addEventListener('hidden.bs.collapse', setNavOffset);

  function showLoading(){
    produkList.innerHTML=`<div class="col-12"><div class="loading"><div class="spinner"></div></div></div>`;
  }

  // ===== Bangun grup dari varian (pakai kolom group) =====
  function buildGroups(){
    const map = new Map();

    produkVariants.forEach(v =>{
      const key = v.group || v.nama; // kalau group kosong, fallback nama
      let g = map.get(key);
      if(!g){
        g = {
          key,
          title: key,
          kategori: v.kategori,
          ikon: v.ikon,
          wa: v.wa || DEFAULT_WA,
          variants: [],
          minHarga: v.harga || 0,
          maxHargaLama: v.harga_lama || 0,
          available: Number(v.stok) > 0
        };
        map.set(key,g);
      }
      g.variants.push(v);
      if((v.harga || 0) < g.minHarga) g.minHarga = v.harga || 0;
      if((v.harga_lama || 0) > g.maxHargaLama) g.maxHargaLama = v.harga_lama || 0;
      if(Number(v.stok)>0) g.available = true;
    });

    produkGroups = Array.from(map.values());
  }

  // ===== Filter & Sort di level group =====
  function applyFilterSort(){
    const q = (searchInput.value || "").toLowerCase();

    viewData = produkGroups.filter(g=>{
      const inTitle    = (g.title || "").toLowerCase().includes(q);
      const inVariants = g.variants.some(v => (v.nama || "").toLowerCase().includes(q));
      return (inTitle || inVariants);
    });

    page = 1;
  }



  // ===== Render card per group =====
  function renderProduk(append=false){
    const start=(page-1)*perPage;
    const slice=viewData.slice(start,start+perPage);

    if(!append) produkList.innerHTML="";

    if(slice.length===0 && !append){
      produkList.innerHTML=`
        <div class="col-12">
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <h4>Produk tidak ditemukan</h4>
            <p>Coba ubah kata kunci atau filter</p>
          </div>
        </div>`;
      btnLoadMore.style.display="none";
      return;
    }

    slice.forEach((group,idx)=>{
      const col=document.createElement("div");
      col.className="col-lg-3 col-md-4 col-sm-6 col-6";

      const catIconClass = categoryIconsFA[group.kategori] || "fa-box";
      const hasDiscount  = (group.maxHargaLama||0) > (group.minHarga||0);
      const stokOK       = !!group.available;

      const wishlist=getStorage(WISH_KEY,[]);
      const wished = wishlist.includes(group.key);

      col.innerHTML=`
        <div class="card product-card fade-in" style="animation-delay:${idx*0.03}s" data-card-idx="${idx+start}" ${stokOK?'':'data-disabled="true"}>
          <button class="wishlist-btn ${wished?'active':''}" title="Favorit"
                  data-wish="${encodeURIComponent(group.key)}">
            <i class="fa-solid fa-heart"></i>
          </button>
          <div class="category-badge">
            <i class="fa-solid ${catIconClass}"></i>
            <span>${group.kategori || ''}</span>
          </div>
          <div class="card-body p-3 text-center">
            <div class="product-icon">
              <img src="${group.ikon||''}" alt="${group.title||''}"
                   onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjZmZmIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg=='">
            </div>
            <h6 class="product-title">${group.title||''}</h6>
            <div class="price-wrap">
              <span class="price">Mulai ${money(group.minHarga)}</span>
              ${hasDiscount?`<span class="price-old">${money(group.maxHargaLama)}</span>`:""}
            </div>
            <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
              <span class="badge ${stokOK?'bg-success-subtle text-success-emphasis':'bg-danger-subtle text-danger-emphasis'}">
                ${stokOK?'Tersedia':'Habis'}
              </span>
              <span class="badge bg-secondary-subtle text-secondary-emphasis">
                ${group.variants.length} varian
              </span>
            </div>
            <div class="product-actions d-flex">
              <button class="btn-detail icon-btn" 
                      data-detail="${idx+start}" 
                      aria-label="Lihat varian"
                      type="button">
                <i class="fa-solid fa-circle-info"></i>
              </button>
              <a class="quick-wa icon-btn ${stokOK?'':'disabled'}"
                 ${stokOK?'':'aria-disabled="true"'}
                 target="_blank" aria-label="WhatsApp"
                 href="https://wa.me/${encodeURIComponent(group.wa||DEFAULT_WA)}?text=${
                   encodeURIComponent(`Halo admin, saya tertarik dengan ${group.title}. Mohon info detail varian & harganya.`)
                 }">
                <i class="fa-brands fa-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>`;
      produkList.appendChild(col);
    });

    btnLoadMore.style.display = (viewData.length > (start + slice.length)) ? "inline-block" : "none";
  }

  // ===== Modal Detail & varian =====
  const modalEl=document.getElementById('produkModal');
  const bsModal=new bootstrap.Modal(modalEl);
  const modalAddCart=document.getElementById('modalAddCart');
  const modalBody=document.getElementById('modalBody');
  let currentDetailIdx=null;

  // Optimasi: Cache untuk render varian
  let cachedVariantsHTML = new Map();

  function buildVariantHTML(v, i, group) {
    const cacheKey = `${v.nama}-${v.harga}-${v.stok}`;
    if (cachedVariantsHTML.has(cacheKey)) {
      return cachedVariantsHTML.get(cacheKey);
    }

    const stokOK = Number(v.stok) > 0;
    const fiturHTML = (v.deskripsi||[]).length > 0 
      ? `<ul class="variant-features list-unstyled mb-2">${
          (v.deskripsi||[]).map(li => 
            `<li class="variant-feature-item"><i class="fas fa-check-circle variant-feature-icon me-2"></i><span>${li}</span></li>`
          ).join("")
        }</ul>` 
      : "";

    const html = `
      <div class="variant-card mb-3">
        <div class="variant-card-header d-flex justify-content-between align-items-start mb-2">
          <div>
            <div class="variant-card-title fw-semibold">${v.nama}</div>
            <div class="variant-card-label small text-muted">Varian ${i+1}</div>
          </div>
          <div class="text-end">
            <div class="variant-card-price fw-bold">${money(v.harga)}</div>
            ${(v.harga_lama && v.harga_lama>v.harga) ? `<div class="variant-card-price-old small">${money(v.harga_lama)}</div>` : ""}
            <div class="mt-1">
              <span class="badge ${stokOK?'bg-success-subtle text-success-emphasis':'bg-danger-subtle text-danger-emphasis'}">
                ${stokOK?'Tersedia':'Habis'}
              </span>
            </div>
          </div>
        </div>
        ${fiturHTML}
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-outline-primary" data-add-variant="${encodeURIComponent(v.nama)}" ${stokOK ? '' : 'disabled'}>
            <i class="fa-solid fa-cart-plus me-1"></i>Keranjang
          </button>
          <a href="https://wa.me/${encodeURIComponent(v.wa || group.wa || DEFAULT_WA)}?text=${encodeURIComponent(`Halo admin, saya ingin pesan ${v.nama} (${money(v.harga)})`)}"
            target="_blank" class="btn btn-sm btn-success ${stokOK ? '' : 'disabled'}">
            <i class="fab fa-whatsapp me-1"></i>Pesan varian ini
          </a>
        </div>
      </div>`;
    
    cachedVariantsHTML.set(cacheKey, html);
    return html;
  }

  function showDetailByGlobalIndex(globalIdx){
    const group = viewData[globalIdx];
    currentDetailIdx = globalIdx;

    // Tampilkan loading indicator terlebih dahulu
    modalBody.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    // Gunakan requestAnimationFrame untuk rendering yang lebih smooth
    requestAnimationFrame(() => {
      bsModal.show();
      
      // Render konten setelah modal ditampilkan
      setTimeout(() => {
        const catIconClass = categoryIconsFA[group.kategori] || "fa-box";
        const primaryVariant = group.variants.find(v => Number(v.stok)>0) || group.variants[0];

        // Render varian dengan batch untuk performa lebih baik
        const variantsHTML = group.variants.map((v, i) => buildVariantHTML(v, i, group)).join("");

        modalBody.innerHTML = `
          <div class="modal-product-main mb-3">
            <div class="row align-items-center g-3">
              <div class="col-md-4 text-center mb-2 mb-md-0">
                <div class="product-icon modal-product-icon mx-auto">
                  <img src="${group.ikon || ''}" alt="${group.title || ''}"
                      style="width:60px;height:60px;"
                      onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHJ4PSIxMiIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjZTJlOGYwIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4='">
                </div>
                <span class="badge modal-category-pill mt-2 d-inline-flex align-items-center gap-1">
                  <i class="fa-solid ${catIconClass}"></i>
                  <span>${group.kategori || ''}</span>
                </span>
              </div>
              <div class="col-md-8">
                <h5 class="modal-product-title mb-1">${group.title || ''}</h5>
                <p class="modal-product-subtitle mb-2">
                  Tersedia <strong>${group.variants.length} varian</strong> dengan harga mulai
                  <strong>${money(group.minHarga)}</strong>
                </p>
                <div class="modal-product-prices d-flex align-items-baseline gap-2">
                  <span class="modal-price-main">${money(group.minHarga)}</span>
                  ${(group.maxHargaLama && group.maxHargaLama>group.minHarga)
                    ? `<span class="modal-price-old">${money(group.maxHargaLama)}</span>`
                    : ""
                  }
                </div>
              </div>
            </div>
          </div>

          <hr class="my-3">

          <div class="modal-variant-list">
            ${variantsHTML}
          </div>
        `;

        const modalPesanBtn = document.getElementById("modalPesanBtn");
        if(primaryVariant){
          modalPesanBtn.href =
            `https://wa.me/${encodeURIComponent(primaryVariant.wa || group.wa || DEFAULT_WA)}?text=${
              encodeURIComponent(`Halo admin, saya ingin pesan ${primaryVariant.nama} (${money(primaryVariant.harga)})`)
            }`;
          modalAddCart.disabled = !(Number(primaryVariant.stok)>0);
          modalAddCart.dataset.primaryVariant = primaryVariant.nama;
        }else{
          modalPesanBtn.href = "#";
          modalAddCart.disabled = true;
          delete modalAddCart.dataset.primaryVariant;
        }
      }, 50); // Delay minimal untuk smooth transition
    });
  }

  (function enableModalSwipeClose(){
    const content=document.getElementById('produkModalContent'); let startY=null;
    content.addEventListener('touchstart',e=>{startY=e.touches[0].clientY;},{passive:true});
    content.addEventListener('touchmove',e=>{
      if(startY===null)return;
      const dy=e.touches[0].clientY-startY;
      if(dy>80){startY=null; bsModal.hide();}
    }, {passive:true});
    content.addEventListener('touchend',()=>{startY=null;});
  })();

  modalBody.addEventListener('click',(e)=>{
    const btn = e.target.closest('[data-add-variant]');
    if(!btn) return;
    const namaVar = decodeURIComponent(btn.dataset.addVariant);
    addToCart(namaVar,1);
    new bootstrap.Offcanvas('#offcanvasCart').show();
  });



  // ===== Load data dari Sheet =====
  async function loadProdukFromSheet(){
    showLoading();
    try{
      // Bersihkan cache HTML varian sebelum reload
      cachedVariantsHTML.clear();
      
      const res=await fetch(SHEET_JSON_URL,{cache:'no-store'});
      const text=await res.text();
      const json=JSON.parse(text.substring(47,text.length-2));
      const rows=json.table.rows||[];

      // nama, harga, ikon, deskripsi, kategori, wa, harga_lama, stok, kode, group
      produkVariants = rows.map((r,idx)=>{
        const c=r.c||[];
        const nama       = c[0]?.v ?? "";
        const harga      = Number(c[1]?.v ?? 0) || 0;
        const ikon       = c[2]?.v ?? "";
        const deskripsi  = (c[3]?.v ?? "").toString().split("||").map(s=>s.trim()).filter(Boolean);
        const kategori   = c[4]?.v ?? "";
        const wa         = c[5]?.v ?? DEFAULT_WA;
        const harga_lama = Number(c[6]?.v ?? 0) || 0;
        const stok       = Number(c[7]?.v ?? 0) || 0;
        const kode       = c[8]?.v ?? "";
        const group      = c[9]?.v ?? "";
        return { id:idx, nama, harga, ikon, deskripsi, kategori, wa, harga_lama, stok, kode, group };
      });

      buildGroups();
      applyFilterSort();
      renderProduk(false);
      document.body.classList.add('loaded');
    }catch(err){
      console.error(err);
      produkList.innerHTML=`
        <div class="col-12">
          <div class="empty-state">
            <i class="fas fa-triangle-exclamation"></i>
            <h4>Gagal memuat data</h4>
            <p>Cek pengaturan share Sheet, ID, dan kolom group</p>
            <code>${SHEET_JSON_URL}</code>
          </div>
        </div>`;
      btnLoadMore.style.display="none";
    }
  }

  // ===== Cart & Wishlist =====
  function getCart(){return getStorage(CART_KEY,[]);}
  function setCart(c){setStorage(CART_KEY,c); updateCartUI();}
  function addToCart(name,qty=1){
    const item = produkVariants.find(p=>p.nama===name);
    if(!item || !(Number(item.stok)>0)) return;
    const cart=getCart();
    const ex=cart.find(ci=>ci.nama===name);
    if(ex){ex.qty+=qty;}
    else{cart.push({nama:item.nama,harga:item.harga,wa:item.wa||DEFAULT_WA,qty});}
    setCart(cart);
  }
  function removeFromCart(name){setCart(getCart().filter(ci=>ci.nama!==name));}
  function changeQty(name,delta){
    const cart=getCart(); const it=cart.find(ci=>ci.nama===name); if(!it)return;
    it.qty=Math.max(1,(it.qty||1)+delta); setCart(cart);
  }
  function clearCart(){setCart([]);}

  function updateCartUI(){
    const cart=getCart();
    const totalQty = cart.reduce((a,b)=>a+(b.qty||1),0);
    document.getElementById("cartCount").textContent=totalQty;

    const wrap=document.getElementById("cartItems");
    if(cart.length===0){
      wrap.innerHTML=`<div class="empty-state"><i class="fa-regular fa-face-frown"></i><p>Keranjang kosong</p></div>`;
      document.getElementById("cartTotal").textContent=money(0);
      document.getElementById("btnCheckoutWA").href="#";
      document.getElementById('navCartCount').textContent = 0;
      document.dispatchEvent(new CustomEvent('pbt:cart-updated',{detail:{count:0,total:0}}));
      return;
    }
    let total=0;
    wrap.innerHTML=cart.map(ci=>{
      const sub=(ci.harga||0)*(ci.qty||1); total+=sub;
      return `
      <div class="d-flex align-items-center justify-content-between border rounded-3 p-2 mb-2">
        <div>
          <div class="fw-bold">${ci.nama}</div>
          <div class="text-muted small">${money(ci.harga)} × ${ci.qty}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" data-qtyminus="${encodeURIComponent(ci.nama)}">-</button>
          <button class="btn btn-sm btn-outline-secondary" data-qtyplus="${encodeURIComponent(ci.nama)}">+</button>
          <button class="btn btn-sm btn-outline-danger" data-remove="${encodeURIComponent(ci.nama)}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }).join("");
    document.getElementById("cartTotal").textContent=money(total);
    const lines=cart.map(ci=>`• ${ci.nama} x${ci.qty} = ${money(ci.harga*ci.qty)}`).join('\n');
    const text=`Halo admin, saya ingin checkout:\n${lines}\n\nTotal: ${money(total)}\n\nTerima kasih.`;
    const uniqueWAs=[...new Set(cart.map(c=>c.wa||DEFAULT_WA))];
    const waTarget=uniqueWAs.length===1?uniqueWAs[0]:DEFAULT_WA;
    document.getElementById("btnCheckoutWA").href=`https://wa.me/${encodeURIComponent(waTarget)}?text=${encodeURIComponent(text)}`;

    document.getElementById('navCartCount').textContent = totalQty;
    document.dispatchEvent(new CustomEvent('pbt:cart-updated',{detail:{count:totalQty,total}}));
  }

  function toggleWishlist(key){
    const list=getStorage(WISH_KEY,[]);
    const i=list.indexOf(key);
    if(i>-1) list.splice(i,1);
    else list.push(key);
    setStorage(WISH_KEY,list);
  }

  // ===== Events =====
  searchInput.addEventListener("input",()=>{applyFilterSort();renderProduk(false);});

  // Optimasi: Debounce untuk mencegah multiple klik bersamaan
  let lastClickTime = 0;
  const CLICK_DEBOUNCE = 150; // ms

  produkList.addEventListener("click",e=>{
    // Handle wishlist button (priority tertinggi)
    const wishBtn = e.target.closest("[data-wish]");
    if(wishBtn){
      e.stopPropagation();
      toggleWishlist(decodeURIComponent(wishBtn.dataset.wish));
      wishBtn.classList.toggle('active');
      return;
    }
    
    // Handle WhatsApp link (biarkan default behavior)
    const waLink = e.target.closest(".quick-wa");
    if(waLink){
      e.stopPropagation();
      return;
    }
    
    // Handle tombol detail (priority kedua)
    const detailBtn = e.target.closest(".btn-detail, [data-detail]");
    if(detailBtn && detailBtn.hasAttribute('data-detail')){
      e.preventDefault();
      e.stopPropagation();
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE) return;
      lastClickTime = now;
      const idx = parseInt(detailBtn.getAttribute('data-detail'), 10);
      if(!isNaN(idx)){
        showDetailByGlobalIndex(idx);
      }
      return;
    }
    
    // Handle card click (fallback)
    const card = e.target.closest(".product-card[data-card-idx]");
    if(card && !card.hasAttribute('data-disabled')){
      const now = Date.now();
      if (now - lastClickTime < CLICK_DEBOUNCE) return;
      lastClickTime = now;
      const idx = parseInt(card.getAttribute('data-card-idx'), 10);
      if(!isNaN(idx)){
        showDetailByGlobalIndex(idx);
      }
    }
  });

  document.getElementById("cartItems").addEventListener("click",e=>{
    const t=e.target.closest("[data-qtyminus],[data-qtyplus],[data-remove]"); if(!t)return;
    if(t.dataset.qtyminus){changeQty(decodeURIComponent(t.dataset.qtyminus),-1);}
    else if(t.dataset.qtyplus){changeQty(decodeURIComponent(t.dataset.qtyplus),+1);}
    else if(t.dataset.remove){removeFromCart(decodeURIComponent(t.dataset.remove));}
  });
  document.getElementById("btnClearCart").addEventListener("click",()=>clearCart());
  document.getElementById("btnLoadMore").addEventListener("click",()=>{page+=1;renderProduk(true);});

  document.getElementById("modalAddCart").addEventListener("click",()=>{
    const primaryName = document.getElementById("modalAddCart").dataset.primaryVariant;
    if(!primaryName) return;
    addToCart(primaryName,1);
    new bootstrap.Offcanvas('#offcanvasCart').show();
  });

  // ===== Dark mode, nav, sinkron cart =====
  (function initTheme(){
    const saved=localStorage.getItem("pbt_theme")||"light";
    document.documentElement.setAttribute("data-theme",saved);
    const darkBtn=document.getElementById("floatingDarkBtn");
    const setIcon=()=>{darkBtn.innerHTML=`<i class="fa-solid ${document.documentElement.getAttribute('data-theme')==='dark'?'fa-sun':'fa-moon'}"></i>`;}
    setIcon();
    darkBtn.addEventListener("click",()=>{
      const mode=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
      document.documentElement.setAttribute("data-theme",mode);
      localStorage.setItem("pbt_theme",mode);
      setIcon();
      const navBtn=document.getElementById('navDarkBtn');
      if(navBtn){ navBtn.innerHTML = `<i class="fa-solid ${mode==='dark'?'fa-sun':'fa-moon'}"></i>`; }
    });
  })();

  // ==== NAVBAR SEARCH OVERLAY (multi button + auto-scroll) ====
  (function initNavbarSearch(){
    const searchBtns = document.querySelectorAll('[data-nav-search]');
    const searchOverlay = document.getElementById('searchOverlay');
    const btnCloseSearch = document.getElementById('btnCloseSearch');

    if(!searchBtns.length || !searchOverlay || !searchInput) return;

    function openSearch(){
      searchOverlay.classList.add('open');

      // Auto-scroll ke section produk
      const produkSection = document.getElementById('listProduk');
      if (produkSection) {
        produkSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Fokus input setelah sedikit delay biar animasi halus
      setTimeout(() => searchInput.focus(), 120);
    }

    function closeSearch(){
      searchOverlay.classList.remove('open');
      searchInput.blur();
    }

    function toggleSearch(){
      if (searchOverlay.classList.contains('open')) closeSearch();
      else openSearch();
    }

    // Semua tombol dengan data-nav-search pakai behavior yang sama
    searchBtns.forEach(btn => {
      btn.addEventListener('click', toggleSearch);
    });

    if (btnCloseSearch) {
      btnCloseSearch.addEventListener('click', closeSearch);
    }

    // ESC untuk menutup
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') closeSearch();
    });
  })();



  document.addEventListener('click',(e)=>{
    const a=e.target.closest('a[data-scroll][href^="#"]');
    if(!a) return;
    e.preventDefault();
    const sel=a.getAttribute('href');
    const el=document.querySelector(sel);
    if(el) el.scrollIntoView({behavior:'smooth'});
    const coll=document.getElementById('mainNav');
    if(coll && coll.classList.contains('show')) new bootstrap.Collapse(coll).hide();
  });

  (function setActiveNav(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(n=>{
      const href = n.getAttribute('href');
      if(n.hasAttribute('data-scroll') && (path==='index.html' || path==='')) n.classList.add('active');
      else if(href && href.endsWith(path)) n.classList.add('active');
    });
  })();

  (function hookNavbarDark(){
    const btn = document.getElementById('navDarkBtn');
    if(!btn) return;
    const setIcon=()=>{ btn.innerHTML = `<i class="fa-solid ${document.documentElement.getAttribute('data-theme')==='dark'?'fa-sun':'fa-moon'}"></i>`; };
    setIcon();
    btn.addEventListener('click', ()=>{
      const mode=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',mode);
      localStorage.setItem('pbt_theme',mode);
      setIcon();
      const floatingBtn = document.getElementById('floatingDarkBtn');
      if(floatingBtn) floatingBtn.innerHTML = btn.innerHTML;
    });
  })();

  (function syncCartCountToNav(){
    const navCount = document.getElementById('navCartCount');
    if(!navCount) return;
    document.addEventListener('pbt:cart-updated',(e)=>{
      if(typeof e.detail?.count === 'number') navCount.textContent = e.detail.count;
    });
    const initCart = getStorage(CART_KEY,[]);
    navCount.textContent = initCart.reduce((a,b)=>a+(b.qty||1),0);
  })();

  document.addEventListener('DOMContentLoaded', ()=>{
    setNavOffset();
    loadProdukFromSheet();
    updateCartUI();

    // Set tahun footer
    const fy = document.getElementById('footerYear');
    if(fy){ fy.textContent = new Date().getFullYear(); }
  });
  window.addEventListener('load',()=>document.body.classList.add('loaded'));
