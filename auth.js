// TODO: Firebase 프로젝트 생성 후 아래 값을 실제 설정으로 교체하세요.
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

let authReady = false;
try {
  if (firebaseConfig.apiKey !== "REPLACE_ME") {
    firebase.initializeApp(firebaseConfig);
    authReady = true;
  }
} catch (e) {
  console.warn('Firebase 초기화 실패:', e);
}

function openAuth() {
  if (!authReady) {
    alert('회원 인증 서비스 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  switchAuthTab('login');
  document.getElementById('login-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
  document.getElementById('auth-overlay').classList.add('show');
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
}

function translateAuthError(code) {
  const map = {
    'auth/email-already-in-use': '이미 가입된 이메일입니다.',
    'auth/invalid-email': '올바르지 않은 이메일 형식입니다.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
    'auth/user-not-found': '가입되지 않은 이메일입니다.',
    'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.'
  };
  return map[code] || '오류가 발생했습니다. 다시 시도해주세요.';
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      closeModal('auth-overlay');
      e.target.reset();
    })
    .catch(err => { errEl.textContent = translateAuthError(err.code); });
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const errEl = document.getElementById('signup-error');
  errEl.textContent = '';
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(cred => cred.user.updateProfile({ displayName: name }))
    .then(() => {
      closeModal('auth-overlay');
      e.target.reset();
    })
    .catch(err => { errEl.textContent = translateAuthError(err.code); });
}

function handleLogout() {
  firebase.auth().signOut();
}

function renderAuthStatus(user) {
  const el = document.getElementById('auth-status');
  if (!el) return;
  if (user) {
    const displayName = user.displayName || (user.email ? user.email.split('@')[0] : '회원');
    el.innerHTML = `<span class="auth-user">${displayName}님</span><button class="cart-btn" onclick="handleLogout()">로그아웃</button>`;
  } else {
    el.innerHTML = `<button class="cart-btn" onclick="openAuth()">👤 로그인</button>`;
  }
}

if (authReady) {
  firebase.auth().onAuthStateChanged(renderAuthStatus);
}
