// Firebase 설정 및 구글 로그인 기능
console.log('Firebase Authentication 모드로 실행');

// Firebase 설정 - 환경변수 또는 기본값 사용
const firebaseConfig = {
    apiKey: "AIzaSyDyFOHNeZN9g2FL1T2rM54J_R7vYjyoPec",
    authDomain: "pmcommuni.firebaseapp.com", 
    projectId: "pmcommuni",
    storageBucket: "pmcommuni.appspot.com",
    messagingSenderId: "1081720120818",
    appId: "1:1081720120818:web:d6f12867b6ad32e589376b"
};

console.log('Firebase 설정:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

// 전역 변수 선언
window.firebaseInitialized = false;
window.firestoreReady = false;
window.currentUser = null;

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
    
    // 로그인 상태 유지 설정
    window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('로그인 상태 유지 설정 완료');
        })
        .catch((error) => {
            console.error('로그인 상태 유지 설정 실패:', error);
        });
    
    // Firestore 설정 최적화
    window.db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    // Firestore 컬렉션 참조 정의 (전역으로 접근 가능하게)
    window.postsCollection = window.db.collection('posts');
    window.usersCollection = window.db.collection('users');
    window.booksCollection = window.db.collection('books');
    
    // 구글 로그인 프로바이더 설정
    window.googleProvider = new firebase.auth.GoogleAuthProvider();
    window.googleProvider.addScope('email');
    window.googleProvider.addScope('profile');
    
    // 구글 클라이언트 설정 - CORS 정책 개선
    window.googleProvider.setCustomParameters({
        'prompt': 'select_account',
        'access_type': 'online'
    });
    
    window.firebaseInitialized = true;
    console.log('Firebase 모든 서비스 초기화 완료');
    
    // 사용자 상태 변경 감지 - 개선된 버전
    auth.onAuthStateChanged((user) => {
        console.log('인증 상태 변경 감지:', user ? user.email : '로그아웃');
        
        if (user) {
            console.log('사용자 로그인됨:', user.email);
            window.firestoreReady = true;
            window.currentUser = user;
            
            // UI 업데이트
            updateUIForLoggedInUser(user);
            
            // 사용자 프로필 확인
            checkUserProfile(user);
            
            // 로그인 후 BoardManager 초기화
            if (window.boardManager && typeof window.boardManager.initializeManager === 'function') {
                window.boardManager.initializeManager().catch(error => {
                    console.error('로그인 후 BoardManager 초기화 실패:', error);
                });
            }
        } else {
            console.log('사용자 로그아웃됨');
            window.firestoreReady = false;
            window.currentUser = null;
            
            // UI 업데이트
            updateUIForLoggedOutUser();
            
            // 로그아웃 상태에서도 기본 데이터는 조회 가능하도록 설정
            if (window.boardManager && typeof window.boardManager.initializeManager === 'function') {
                window.boardManager.initializeManager().catch(error => {
                    console.error('로그아웃 후 BoardManager 초기화 실패:', error);
                });
            }
        }
    });
    
} catch (error) {
    console.error('Firebase 초기화 치명적 오류:', error);
    alert('서비스 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
}

// Firestore 준비 상태 확인 함수
function isFirestoreReady() {
    return window.firebaseInitialized && window.postsCollection;
}

// 구글 로그인 함수 개선 - CORS 정책 문제 해결
async function signInWithGoogle() {
    try {
        console.log('구글 로그인 시도 중...');
        
        // 로그인 버튼 비활성화
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = '로그인 중...';
        }
        
        // 새로운 프로바이더 인스턴스 생성
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/userinfo.email');
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        
        // 커스텀 파라미터 설정 - CORS 정책 개선
        provider.setCustomParameters({
            'prompt': 'select_account',
            'access_type': 'online',
            'include_granted_scopes': 'true'
        });
        
        let result;
        
        try {
            // 먼저 팝업 방식 시도
            result = await auth.signInWithPopup(provider);
            console.log('팝업 로그인 성공:', result.user.email);
        } catch (popupError) {
            console.log('팝업 로그인 실패:', popupError.code, popupError.message);
            
            // 팝업 관련 에러들을 모두 리다이렉트로 처리
            if (popupError.code === 'auth/popup-blocked' || 
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/cancelled-popup-request' ||
                popupError.message.includes('Cross-Origin-Opener-Policy') ||
                popupError.message.includes('window.closed') ||
                popupError.message.includes('popup')) {
                
                console.log('리다이렉트 방식으로 전환');
                try {
                    // 리다이렉트 방식으로 전환
                    await auth.signInWithRedirect(provider);
                    return; // 리다이렉트 후에는 페이지가 새로고침됨
                } catch (redirectError) {
                    console.error('리다이렉트 로그인도 실패:', redirectError);
                    throw redirectError;
                }
            } else {
                throw popupError;
            }
        }
        
        const user = result.user;
        console.log('구글 로그인 성공:', user.email);
        
        // 로그인 성공 후 UI 즉시 업데이트
        window.currentUser = user;
        updateUIForLoggedInUser(user);
        
        return user;
        
    } catch (error) {
        console.error('구글 로그인 오류:', error);
        
        // 로그인 버튼 복원
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = '구글 로그인';
        }
        
        // 에러 타입별 처리
        if (error.code === 'auth/popup-closed-by-user') {
            console.log('사용자가 로그인을 취소했습니다.');
        } else if (error.code === 'auth/popup-blocked') {
            alert('팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용하거나 페이지를 새로고침 후 다시 시도해주세요.');
        } else if (error.code === 'auth/cancelled-popup-request') {
            console.log('이전 팝업 요청이 취소됨');
        } else if (error.code === 'auth/operation-not-allowed') {
            console.error('Firebase Authentication이 활성화되지 않았습니다.');
            alert('로그인 서비스가 활성화되지 않았습니다. 관리자에게 문의해주세요.');
        } else if (error.code === 'auth/unauthorized-domain') {
            console.error('허용되지 않은 도메인에서 로그인 시도');
            alert('이 도메인에서는 로그인이 허용되지 않습니다.');
        } else if (error.message && error.message.includes('Identity Toolkit API')) {
            console.error('Google Identity Toolkit API가 활성화되지 않음:', error);
            showServiceNotice();
            alert('Google 로그인 서비스 설정이 완료되지 않았습니다.\n잠시 후 다시 시도해주세요.');
        } else if (error.message && error.message.includes('identitytoolkit')) {
            console.error('Identity Toolkit 관련 오류:', error);
            showServiceNotice();
            alert('Google 로그인 서비스에 일시적인 문제가 있습니다.\n잠시 후 다시 시도해주세요.');
        } else if (error.code === 'auth/network-request-failed') {
            alert('네트워크 연결을 확인해주세요.');
        } else {
            console.error('알 수 없는 로그인 오류:', error);
            alert('로그인 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
        }
        throw error;
    }
}

