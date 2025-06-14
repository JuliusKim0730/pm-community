// Firebase 설정 및 구글 로그인 기능
console.log('Firebase Authentication 모드로 실행');

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBqJXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "pmcommunity.firebaseapp.com",
    projectId: "pmcommunity",
    storageBucket: "pmcommunity.appspot.com",
    messagingSenderId: "1081720120818",
    appId: "1:1081720120818:web:d6f12867b6ad32e58937b"
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
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        console.log('구글 로그인 성공:', user.email);
        
        // 사용자 프로필 확인
        await checkUserProfile(user);
        
        return user;
    } catch (error) {
        console.error('구글 로그인 오류:', error);
        alert('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
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
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userInfo && window.currentUser) {
        userInfo.textContent = window.currentUser.displayName;
        userInfo.style.display = 'block';
    }
}

function updateUIForLoggedOutUser() {
    // 로그아웃 상태 UI 업데이트
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    
    window.currentUser = null;
}

console.log('Firebase Authentication 설정 완료'); 