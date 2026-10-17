// Supabase 프로젝트 설정 (publishable 키는 브라우저에 공개돼도 되는 키입니다)
const SUPABASE_URL = 'https://pfvufddqsngbhuzdwymr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_i4r71y_4cnmXu-fl0kuirA_sxlqwb_Y';

let sb = null;
try {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.warn('Supabase 초기화 실패:', e);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

function openAuth(tab = 'login') {
  switchAuthTab(tab);
  document.getElementById('auth-overlay').classList.add('show');
  setTimeout(() => document.getElementById(tab === 'signup' ? 'signup-email' : 'login-email').focus(), 50);
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('signup-done').hidden = true;
  document.querySelector('#auth-overlay .auth-tabs').hidden = false;
  showError('login', '');
  showError('signup', '');
}

function showError(form, msg) {
  document.getElementById(form + '-error').textContent = msg;
}

function markInvalid(id, bad) {
  document.getElementById(id).classList.toggle('invalid', bad);
}

// 서버로 보내기 전에 입력값을 먼저 확인
function checkInputs(prefix, email, password) {
  markInvalid(prefix + '-email', false);
  markInvalid(prefix + '-password', false);
  if (!email) { markInvalid(prefix + '-email', true); return '이메일을 입력해주세요.'; }
  if (!EMAIL_RE.test(email)) { markInvalid(prefix + '-email', true); return '이메일 형식이 올바르지 않습니다. 예: example@email.com'; }
  if (!password) { markInvalid(prefix + '-password', true); return '비밀번호를 입력해주세요.'; }
  if (prefix === 'signup' && password.length < MIN_PASSWORD) {
    markInvalid(prefix + '-password', true);
    return `비밀번호가 너무 짧습니다. ${MIN_PASSWORD}자 이상 입력해주세요. (지금 ${password.length}자)`;
  }
  if (prefix === 'signup') {
    const password2 = document.getElementById('signup-password2').value;
    markInvalid('signup-password2', false);
    if (!password2) { markInvalid('signup-password2', true); return '비밀번호 확인 칸에 비밀번호를 한 번 더 입력해주세요.'; }
    if (password2 !== password) { markInvalid('signup-password2', true); return '두 비밀번호가 서로 다릅니다. 같은 비밀번호를 두 번 입력해주세요.'; }
  }
  return '';
}

const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

// 회원가입 칸을 화면 위에서 아래 순서대로 확인 (이메일 → 닉네임 → 전화번호 → 비밀번호 → 주소)
function checkSignupInputs(v) {
  ['signup-email', 'signup-nickname', 'signup-phone', 'signup-password', 'signup-password2', 'signup-address']
    .forEach(id => markInvalid(id, false));
  const bad = (id, msg) => { markInvalid(id, true); return msg; };
  if (!v.email) return bad('signup-email', '이메일을 입력해주세요.');
  if (!EMAIL_RE.test(v.email)) return bad('signup-email', '이메일 형식이 올바르지 않습니다. 예: mira@naver.com');
  if (!v.nickname) return bad('signup-nickname', '닉네임을 입력해주세요.');
  if (v.nickname.length < 2) return bad('signup-nickname', '닉네임은 2자 이상으로 입력해주세요.');
  if (!v.phone) return bad('signup-phone', '전화번호를 입력해주세요.');
  if (!PHONE_RE.test(v.phone)) return bad('signup-phone', '전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
  if (!v.password) return bad('signup-password', '비밀번호를 입력해주세요.');
  if (v.password.length < MIN_PASSWORD) return bad('signup-password', `비밀번호가 너무 짧습니다. ${MIN_PASSWORD}자 이상 입력해주세요. (지금 ${v.password.length}자)`);
  if (!v.password2) return bad('signup-password2', '비밀번호 확인 칸에 비밀번호를 한 번 더 입력해주세요.');
  if (v.password2 !== v.password) return bad('signup-password2', '두 비밀번호가 서로 다릅니다. 같은 비밀번호를 두 번 입력해주세요.');
  if (!v.address) return bad('signup-address', '주소를 입력해주세요. 상품을 받으실 주소가 필요해요.');
  if (v.address.length < 5) return bad('signup-address', '주소를 조금 더 자세히 입력해주세요. 예: 서울시 강남구 테헤란로 123');
  return '';
}

// 숫자만 입력해도 010-1234-5678 모양으로 하이픈을 넣어줌
function formatPhone(input) {
  const d = input.value.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) input.value = d;
  else if (d.length < 8) input.value = `${d.slice(0, 3)}-${d.slice(3)}`;
  else if (d.length < 11) input.value = `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  else input.value = `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// 비밀번호 확인 칸 아래에 일치 여부를 바로 보여줌
function checkPasswordMatch() {
  const pw = document.getElementById('signup-password').value;
  const pw2 = document.getElementById('signup-password2').value;
  const el = document.getElementById('signup-match');
  el.classList.remove('ok', 'bad');
  if (!pw2) {
    el.textContent = '영문과 숫자를 섞으면 더 안전해요. 같은 비밀번호를 두 번 입력해주세요.';
  } else if (pw === pw2) {
    el.textContent = '✓ 비밀번호가 일치합니다.';
    el.classList.add('ok');
    markInvalid('signup-password2', false);
  } else {
    el.textContent = '✕ 비밀번호가 일치하지 않습니다.';
    el.classList.add('bad');
  }
}

function translateAuthError(err) {
  if (!navigator.onLine) return '인터넷에 연결되어 있지 않습니다. 연결을 확인한 뒤 다시 시도해주세요.';
  const code = (err && err.code) || '';
  const msg = (err && err.message) || '';
  const byCode = {
    invalid_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
    email_not_confirmed: '이메일 인증이 아직 완료되지 않았습니다. 받은 메일함에서 인증 링크를 눌러주세요.',
    user_already_exists: '이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.',
    email_exists: '이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.',
    weak_password: '비밀번호가 너무 쉽습니다. 영문과 숫자를 섞어 더 길게 만들어주세요.',
    email_address_invalid: '사용할 수 없는 이메일 주소입니다. 실제로 쓰는 이메일을 입력해주세요.',
    signup_disabled: '지금은 회원가입을 받지 않고 있습니다. 고객센터로 문의해주세요.',
    over_email_send_rate_limit: '인증 메일을 너무 많이 보냈습니다. 잠시 후 다시 시도해주세요.',
    over_request_rate_limit: '요청이 너무 많습니다. 1분 정도 기다린 뒤 다시 시도해주세요.',
    validation_failed: '입력한 정보가 올바르지 않습니다. 이메일과 비밀번호를 다시 확인해주세요.'
  };
  if (/Password should be at least/i.test(msg)) return `비밀번호가 너무 짧습니다. ${MIN_PASSWORD}자 이상 입력해주세요.`;
  if (byCode[code]) return byCode[code];
  if (/Invalid login credentials/i.test(msg)) return byCode.invalid_credentials;
  if (/already registered|already been registered|already exists/i.test(msg)) return byCode.user_already_exists;
  if (/Email not confirmed/i.test(msg)) return byCode.email_not_confirmed;
  if (/Password should be at least/i.test(msg)) return `비밀번호가 너무 짧습니다. ${MIN_PASSWORD}자 이상 입력해주세요.`;
  if (/invalid.*email|Unable to validate email/i.test(msg)) return '이메일 형식이 올바르지 않습니다. 예: example@email.com';
  if (/rate limit|too many/i.test(msg)) return byCode.over_request_rate_limit;
  if (/Failed to fetch|NetworkError|fetch/i.test(msg) || (err && err.name === 'AuthRetryableFetchError')) {
    return '서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
  }
  return `알 수 없는 문제로 처리하지 못했습니다. 잠시 후 다시 시도해주세요. (원인: ${msg || '알 수 없음'})`;
}

function setBusy(form, busy, label) {
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;
  btn.disabled = busy;
  btn.textContent = busy ? label : btn.dataset.label;
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  showError('login', '');
  const problem = checkInputs('login', email, password);
  if (problem) { showError('login', problem); return; }
  if (!sb) { showError('login', '회원 서비스에 연결하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.'); return; }
  setBusy(form, true, '로그인 중…');
  try {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { showError('login', translateAuthError(error)); return; }
    closeModal('auth-overlay');
    form.reset();
  } catch (err) {
    showError('login', translateAuthError(err));
  } finally {
    setBusy(form, false);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const val = id => document.getElementById(id).value.trim();
  const v = {
    email: val('signup-email'),
    nickname: val('signup-nickname'),
    phone: val('signup-phone'),
    password: document.getElementById('signup-password').value,
    password2: document.getElementById('signup-password2').value,
    address: val('signup-address'),
    address2: val('signup-address2')
  };
  const email = v.email;
  showError('signup', '');
  const problem = checkSignupInputs(v);
  if (problem) { showError('signup', problem); return; }
  if (!sb) { showError('signup', '회원 서비스에 연결하지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.'); return; }
  setBusy(form, true, '가입 중…');
  try {
    // 닉네임·전화번호·주소는 Supabase 회원 정보(user_metadata)에 함께 저장
    const { data, error } = await sb.auth.signUp({
      email,
      password: v.password,
      options: { data: { nickname: v.nickname, phone: v.phone, address: v.address, address_detail: v.address2 } }
    });
    if (error) { showError('signup', translateAuthError(error)); return; }
    // 이메일 인증을 켠 프로젝트에서는 이미 가입된 이메일도 오류 없이 빈 identities로 돌아옵니다
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      showError('signup', '이미 가입된 이메일입니다. 로그인 탭에서 로그인해주세요.');
      return;
    }
    form.reset();
    checkPasswordMatch();
    form.style.display = 'none';
    document.querySelector('#auth-overlay .auth-tabs').hidden = true;
    document.getElementById('signup-done-msg').textContent = data.session
      ? `${v.nickname} 회원님, ${email} 계정으로 로그인되었습니다.`
      : `${email}로 인증 메일을 보냈습니다. 메일의 링크를 누르면 로그인할 수 있습니다.`;
    document.getElementById('signup-done').hidden = false;
  } catch (err) {
    showError('signup', translateAuthError(err));
  } finally {
    setBusy(form, false);
  }
}

// 로그인한 회원이 결제창을 열면 가입 때 입력한 정보를 빈 칸에 채워줌
async function prefillCheckout() {
  if (!sb) return;
  const { data } = await sb.auth.getSession();
  const user = data && data.session && data.session.user;
  if (!user) return;
  const meta = user.user_metadata || {};
  const fill = (id, value) => {
    const el = document.getElementById(id);
    if (el && !el.value && value) el.value = value;
  };
  fill('checkout-name', meta.nickname);
  fill('checkout-phone', meta.phone);
  fill('checkout-address', [meta.address, meta.address_detail].filter(Boolean).join(' '));
}

async function handleLogout() {
  if (sb) await sb.auth.signOut();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderAuthStatus(user) {
  const el = document.getElementById('auth-status');
  if (!el) return;
  if (user) {
    const meta = user.user_metadata || {};
    const displayName = meta.nickname || meta.name || (user.email ? user.email.split('@')[0] : '회원');
    el.innerHTML = `<span class="auth-user">${escapeHtml(displayName)} 회원님 환영합니다</span><button class="auth-btn" onclick="handleLogout()">로그아웃</button>`;
  } else {
    el.innerHTML = `<button class="auth-btn" onclick="openAuth('login')">👤 로그인</button><button class="auth-btn primary" onclick="openAuth('signup')">회원가입</button>`;
  }
}

if (sb) {
  sb.auth.onAuthStateChange((_event, session) => renderAuthStatus(session ? session.user : null));
}