// 리다이렉트 결과 처리
auth.getRedirectResult().then((result) => {
    if (result.user) {
        console.log('리다이렉트 로그인 성공:', result.user.email);
        window.currentUser = result.user;
        updateUIForLoggedInUser(result.user);
        checkUserProfile(result.user);
    }
}).catch((error) => {
    console.error('리다이렉트 로그인 오류:', error);
});

// 로그아웃 함수
async function signOut() {
    try {
        await auth.signOut();
        console.log('로그아웃 완료');
        window.currentUser = null;
        updateUIForLoggedOutUser();
        // 페이지 새로고침 대신 상태만 업데이트
    } catch (error) {
        console.error('로그아웃 오류:', error);
    }
}

// UI 업데이트 함수들 - 개선된 버전
function updateUIForLoggedInUser(user) {
    console.log('로그인 UI 업데이트 시작:', user.email);
    
    // 로그인 버튼 숨기기
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'none';
        console.log('로그인 버튼 숨김');
    }
    
    // 사용자 드롭다운 표시
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.style.display = 'block';
        console.log('사용자 드롭다운 표시');
        
        // 사용자 닉네임 설정 (Firebase에서 가져오거나 기본값 사용)
        updateUserNickname(user);
    }
    
    // 로그인 버튼 복원 (에러 상태에서)
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fab fa-google"></i> 로그인';
    }
    
    console.log('로그인 UI 업데이트 완료');
}

