// 상품 정보는 Supabase의 products 테이블에서 불러옵니다 (auth.js에서 만든 sb 클라이언트 사용).
// 테이블 구조와 설명은 supabase/products.sql 참고.
const PRODUCTS_CACHE_KEY = 'products-cache-v1';

// DB 행(snake_case) → 화면에서 쓰는 모양(camelCase)
function rowToProduct(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: r.price,
    oldPrice: r.old_price || null,
    desc: r.description || '',
    images: r.images || [],
    emoji: r.emoji || null,
    imgClass: r.img_class || '',
    mediaClass: r.media_class || '',
    badges: r.badges || [],
    colorOptions: r.color_options && r.color_options.length ? r.color_options : null,
    lengthOptions: r.length_options && r.length_options.length ? r.length_options : null
  };
}

function readCachedRows() {
  try {
    const cached = JSON.parse(localStorage.getItem(PRODUCTS_CACHE_KEY) || 'null');
    return Array.isArray(cached) ? cached : [];
  } catch (e) {
    return [];
  }
}

// PostgREST 필터 문법을 깨뜨리는 문자(, ( ) % * \ ")는 검색어에서 뺌
function cleanSearchTerm(term) {
  return (term || '').replace(/[,()%*\\"]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesFilter(p, category, term) {
  const t = term.toLowerCase();
  const inCategory = !category || category === '전체상품' || p.category === category;
  const inText = !t || [p.name, p.desc, p.category].some(s => (s || '').toLowerCase().includes(t));
  return inCategory && inText;
}

// 상품 조회: Supabase products 테이블에서 카테고리·검색어 조건으로 조회
// 반환: { products, offline }  (offline=true면 서버 대신 마지막으로 받아 둔 목록에서 찾은 결과, products=null이면 실패)
async function queryProducts({ category = '전체상품', term = '' } = {}) {
  const t = cleanSearchTerm(term);
  try {
    if (!sb) throw new Error('Supabase 클라이언트 없음');
    let q = sb.from('products').select('*').eq('is_active', true);
    if (category && category !== '전체상품') q = q.eq('category', category);
    if (t) q = q.or(`name.ilike.%${t}%,description.ilike.%${t}%,category.ilike.%${t}%`);
    const { data, error } = await q.order('sort_order');
    if (error) throw error;
    // 전체 목록을 받았을 때만 오프라인용으로 저장
    if (!t && (!category || category === '전체상품')) {
      try { localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data)); } catch (e) { /* 저장 공간 없음 */ }
    }
    return { products: data.map(rowToProduct), offline: false };
  } catch (err) {
    console.warn('상품을 Supabase에서 조회하지 못했습니다:', err);
    const cached = readCachedRows().map(rowToProduct);
    if (!cached.length) return { products: null, offline: true };
    return { products: cached.filter(p => matchesFilter(p, category, t)), offline: true };
  }
}

// 상세 페이지용: 상품 하나만 조회
async function fetchProduct(id) {
  try {
    if (!sb) throw new Error('Supabase 클라이언트 없음');
    const { data, error } = await sb.from('products').select('*').eq('id', id).eq('is_active', true).maybeSingle();
    if (error) throw error;
    return { product: data ? rowToProduct(data) : null, failed: false };
  } catch (err) {
    console.warn('상품을 Supabase에서 조회하지 못했습니다:', err);
    const row = readCachedRows().find(r => r.id === id);
    return { product: row ? rowToProduct(row) : null, failed: !row };
  }
}

function formatWon(n) {
  return Number(n).toLocaleString() + '원';
}

// 선택한 색상·길이로 장바구니에 담을 이름/가격/썸네일 계산 (메인 카드와 상세 페이지 공통)
function buildCartEntry(p, colorOpt, lengthOpt) {
  const parts = [];
  let extra = 0, optionLabel = '', thumb = p.images[0] || '';
  if (colorOpt) {
    parts.push(colorOpt.value);
    if (colorOpt.img) thumb = colorOpt.img;
  }
  if (lengthOpt) {
    parts.push(lengthOpt.value);
    extra = Number(lengthOpt.extra) || 0;
    optionLabel = lengthOpt.value;
  }
  const name = parts.length ? `${p.name}(${parts.join(', ')})` : p.name;
  return { name, price: p.price + extra, extra, optionLabel, thumb };
}
