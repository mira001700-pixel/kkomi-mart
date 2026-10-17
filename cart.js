let cart = JSON.parse(localStorage.getItem('cart') || '[]');

const PRODUCT_THUMBS = {
  '쭈갑 에기걸이': { img: 'images/product-zzugap.jpg' },
  '야광팁런에기걸이': { img: 'images/product-glow-khaki.jpg' },
  '팁런 에기걸이': { img: 'images/product-necklace.jpg' },
  '에깅낚시목걸이&로드스트랩세트(파스텔레인보우)': { img: 'images/product-necklace-rainbow.jpg' },
  '에깅낚시목걸이&로드스트랩세트(블랙&핑크)': { img: 'images/product-necklace-blackpink.jpg' },
  '에깅낚시목걸이&로드스트랩세트': { img: 'images/product-tiplun.jpg' },
  '전기도금 훅캡(레드)': { img: 'images/hookcap-1.jpg' },
  '전기도금 훅캡(핑크)': { img: 'images/hookcap-2.jpg' },
  '전기도금 훅캡(오렌지)': { img: 'images/hookcap-3.jpg' },
  '전기도금 훅캡(그린)': { img: 'images/hookcap-4.jpg' },
  '전기도금 훅캡(블루)': { img: 'images/hookcap-5.jpg' },
  '전기도금 훅캡(퍼플)': { img: 'images/hookcap-6.jpg' },
  '전기도금 훅캡(핑크그린)': { img: 'images/hookcap-7.jpg' },
  '전기도금 훅캡(그린퍼플)': { img: 'images/hookcap-8.jpg' },
  '전기도금 훅캡(그린핑크)': { img: 'images/hookcap-9.jpg' },
  '전기도금 훅캡': { img: 'images/product-hookcap.jpg' },
  '수제 마이크로박스 에기': { emoji: '📦' },
  '더유닛 에기걸이': { emoji: '🔗' }
};

// 색상별 사진이 있는 에기걸이: images/colors/{key}-{번호}.jpg (번호는 색상 옵션 순서)
const COLOR_THUMBS = {
  '쭈갑 에기걸이': { key: 'zzugap', colors: ['블랙&레인보우', '블랙&네이비', '카키&오렌지', '블랙&레드', '블랙&그린', '블랙&퍼플', '블랙&핑크', '블랙&옐로우'] },
  '야광팁런에기걸이': { key: 'glow', colors: ['브라운&옐로우', '브라운&그린', '브라운&스카이', '브라운&핑크', '블랙&옐로우', '블랙&그린', '블랙&스카이', '블랙&핑크', '카키&옐로우', '카키&그린', '카키&스카이', '카키&핑크'] },
  '팁런 에기걸이': { key: 'tiplun', colors: ['블랙&레인보우', '블랙&레드', '카키&오렌지', '블랙&그린', '블랙&네이비', '블랙&퍼플', '블랙&핑크'] }
};

