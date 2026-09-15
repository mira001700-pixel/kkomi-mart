let cart = JSON.parse(localStorage.getItem('cart') || '[]');

const PRODUCT_THUMBS = {
  '쭈갑 에기걸이': { img: 'images/product-zzugap.jpg' },
  '야광팁런에기걸이': { img: 'images/product-glow-khaki.jpg' },
  '팁런 에기걸이': { img: 'images/product-necklace.jpg' },
  '에깅낚시목걸이&로드스트랩세트': { img: 'images/product-tiplun.jpg' },
  '전기도금 훅캡': { img: 'images/product-hookcap.jpg' },
  '수제 마이크로박스 에기': { emoji: '📦' },
  '더유닛 에기걸이': { emoji: '🔗' }
};

function getThumb(name) {
  const key = Object.keys(PRODUCT_THUMBS).find(k => name.startsWith(k));
  return key ? PRODUCT_THUMBS[key] : null;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(name, price) {
  const item = cart.find(i => i.name === name);
  if (item) { item.qty++; } else { cart.push({ name, price, qty: 1 }); }
  saveCart();
  updateCartUI();
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
      const thumb = getThumb(item.name);
      const thumbHtml = thumb
        ? (thumb.img ? `<img src="${thumb.img}" alt="">` : `<span class="cart-item-emoji">${thumb.emoji}</span>`)
        : '';
      return `
      <div class="cart-item">
        <div class="cart-item-thumb">${thumbHtml}</div>
        <span class="cart-item-name">${item.name}</span>
        <div class="qty-control">
          <button type="button" onclick="changeQty(${idx}, -1)">-</button>
          <span>${item.qty}</span>
          <button type="button" onclick="changeQty(${idx}, 1)">+</button>
        </div>
        <span class="cart-item-price">${(item.price * item.qty).toLocaleString()}원</span>
        <button type="button" class="remove-btn" onclick="removeItem(${idx})">✕</button>
      </div>
    `;
    }).join('');
  }
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
    <div class="summary-row"><span>${i.name} x${i.qty}</span><span>${(i.price * i.qty).toLocaleString()}원</span></div>
  `).join('')
    + `<div class="summary-row"><span>배송비</span><span>${shippingLabel}</span></div>`
    + `<div class="summary-row total"><span>총 결제금액</span><span>${(cartTotal() + shipping).toLocaleString()}원</span></div>`;
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
