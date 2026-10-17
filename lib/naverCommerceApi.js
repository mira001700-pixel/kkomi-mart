const bcrypt = require('bcryptjs');

const API_BASE = 'https://api.commerce.naver.com/external';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

// 네이버 커머스API는 일반 OAuth2와 달리 client_secret을 bcrypt salt로 사용해
// "client_id_timestamp" 문자열을 서명한 값을 client_secret_sign으로 보낸다.
function buildClientSecretSign(clientId, clientSecret, timestamp) {
  const password = `${clientId}_${timestamp}`;
  const hashed = bcrypt.hashSync(password, clientSecret);
  return Buffer.from(hashed, 'utf-8').toString('base64');
}

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.');
  }

  const timestamp = Date.now();
  const clientSecretSign = buildClientSecretSign(clientId, clientSecret, timestamp);

  const params = new URLSearchParams({
    client_id: clientId,
    timestamp: String(timestamp),
    client_secret_sign: clientSecretSign,
    grant_type: 'client_credentials',
    type: 'SELF'
  });

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`네이버 커머스API 토큰 발급 실패 (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // 만료 30초 전에 미리 갱신
  cachedTokenExpiresAt = now + (data.expires_in ? data.expires_in * 1000 - 30000 : 60000);
  return cachedToken;
}

async function searchProducts({ page = 1, size = 20 } = {}) {
  const token = await getAccessToken();

  const res = await fetch(`${API_BASE}/v1/products/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ page, size })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`상품 조회 실패 (${res.status}): ${text}`);
  }

  return res.json();
}

module.exports = { getAccessToken, searchProducts };
