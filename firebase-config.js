// Firebase 설정 및 구글 로그인 기능
console.log('Firebase Authentication 모드로 실행');

// Firebase 설정 - 환경 변수 사용
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyABwMH9ZGH6mpT1dT8OURyyBfE-7GTB6Mg",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pmcommunity.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pmcommunity",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pmcommunity.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1081720120818",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1081720120818:web:d6f12867b6ad32e58937b"
};

// Firebase 초기화
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase 초기화 완료');
    }
    
    // Firebase 서비스 초기화
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    window.storage = firebase.storage();
    
    // 구글 로그인 프로바이더 설정
    window.googleProvider = new firebase.auth.GoogleAuthProvider();
    window.googleProvider.addScope('email');
    window.googleProvider.addScope('profile');
    
    // 구글 클라이언트 설정 - 환경 변수 사용
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1027437317910-i8ep59ublietsfssi60i0j32hhl5us05.apps.googleusercontent.com';
    window.googleProvider.setCustomParameters({
        'client_id': googleClientId
    });
    
    console.log('Firebase Authentication 초기화 완료');
    
    // 사용자 상태 변경 감지
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('사용자 로그인됨:', user.email);
            updateUIForLoggedInUser(user);
        } else {
            console.log('사용자 로그아웃됨');
            updateUIForLoggedOutUser();
        }
    });
    
} catch (error) {
    console.error('Firebase 초기화 오류:', error);
    
    // Firebase 연결 실패 시 로컬 스토리지 사용
    console.log('로컬 스토리지 모드로 전환');
    window.firebaseError = true;
    window.useLocalStorage = true;
}

// 구글 로그인 함수
async function signInWithGoogle() {
    try {
        // 팝업 차단 방지를 위한 사용자 상호작용 확인
        console.log('구글 로그인 시도 중...');
        
        // 구글 로그인 프로바이더 재설정 (안정성 향상)
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({
            'client_id': '1027437317910-i8ep59ublietsfssi60i0j32hhl5us05.apps.googleusercontent.com',
            'prompt': 'select_account'
        });
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        console.log('구글 로그인 성공:', user.email);
        
        // 사용자 프로필 확인
        await checkUserProfile(user);
        
        return user;
    } catch (error) {
        console.error('구글 로그인 오류:', error);
        
        // 에러 타입별 처리
        if (error.code === 'auth/popup-closed-by-user') {
            alert('로그인이 취소되었습니다.');
        } else if (error.code === 'auth/popup-blocked') {
            alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용해주세요.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            console.log('이전 팝업 요청이 취소됨');
        } else {
            alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
        throw error;
    }
}

// 로그아웃 함수
async function signOut() {
    try {
        await auth.signOut();
        console.log('로그아웃 완료');
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// 사용자 프로필 확인
async function checkUserProfile(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // 신규 사용자 - 프로필 설정 모달 표시
            showProfileSetupModal(user);
        } else {
            // 기존 사용자 - 프로필 정보 로드
            const userData = userDoc.data();
            window.currentUser = {
                uid: user.uid,
                email: user.email,
                nickname: userData.nickname,
                job: userData.job,
                domain: userData.domain,
                region: userData.region,
                displayName: `${userData.nickname}/${userData.job}/${userData.domain}/${userData.region}`
            };
            console.log('사용자 프로필 로드 완료:', window.currentUser.displayName);
        }
    } catch (error) {
        console.error('사용자 프로필 확인 오류:', error);
        showProfileSetupModal(user);
    }
}

// UI 업데이트 함수들
function updateUIForLoggedInUser(user) {
    // 로그인 상태 UI 업데이트
    const loginBtn = document.getElementById('login-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const userNickname = document.getElementById('user-nickname');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'block';
    if (userNickname && window.currentUser) {
        userNickname.textContent = window.currentUser.nickname || window.currentUser.displayName;
    }
}

function updateUIForLoggedOutUser() {
    // 로그아웃 상태 UI 업데이트
    const loginBtn = document.getElementById('login-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (userDropdown) userDropdown.style.display = 'none';
    
    // 드롭다운 닫기
    closeUserDropdown();
    
    window.currentUser = null;
}

// 사용자 드롭다운 토글
function toggleUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('active');
    }
}

// 사용자 드롭다운 닫기
function closeUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.remove('active');
    }
}

// 프로필 수정 모달 표시
function showEditProfileModal() {
    closeUserDropdown();
    if (window.currentUser) {
        showProfileSetupModal(null, true); // 수정 모드로 호출
    }
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown && !userDropdown.contains(event.target)) {
        closeUserDropdown();
    }
});

console.log('Firebase Authentication 설정 완료'); 