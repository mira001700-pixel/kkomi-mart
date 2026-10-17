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
// thumb: 장바구니에 보여줄 사진 (선택한 색상 사진)
function addToCart(name, price, extra = 0, optionLabel = '', thumb = '') {
  const item = cart.find(i => i.name === name);
  if (item) { item.qty++; } else { cart.push({ name, price, extra, optionLabel, thumb, qty: 1 }); }
  saveCart();
  updateCartUI();
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

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart();
  updateCartUI();
}

function removeItem(idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  document.getElementById('cart-count').textContent = cart.reduce((sum, i) => sum + i.qty, 0);

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
