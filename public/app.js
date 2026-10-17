const statusEl = document.getElementById('status');
const gridEl = document.getElementById('product-grid');

function pickProduct(item) {
  // 네이버 커머스API 응답은 채널상품이 배열로 감싸져 오는 경우가 많아 유연하게 처리
  const channel = (item.channelProducts && item.channelProducts[0]) || item;
  return {
    name: channel.name || '이름 없음',
    price: channel.salePrice ?? channel.price ?? 0,
    image: (channel.representativeImage && channel.representativeImage.url) || channel.imageUrl || '',
    id: channel.channelProductNo || item.originProductNo || ''
  };
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || '상품을 불러오지 못했습니다.');
    }

    const list = data.contents || data.products || [];
    if (list.length === 0) {
      statusEl.textContent = '표시할 상품이 없습니다.';
      return;
    }

    statusEl.style.display = 'none';
    gridEl.innerHTML = list.map(item => {
      const p = pickProduct(item);
      return `
        <a class="product-card" href="#" data-id="${p.id}">
          ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ''}
          <div class="info">
            <p class="name">${p.name}</p>
            <p class="price">${Number(p.price).toLocaleString()}원</p>
          </div>
        </a>
      `;
    }).join('');
  } catch (err) {
    statusEl.textContent = `오류: ${err.message}`;
  }
}

loadProducts();