function getThumb(name) {
  // 예: '팁런 에기걸이(블랙&레드, 50cm)' → 상품명 '팁런 에기걸이', 색상 '블랙&레드'
  const m = name.match(/^(.*?)\(([^,)]+)/);
  if (m && COLOR_THUMBS[m[1]]) {
    const idx = COLOR_THUMBS[m[1]].colors.indexOf(m[2].trim());
    if (idx >= 0) return { img: `images/colors/${COLOR_THUMBS[m[1]].key}-${idx + 1}.jpg` };
  }
  const key = Object.keys(PRODUCT_THUMBS).find(k => name.startsWith(k));
  return key ? PRODUCT_THUMBS[key] : null;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// price: 옵션 포함 개당 가격, extra: 그중 옵션 추가금, optionLabel: 옵션 이름(예: 50cm)
// thumb: 장바구니에 보여줄 사진 (선택한 색상 사진), productId: products 테이블의 id
function addToCart(name, price, extra = 0, optionLabel = '', thumb = '', productId = null) {
  let item = cart.find(i => i.name === name);
  if (item) {
    item.qty = Math.min(MAX_QTY, item.qty + 1);
  } else {
    item = { name, price, extra, optionLabel, thumb, productId, qty: 1 };
    cart.push(item);
  }
  saveCart();
  updateCartUI();
  pushCartItem(item);
}

// ===== 회원 장바구니: Supabase cart_items 테이블과 동기화 (supabase/cart.sql 참고) =====
// 비회원은 브라우저에만 저장. 로그인하면 비회원 때 담은 상품을 회원 장바구니에 합치고,
// 이후 담기·수량 변경·삭제를 Supabase에도 바로 저장해 다른 기기에서도 같은 장바구니를 보여줌.
const MAX_QTY = 99;
const CART_OWNER_KEY = 'cart-owner'; // 브라우저 장바구니가 어느 회원 것인지 (비회원이면 없음)
let cartUserId = null;

function cartRow(item) {
  return {
    user_id: cartUserId, item_key: item.name, product_id: item.productId || null, name: item.name,
    price: item.price, extra: item.extra || 0, option_label: item.optionLabel || '', thumb: item.thumb || '',
    qty: Math.min(MAX_QTY, Math.max(1, item.qty))
  };
}

function rowToCartItem(r) {
  return { name: r.name, price: r.price, extra: r.extra, optionLabel: r.option_label, thumb: r.thumb, productId: r.product_id, qty: r.qty };
}

function warnCartSync(err) {
  console.warn('장바구니를 서버에 저장하지 못했습니다:', err);
  const note = document.getElementById('cart-sync-note');
  if (note) {
    note.textContent = '⚠ 장바구니를 서버에 저장하지 못했습니다. 인터넷 연결을 확인해주세요. (이 브라우저에는 저장되어 있어요)';
    note.className = 'cart-sync-note error';
  }
}

async function pushCartItem(item) {
  if (!cartUserId) return;
  const { error } = await sb.from('cart_items').upsert(cartRow(item));
  if (error) warnCartSync(error);
}

async function deleteCartItem(name) {
  if (!cartUserId) return;
  const { error } = await sb.from('cart_items').delete().eq('user_id', cartUserId).eq('item_key', name);
  if (error) warnCartSync(error);
}

async function clearRemoteCart() {
  if (!cartUserId) return;
  const { error } = await sb.from('cart_items').delete().eq('user_id', cartUserId);
  if (error) warnCartSync(error);
}

async function syncCartOnLogin(user) {
  cartUserId = user.id;
  const { data, error } = await sb.from('cart_items').select('*').order('created_at');
  if (error) { warnCartSync(error); updateCartUI(); return; }
  const merged = data.map(rowToCartItem);
  let owner = null;
  try { owner = localStorage.getItem(CART_OWNER_KEY); } catch (e) { /* 저장소 막힘 */ }
  // 이 브라우저 장바구니가 비회원 것이면(로그인 직전에 담은 상품) 회원 장바구니에 합침
  if (owner !== user.id && cart.length) {
    for (const g of cart) {
      const same = merged.find(i => i.name === g.name);
      if (same) same.qty = Math.min(MAX_QTY, same.qty + g.qty);
      else merged.push({ ...g });
    }
    const { error: upErr } = await sb.from('cart_items').upsert(merged.map(cartRow));
    if (upErr) warnCartSync(upErr);
  }
  cart = merged;
  try { localStorage.setItem(CART_OWNER_KEY, user.id); } catch (e) { /* 저장소 막힘 */ }
  saveCart();
  updateCartUI();
}

// 로그아웃하면 이 브라우저에서 회원 장바구니를 지움 (계정에는 그대로 남아 다음 로그인 때 돌아옴)
function clearCartOnLogout() {
  cartUserId = null;
  cart = [];
  try { localStorage.removeItem(CART_OWNER_KEY); } catch (e) { /* 저장소 막힘 */ }
  saveCart();
  updateCartUI();
}

if (typeof sb !== 'undefined' && sb) {
  sb.auth.onAuthStateChange((_event, session) => {
    const user = session ? session.user : null;
    // 인증 콜백 안에서 바로 Supabase를 호출하면 멈출 수 있어 한 박자 뒤에 실행
    setTimeout(() => {
      let owner = null;
      try { owner = localStorage.getItem(CART_OWNER_KEY); } catch (e) { /* 저장소 막힘 */ }
      if (user && user.id !== cartUserId) syncCartOnLogin(user);
      else if (!user && (cartUserId || owner)) clearCartOnLogout();
    }, 0);
  });
}

function won(n) {
  return n.toLocaleString() + '원';
}

// 예전에 담긴 상품은 extra가 없으므로 0으로 취급
function itemExtra(item) {
  return item.extra || 0;
}

function priceBreakdown(item) {
  const extra = itemExtra(item);
  const base = item.price - extra;
  if (!item.optionLabel && !extra) return `<span class="cart-item-unit">개당 ${won(item.price)}</span>`;
  return `
    <span class="option-chip${extra ? '' : ' free'}">
      <span class="option-chip-label">옵션 ${item.optionLabel || ''}</span>
      <span class="option-chip-price">${extra ? '+' + won(extra) : '추가금 없음'}</span>
    </span>
    <span class="cart-item-unit">기본 ${won(base)} → 개당 <b>${won(item.price)}</b></span>`;
}

// ===== 장바구니에서 색상·길이 옵션 바로 바꾸기 =====
// 상품의 전체 옵션 목록은 담을 때 저장해두지 않으므로, 바꾸려는 순간 products.js의
// fetchProduct()로 한 번만 불러와 캐싱해 둠 (index.html의 productMap에 이미 있어도 다시 불러옴 - 단순함 우선)
const productOptionCache = {};
let optionEditIdx = null;
let optionEditProduct = null; // 로딩 중이면 null

async function ensureProductOptions(productId) {
  if (productOptionCache[productId] !== undefined) return productOptionCache[productId];
  if (typeof fetchProduct !== 'function') return null;
  const { product } = await fetchProduct(productId);
  productOptionCache[productId] = product || null;
  return productOptionCache[productId];
}

async function openOptionEditor(idx) {
  const item = cart[idx];
  if (!item || !item.productId) return;
  optionEditIdx = idx;
  optionEditProduct = null;
  updateCartUI();
  const product = await ensureProductOptions(item.productId);
  if (optionEditIdx !== idx) return; // 그 사이 닫혔거나 다른 항목을 열었음
  optionEditProduct = product;
  updateCartUI();
}

function closeOptionEditor() {
  optionEditIdx = null;
  optionEditProduct = null;
  updateCartUI();
}

// 이름 맨 앞 괄호의 첫 항목이 색상 (예: '팁런 에기걸이(블랙&레드, 50cm)' → '블랙&레드')
function currentColorIndex(product, item) {
  if (!product.colorOptions) return -1;
  const m = item.name.match(/\(([^,)]+)/);
  const token = m ? m[1].trim() : '';
  return product.colorOptions.findIndex(o => o.value === token);
}

function currentLengthIndex(product, item) {
  if (!product.lengthOptions) return -1;
  return product.lengthOptions.findIndex(o => o.value === item.optionLabel);
}

function optionEditorHtml(idx, item) {
  if (optionEditIdx !== idx) {
    return `<button type="button" class="option-edit-btn" onclick="openOptionEditor(${idx})">옵션변경</button>`;
  }
  if (!optionEditProduct) {
    return `<span class="option-edit-loading">옵션을 불러오는 중…</span>`;
  }
  const product = optionEditProduct;
  if (!product.colorOptions && !product.lengthOptions) {
    return `<span class="option-edit-loading">이 상품은 바꿀 수 있는 옵션이 없습니다.</span>`;
  }
  const colorIdx = currentColorIndex(product, item);
  const lengthIdx = currentLengthIndex(product, item);
  const colorSelect = product.colorOptions
    ? `<select onchange="changeCartOption(${idx}, 'color', this.value)">`
      + product.colorOptions.map((o, i) => `<option value="${i}"${i === colorIdx ? ' selected' : ''}>${escapeHtml(o.label)}</option>`).join('')
      + `</select>`
    : '';
  const lengthSelect = product.lengthOptions
    ? `<select onchange="changeCartOption(${idx}, 'length', this.value)">`
      + product.lengthOptions.map((o, i) => `<option value="${i}"${i === lengthIdx ? ' selected' : ''}>${escapeHtml(o.label)}</option>`).join('')
      + `</select>`
    : '';
  return `<div class="option-edit-row">${colorSelect}${lengthSelect}<button type="button" class="option-edit-close" onclick="closeOptionEditor()">닫기</button></div>`;
}

function changeCartOption(idx, field, selValue) {
  const item = cart[idx];
  const product = optionEditProduct;
  if (!item || !product) return;

  const colorIdx = field === 'color' ? Number(selValue) : currentColorIndex(product, item);
  const lengthIdx = field === 'length' ? Number(selValue) : currentLengthIndex(product, item);
  const colorOpt = product.colorOptions && colorIdx >= 0 ? product.colorOptions[colorIdx] : null;
  const lengthOpt = product.lengthOptions && lengthIdx >= 0 ? product.lengthOptions[lengthIdx] : null;
  const e = buildCartEntry(product, colorOpt, lengthOpt);
  const oldName = item.name;

  // 바꾼 옵션 조합이 이미 장바구니에 있던 다른 줄과 같아지면 수량을 합침
  const dupIdx = cart.findIndex((i, j) => j !== idx && i.name === e.name);
  optionEditIdx = null;
  optionEditProduct = null;
  if (dupIdx !== -1) {
    const dupItem = cart[dupIdx];
    dupItem.qty = Math.min(MAX_QTY, dupItem.qty + item.qty);
    cart.splice(idx, 1);
    saveCart();
    updateCartUI();
    if (oldName !== e.name) deleteCartItem(oldName);
    pushCartItem(dupItem);
    return;
  }

  item.name = e.name;
  item.price = e.price;
  item.extra = e.extra;
  item.optionLabel = e.optionLabel;
  item.thumb = e.thumb;
  saveCart();
  updateCartUI();
  if (oldName !== item.name) deleteCartItem(oldName);
  pushCartItem(item);
}

function changeQty(idx, delta) {
  const item = cart[idx];
  item.qty = Math.min(MAX_QTY, item.qty + delta);
  if (item.qty <= 0) {
    cart.splice(idx, 1);
    deleteCartItem(item.name);
    optionEditIdx = null; optionEditProduct = null;
  } else {
    pushCartItem(item);
  }
  saveCart();
  updateCartUI();
}

function removeItem(idx) {
  const [item] = cart.splice(idx, 1);
  optionEditIdx = null; optionEditProduct = null;
  saveCart();
  updateCartUI();
  if (item) deleteCartItem(item.name);
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  document.getElementById('cart-count').textContent = cart.reduce((sum, i) => sum + i.qty, 0);

  const note = document.getElementById('cart-sync-note');
  if (note) {
    note.className = 'cart-sync-note' + (cartUserId ? ' synced' : '');
    note.innerHTML = cartUserId
      ? '☁ 회원 장바구니에 저장돼요. 다른 기기에서 로그인해도 그대로 보여요.'
      : '로그인하면 장바구니가 계정에 저장돼 다른 기기에서도 볼 수 있어요. <button type="button" onclick="closeModal(\'cart-overlay\'); openAuth(\'login\')">로그인</button>';
  }

  const container = document.getElementById('cart-items');
  if (cart.length === 0) {
    container.innerHTML = '<p class="empty">장바구니가 비어있습니다.</p>';
  } else {
    container.innerHTML = cart.map((item, idx) => {
      const thumb = item.thumb ? { img: item.thumb } : getThumb(item.name);
      const thumbHtml = thumb
        ? (thumb.img ? `<img src="${thumb.img}" alt="">` : `<span class="cart-item-emoji">${thumb.emoji}</span>`)
        : '';
      return `
      <div class="cart-item">
        <div class="cart-item-thumb">${thumbHtml}</div>
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          <span class="cart-item-option">${priceBreakdown(item)}</span>
          ${item.productId ? optionEditorHtml(idx, item) : ''}
        </div>
        <div class="qty-control">
          <button type="button" onclick="changeQty(${idx}, -1)">-</button>
          <span>${item.qty}</span>
          <button type="button" onclick="changeQty(${idx}, 1)">+</button>
        </div>
        <span class="cart-item-price">${(item.price * item.qty).toLocaleString()}원${itemExtra(item) ? `<small>옵션 +${won(itemExtra(item) * item.qty)} 포함</small>` : ''}</span>
        <button type="button" class="remove-btn" onclick="removeItem(${idx})">✕</button>
      </div>
    `;
    }).join('');
  }
  const optionTotal = cart.reduce((sum, i) => sum + itemExtra(i) * i.qty, 0);
  document.getElementById('cart-base-total').textContent = won(cartTotal() - optionTotal);
  document.getElementById('cart-option-total').textContent = '+' + won(optionTotal);
  document.getElementById('cart-total').textContent = cartTotal().toLocaleString();
}

function openCart() {
  document.getElementById('cart-overlay').classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function closeIfOverlay(e, id) {
  if (e.target.id === id) closeModal(id);
}

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

function shippingFee() {
  return cartTotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

function openCheckout() {
  if (cart.length === 0) { alert('장바구니가 비어있습니다.'); return; }
  closeModal('cart-overlay');
  const shipping = shippingFee();
  const shippingLabel = shipping === 0 ? '무료' : `${shipping.toLocaleString()}원`;
  document.getElementById('checkout-summary').innerHTML = cart.map(i => `
    <div class="summary-row"><span>${i.name} x${i.qty}${itemExtra(i) ? ` <small>(옵션 +${won(itemExtra(i))})</small>` : ''}</span><span>${(i.price * i.qty).toLocaleString()}원</span></div>
  `).join('')
    + `<div class="summary-row"><span>배송비</span><span>${shippingLabel}</span></div>`
    + `<div class="summary-row total"><span>총 결제금액</span><span>${(cartTotal() + shipping).toLocaleString()}원</span></div>`;
  if (typeof prefillCheckout === 'function') prefillCheckout();
  document.getElementById('checkout-overlay').classList.add('show');
}

function submitCheckout(e) {
  e.preventDefault();
  alert('결제가 완료되었습니다! 감사합니다 🎣');
  cart = [];
  saveCart();
  updateCartUI();
  clearRemoteCart();
  closeModal('checkout-overlay');
  e.target.reset();
}

function toggleWish(btn) {
  const name = btn.dataset.name;
  btn.classList.toggle('active');
  const liked = btn.classList.contains('active');
  btn.textContent = liked ? '♥' : '♡';

  let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  if (liked) {
    if (!wishlist.includes(name)) wishlist.push(name);
  } else {
    wishlist = wishlist.filter(n => n !== name);
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function isWished(name) {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  return wishlist.includes(name);
}

function initWishlist() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  document.querySelectorAll('.wish-btn').forEach(btn => {
    if (wishlist.includes(btn.dataset.name)) {
      btn.classList.add('active');
      btn.textContent = '♥';
    }
  });
}

initWishlist();
updateCartUI();