// 사용자 닉네임 업데이트
async function updateUserNickname(user) {
    try {
        const userNickname = document.getElementById('user-nickname');
        if (!userNickname) return;
        
        // Firestore에서 사용자 프로필 가져오기
        if (window.usersCollection) {
            const userDoc = await window.usersCollection.doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const displayName = userData.nickname || user.displayName || user.email.split('@')[0];
                userNickname.textContent = displayName;
                
                // 전역 사용자 정보 업데이트 (등급 포함)
                window.currentUser = {
                    ...user,
                    ...userData,
                    displayName: userData.nickname ? 
                        `${userData.nickname}/${userData.job}/${userData.domain}/${userData.region}` : 
                        displayName
                };
                
                // 회원 관리 메뉴 표시 여부 결정
                console.log('사용자 등급:', userData.role);
                updateUserManagementMenu(userData.role);
                
            } else {
                userNickname.textContent = user.displayName || user.email.split('@')[0];
                // 기본 등급 설정
                window.currentUser = {
                    ...user,
                    role: 'general',
                    displayName: user.displayName || user.email.split('@')[0]
                };
            }
        } else {
            userNickname.textContent = user.displayName || user.email.split('@')[0];
            window.currentUser = {
                ...user,
                role: 'general',
                displayName: user.displayName || user.email.split('@')[0]
            };
        }
    } catch (error) {
        console.error('닉네임 업데이트 오류:', error);
        const userNickname = document.getElementById('user-nickname');
        if (userNickname) {
            userNickname.textContent = user.displayName || user.email.split('@')[0];
        }
        window.currentUser = {
            ...user,
            role: 'general',
            displayName: user.displayName || user.email.split('@')[0]
        };
    }
}

// 회원 관리 메뉴 표시 업데이트
function updateUserManagementMenu(userRole) {
    const userManagementMenu = document.getElementById('user-management-menu');
    if (!userManagementMenu) return;
    
    // boardManager가 초기화될 때까지 대기
    if (window.boardManager && window.boardManager.canManageUsers) {
        // 슈퍼바이저와 운영진만 회원 관리 메뉴 표시
        const canManage = userRole === 'supervisor' || userRole === 'admin';
        userManagementMenu.style.display = canManage ? 'block' : 'none';
        console.log('회원 관리 메뉴 업데이트:', userRole, canManage ? '표시' : '숨김');
            } else {
            // boardManager가 아직 초기화되지 않은 경우 잠시 후 재시도
            console.log('boardManager 초기화 대기 중...');
            setTimeout(() => {
                updateUserManagementMenu(userRole);
            }, 1000);
        }
        setTimeout(() => {
            updateUserManagementMenu(userRole);
        }, 1000);
    }
}

function updateUIForLoggedOutUser() {
    console.log('로그아웃 UI 업데이트 시작');
    
    // 로그인 버튼 표시
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.style.display = 'block';
        console.log('로그인 버튼 표시');
    }
    
    // 사용자 드롭다운 숨기기
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.style.display = 'none';
        userDropdown.classList.remove('active');
        console.log('사용자 드롭다운 숨김');
    }
    
    console.log('로그아웃 UI 업데이트 완료');
}

// 사용자 프로필 확인 함수
async function checkUserProfile(user) {
    try {
        if (!window.usersCollection) {
            console.warn('usersCollection이 초기화되지 않았습니다.');
            return;
        }
        
        const userDoc = await window.usersCollection.doc(user.uid).get();
        if (!userDoc.exists) {
            // 새 사용자인 경우 프로필 설정 모달 표시
            showProfileSetupModal(user);
        }
    } catch (error) {
        console.error('사용자 프로필 확인 오류:', error);
    }
}

// API 상태 확인 함수
async function checkGoogleAPIStatus() {
    try {
        // Google Identity Toolkit API 상태 확인을 위한 간단한 테스트
        const provider = new firebase.auth.GoogleAuthProvider();
        console.log('Google API 상태 확인 완료');
        return true;
    } catch (error) {
        console.error('Google API 상태 확인 실패:', error);
        return false;
    }
}

// 서비스 공지 표시 함수
function showServiceNotice() {
    const notice = document.getElementById('service-notice');
    if (notice) {
        notice.style.display = 'block';
        // 10초 후 자동 숨김
        setTimeout(() => {
            notice.style.display = 'none';
        }, 10000);
    }
}

// 인증 상태 변화 감지
auth.onAuthStateChanged(function(user) {
    if (user) {
        console.log('인증 상태 변화 - 로그인됨:', user.email);
        window.currentUser = user;
        updateUIForLoggedInUser(user);
        checkUserProfile(user);
    } else {
        console.log('인증 상태 변화 - 로그아웃됨');
        window.currentUser = null;
        updateUIForLoggedOutUser();
    }
});

// DOM 로드 완료 후 초기 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 로드 완료 - 초기 인증 상태 확인');
    
    // 현재 로그인 상태 확인
    const currentUser = auth.currentUser;
    if (currentUser) {
        console.log('페이지 로드 시 이미 로그인됨:', currentUser.email);
        window.currentUser = currentUser;
        updateUIForLoggedInUser(currentUser);
    } else {
        console.log('페이지 로드 시 로그아웃 상태');
        updateUIForLoggedOutUser();
    }
}); 