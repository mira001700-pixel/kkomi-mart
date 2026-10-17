-- 미라마트 상품 테이블
-- 사이트(index.html, product.html)는 이 테이블에서 is_active = true 인 상품을 sort_order 순서로 불러옵니다.
-- 상품 추가·수정은 Supabase 대시보드 > Table Editor > products 에서 하면 사이트에 바로 반영됩니다.

create table if not exists public.products (
  id             text primary key,                 -- 상세 페이지 주소에 쓰임: product.html?id=zzugap
  name           text not null,                    -- 상품명 (장바구니에도 이 이름으로 담김)
  category       text not null,                    -- 메뉴 필터: 에기걸이 / 훅캡 / 에기
  price          integer not null check (price >= 0),
  old_price      integer check (old_price >= 0),   -- 할인 전 가격 (없으면 비움)
  description    text not null default '',         -- 상세 설명 (<br> 줄바꿈 사용 가능)
  images         jsonb not null default '[]',      -- ["images/a.jpg", ...] 첫 장이 대표 사진
  emoji          text,                             -- 사진이 없을 때 대신 보여줄 이모지
  img_class      text,                             -- 사진 표시 방식: flip-zoom(좌우반전) / fit-contain(잘리지 않게)
  media_class    text,                             -- 사진 영역 특수 스타일 (예: theunit-media)
  badges         jsonb not null default '[]',      -- [{"text":"BEST","cls":"best"}, ...]
  color_options  jsonb not null default '[]',      -- [{"label":"1) 레드","value":"레드","img":"images/..."}, ...]
  length_options jsonb not null default '[]',      -- [{"label":"2) 50cm (+5,000원)","value":"50cm","extra":5000}, ...]
  sort_order     integer not null default 0,       -- 작은 숫자가 앞에 보임
  is_active      boolean not null default true,    -- false 로 바꾸면 사이트에서 숨김
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 수정할 때마다 updated_at 자동 갱신
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- 보안: 방문자는 판매 중 상품을 읽기만 가능, 쓰기는 대시보드(관리자)에서만
alter table public.products enable row level security;

drop policy if exists "판매 중 상품은 누구나 조회" on public.products;
create policy "판매 중 상품은 누구나 조회"
  on public.products for select
  to anon, authenticated
  using (is_active);
