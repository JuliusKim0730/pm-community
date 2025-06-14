// 전역 변수
let boardManager;

// 슬라이드쇼 관련 변수
let currentSlide = 0;
let reviewImages = [
    { src: './reviews/review1.jpg', caption: '이력서 컨설팅 후기 - "정말 도움이 많이 되었습니다!"' },
    { src: './reviews/review2.jpg', caption: '포트폴리오 컨설팅 후기 - "취업에 성공했어요!"' },
    { src: './reviews/review3.jpg', caption: '커리어 컨설팅 후기 - "방향성을 잡을 수 있었습니다"' },
    { src: './reviews/review4.jpg', caption: '자기소개서 컨설팅 후기 - "면접 기회가 늘어났어요"' },
    { src: './reviews/review5.jpg', caption: '경력기술서 컨설팅 후기 - "전문적인 피드백 감사합니다"' }
];

// 페이지네이션 관련 변수
const POSTS_PER_PAGE = 10;
let currentPage = 1;
let totalPages = 1;

// 하이브리드 게시판 데이터 관리자 (Firebase + LocalStorage)
class HybridBoardManager {
    constructor() {
        this.useFirebase = true; // 항상 Firebase 사용
        this.posts = {};
        this.currentBoard = '';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1초
        this.loadLocalPosts(); // 백업용으로만 사용
    }

    // 매니저 초기화
    async initializeManager() {
        console.log('BoardManager 초기화 시작...');
        
        // Firebase 초기화 대기
        if (!window.firebaseInitialized) {
            console.log('Firebase 초기화 대기 중...');
            await this.waitForFirebase();
        }
        
        // postsCollection 확인
        if (!window.postsCollection) {
            console.error('postsCollection이 정의되지 않았습니다.');
            return;
        }
        
        try {
            // 기존 사용자들의 등급 업데이트 (일회성)
            try {
                await this.updateExistingUsersRoles();
            } catch (error) {
                console.error('사용자 등급 업데이트 오류:', error);
            }
            
            await this.initSampleData();
            console.log('BoardManager Firebase 모드로 초기화 완료');
        } catch (error) {
            console.error('BoardManager 초기화 오류:', error);
            // Firebase 오류여도 계속 Firebase 사용 시도
        }
    }

    // Firebase 초기화 대기
    async waitForFirebase(maxWait = 10000) {
        const startTime = Date.now();
        
        while (!window.firebaseInitialized && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!window.firebaseInitialized) {
            throw new Error('Firebase 초기화 타임아웃');
        }
        
        console.log('Firebase 초기화 완료 확인');
    }

    // Firestore 접근 가능 여부 확인
    canAccessFirestore() {
        return window.firebaseInitialized && window.postsCollection;
    }

    // 재시도 로직이 포함된 Firebase 작업 실행
    async executeWithRetry(operation, operationName = 'Firebase 작업') {
        // Firestore 접근 가능 여부 확인
        if (!this.canAccessFirestore()) {
            console.warn(`${operationName}: Firestore 접근 불가 - 빈 결과 반환`);
            if (operationName.includes('조회')) {
                return [];
            } else {
                throw new Error('Firestore에 접근할 수 없습니다.');
            }
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.error(`${operationName} 시도 ${attempt}/${this.maxRetries} 실패:`, error);
                
                if (attempt === this.maxRetries) {
                    // 최종 실패 시 사용자에게 알림
                    if (operationName.includes('조회')) {
                        console.warn('데이터 조회 실패 - 빈 배열 반환');
                        return [];
                    } else {
                        throw new Error(`${operationName}이 ${this.maxRetries}번 시도 후 실패했습니다.`);
                    }
                }
                
                // 재시도 전 대기
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    // 로컬 게시글 불러오기 (백업용)
    loadLocalPosts() {
        const saved = localStorage.getItem('pm-community-posts');
        if (saved) {
            try {
                this.posts = JSON.parse(saved);
            } catch (error) {
                console.error('로컬 게시글 데이터 파싱 오류:', error);
                this.posts = {};
            }
        }
    }

    // 로컬 게시글 저장 (백업용)
    saveLocalPosts() {
        try {
            localStorage.setItem('pm-community-posts', JSON.stringify(this.posts));
        } catch (error) {
            console.error('로컬 게시글 저장 오류:', error);
        }
    }

    // 샘플 데이터 초기화 (인증 불필요)
    async initSampleData() {
        return this.executeWithRetry(async () => {
            // 인증 상태와 관계없이 읽기 권한이 있는 경우 데이터 확인
            const snapshot = await window.postsCollection.limit(1).get();
            if (snapshot.empty) {
                console.log('샘플 데이터가 없습니다. 로그인 후 추가 가능합니다.');
                // 로그인하지 않은 상태에서는 샘플 데이터 추가하지 않음
                if (window.firestoreReady) {
                    console.log('Firebase 샘플 데이터 추가 중...');
                    await this.addSamplePosts();
                }
            }
        }, '샘플 데이터 초기화');
    }

    // 샘플 게시글 추가 (현재 비활성화)
    async addSamplePosts() {
        // 샘플 데이터를 제거하여 깨끗한 상태로 시작
        console.log('샘플 데이터 추가 건너뜀 - 깨끗한 상태로 시작');
    }

    // 게시글 추가
    async addPost(boardId, postData) {
        return this.executeWithRetry(async () => {
            const newPost = {
                boardId: boardId,
                title: postData.title,
                content: postData.content,  
                source: postData.source || '',
                author: postData.author || '익명',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await window.postsCollection.add(newPost);
            console.log('Firebase 게시글 추가 완료:', docRef.id);
            
            // 백업용으로 로컬에도 저장
            this.addLocalPost(boardId, { 
                ...postData, 
                id: docRef.id,
                date: new Date()
            });
            
            return { id: docRef.id, ...newPost };
        }, '게시글 추가');
    }

    // 로컬 게시글 추가 (백업용)
    addLocalPost(boardId, postData) {
        if (!this.posts[boardId]) {
            this.posts[boardId] = [];
        }
        
        const newPost = {
            id: postData.id || Date.now(),
            title: postData.title,
            content: postData.content,
            source: postData.source || '',
            date: postData.date || new Date(),
            author: postData.author || '익명'
        };
        
        this.posts[boardId].unshift(newPost);
        this.saveLocalPosts();
        return newPost;
    }

    // 특정 게시판 게시글 가져오기
    async getPosts(boardId) {
        return this.executeWithRetry(async () => {
            const snapshot = await window.postsCollection
                .where('boardId', '==', boardId)
                .get();
            
            const posts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                posts.push({
                    id: doc.id,
                    ...data,
                    date: data.createdAt ? data.createdAt.toDate() : new Date()
                });
            });
            
            // 클라이언트 측에서 정렬 (인덱스 문제 해결)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            console.log(`Firebase에서 ${boardId} 게시판 ${posts.length}개 게시글 조회 완료`);
            return posts;
        }, `${boardId} 게시글 조회`);
    }

    // 로컬 게시글 가져오기
    getLocalPosts(boardId) {
        if (!this.posts[boardId]) {
            return [];
        }
        return this.posts[boardId].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 모든 게시판의 최근 게시글 가져오기
    async getRecentPosts(limit = 6) {
        return this.executeWithRetry(async () => {
            const snapshot = await window.postsCollection.get();
            
            const posts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                posts.push({
                    id: doc.id,
                    ...data,
                    date: data.createdAt ? data.createdAt.toDate() : new Date(),
                    boardName: this.boardNames[data.boardId] || '게시판'
                });
            });
            
            // 클라이언트 측에서 정렬 후 제한 (인덱스 문제 해결)
            posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            const limitedPosts = posts.slice(0, limit);
            
            console.log(`Firebase에서 최근 게시글 ${limitedPosts.length}개 조회 완료`);
            return limitedPosts;
        }, '최근 게시글 조회');
    }

    // 로컬 최근 게시글 가져오기
    getLocalRecentPosts(limit = 6) {
        const allPosts = [];
        
        Object.keys(this.posts).forEach(boardId => {
            this.posts[boardId].forEach(post => {
                allPosts.push({
                    ...post,
                    boardId,
                    boardName: this.boardNames[boardId]
                });
            });
        });
        
        return allPosts
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    // 게시판 이름 가져오기
    getBoardName(boardId) {
        return this.boardNames[boardId] || '게시판';
    }

    // 게시판 이름 매핑
    boardNames = {
        'job-info': '직무',
        'career-prep': '취업준비', 
        'news': '뉴스',
        'faq': '자주나오는 질문',
        'policy-library': '정책도서관',
        'study': '스터디'
    };

    // 사용자 등급 관리
    userRoles = {
        SUPERVISOR: 'supervisor',
        ADMIN: 'admin', 
        CORE: 'core',
        GENERAL: 'general'
    };

    roleNames = {
        'supervisor': '슈퍼바이저',
        'admin': '운영진',
        'core': '핵심',
        'general': '일반'
    };

    // 등급별 권한 확인
    canWritePost(userRole) {
        return userRole === this.userRoles.SUPERVISOR || 
               userRole === this.userRoles.ADMIN || 
               userRole === this.userRoles.CORE;
    }

    canDeletePost(userRole) {
        return userRole === this.userRoles.SUPERVISOR || 
               userRole === this.userRoles.ADMIN;
    }

    canManageUsers(userRole) {
        return userRole === this.userRoles.SUPERVISOR || 
               userRole === this.userRoles.ADMIN;
    }

    canChangeRole(currentUserRole, targetUserRole) {
        // 슈퍼바이저는 모든 등급 변경 가능
        if (currentUserRole === this.userRoles.SUPERVISOR) {
            return true;
        }
        // 운영진은 슈퍼바이저 등급 변경 불가
        if (currentUserRole === this.userRoles.ADMIN) {
            return targetUserRole !== this.userRoles.SUPERVISOR;
        }
        return false;
    }

    // 사용자 등급 업데이트
    async updateUserRole(userId, newRole) {
        return this.executeWithRetry(async () => {
            await db.collection('users').doc(userId).update({
                role: newRole,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`사용자 ${userId}의 등급이 ${newRole}로 변경되었습니다.`);
        }, '사용자 등급 업데이트');
    }

    // 모든 사용자 조회 (관리자용)
    async getAllUsers() {
        return this.executeWithRetry(async () => {
            const snapshot = await db.collection('users').get();
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    ...data,
                    role: data.role || 'general' // 기본값은 일반
                });
            });
            return users.sort((a, b) => {
                const roleOrder = {
                    'supervisor': 0,
                    'admin': 1,
                    'core': 2,
                    'general': 3
                };
                return roleOrder[a.role] - roleOrder[b.role];
            });
        }, '전체 사용자 조회');
    }

    // 기존 사용자들의 등급 업데이트 (일회성 실행)
    async updateExistingUsersRoles() {
        return this.executeWithRetry(async () => {
            const snapshot = await db.collection('users').get();
            const batch = db.batch();
            let updateCount = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.role) {
                    // 등급이 없는 사용자들에게 기본 등급 추가
                    let role = 'general';
                    
                    // 특정 이메일은 슈퍼바이저로 설정
                    if (data.email === 'meangyun0729@gmail.com') {
                        role = 'supervisor';
                    }
                    
                    batch.update(doc.ref, { 
                        role: role,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    updateCount++;
                    console.log(`사용자 ${data.email}에게 ${role} 등급 추가`);
                }
            });

            if (updateCount > 0) {
                await batch.commit();
                console.log(`${updateCount}명의 사용자 등급 업데이트 완료`);
            } else {
                console.log('업데이트할 사용자가 없습니다.');
            }

            return updateCount;
        }, '기존 사용자 등급 업데이트');
    }
}

// 전역 게시판 매니저 인스턴스 - 즉시 생성
console.log('BoardManager 인스턴스 생성 중...');
window.boardManager = new HybridBoardManager();
console.log('BoardManager 인스턴스 생성 완료');

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드 완료 - BoardManager 초기화 시작');
    try {
        if (window.boardManager) {
            await window.boardManager.initializeManager();
            console.log('BoardManager 초기화 성공');
            
            // BoardManager 초기화 완료 후 회원 관리 메뉴 업데이트
            if (window.currentUser && typeof updateUserManagementMenu === 'function') {
                updateUserManagementMenu(window.currentUser.role);
            }
        } else {
            console.error('BoardManager 인스턴스가 없습니다.');
        }
    } catch (error) {
        console.error('BoardManager 초기화 실패:', error);
    }
});

// 페이지 전환 함수들
async function showHomePage() {
    // null 체크 추가
    const homePage = document.getElementById('home-page');
    const boardPage = document.getElementById('board-page');
    const booksPage = document.getElementById('books-page');
    const consultingPage = document.getElementById('consulting-page');
    
    if (homePage) homePage.style.display = 'block';
    if (boardPage) boardPage.style.display = 'none';
    if (booksPage) booksPage.style.display = 'none';
    if (consultingPage) consultingPage.style.display = 'none';
    
    // boardManager 초기화 완료 대기
    if (window.boardManager && typeof window.boardManager.initializeManager === 'function') {
        try {
            await window.boardManager.initializeManager();
        } catch (error) {
            console.error('BoardManager 초기화 오류:', error);
        }
    }
    
    updateRecentPosts();
}

function showBoard(boardId) {
    if (window.boardManager) {
        window.boardManager.currentBoard = boardId;
    }
    
    // null 체크 추가
    const homePage = document.getElementById('home-page');
    const boardPage = document.getElementById('board-page');
    const booksPage = document.getElementById('books-page');
    const consultingPage = document.getElementById('consulting-page');
    const boardTitle = document.getElementById('board-title');
    
    if (homePage) homePage.style.display = 'none';
    if (boardPage) boardPage.style.display = 'block';
    if (booksPage) booksPage.style.display = 'none';
    if (consultingPage) consultingPage.style.display = 'none';
    
    // 게시판 제목 설정
    if (boardTitle && window.boardManager) {
        boardTitle.textContent = window.boardManager.getBoardName(boardId);
    }
    
    // 기존 컨설팅받기 버튼 제거 (헤더에서)
    const existingConsultingBtn = document.getElementById('consulting-btn');
    if (existingConsultingBtn) {
        existingConsultingBtn.remove();
    }
    
    // 게시글 목록 업데이트
    updatePostsList(boardId);
}

function showCategory(category) {
    if (category === 'books') {
        showBooksPage();
    }
}

function showBooksPage() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'block';
    document.getElementById('consulting-page').style.display = 'none';
    loadBooks();
}

function showConsultingPage() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'none';
    document.getElementById('consulting-page').style.display = 'block';
    
    // 슬라이드쇼 초기화
    setTimeout(() => {
        initReviewSlideshow();
        startAutoSlide();
    }, 100);
}

// 게시글 목록 업데이트 (하이브리드)
async function updatePostsList(boardId) {
    const postsList = document.getElementById('posts-list');
    if (!postsList) {
        console.error('posts-list 요소를 찾을 수 없습니다.');
        return;
    }
    
    postsList.innerHTML = '<div class="loading">게시글을 불러오는 중...</div>';
    
    try {
        if (!window.boardManager) {
            console.error('BoardManager가 초기화되지 않았습니다.');
            postsList.innerHTML = '<div class="error">게시판 관리자가 초기화되지 않았습니다.</div>';
            return;
        }
        
        const posts = await window.boardManager.getPosts(boardId);
        
        // 페이지네이션 적용
        updatePostsListWithPagination(boardId, posts);
    } catch (error) {
        console.error('게시글 목록 업데이트 오류:', error);
        postsList.innerHTML = '<div class="error">게시글을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 최근 게시글 업데이트 (하이브리드)
async function updateRecentPosts() {
    const recentPostsContainer = document.getElementById('recent-posts');
    if (!recentPostsContainer) {
        console.error('recent-posts 요소를 찾을 수 없습니다.');
        return;
    }
    
    recentPostsContainer.innerHTML = '<div class="loading">최근 게시글을 불러오는 중...</div>';
    
    try {
        if (!window.boardManager) {
            console.error('BoardManager가 초기화되지 않았습니다.');
            recentPostsContainer.innerHTML = '<div class="error">게시판 관리자가 초기화되지 않았습니다.</div>';
            return;
        }
        
        const posts = await window.boardManager.getRecentPosts();
        recentPostsContainer.innerHTML = '';
        
        if (posts.length === 0) {
            recentPostsContainer.innerHTML = `
                <div class="no-recent-posts">
                    <p>최근 게시글이 없습니다.</p>
                </div>
            `;
            return;
        }
        
        // 그리드 컨테이너 생성
        const gridContainer = document.createElement('div');
        gridContainer.className = 'recent-posts-grid';
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'recent-post-card';
            postElement.innerHTML = `
                <div class="recent-post-category">${post.boardName}</div>
                <h4 class="recent-post-title" onclick="showBoard('${post.boardId}')">${post.title}</h4>
                <div class="recent-post-preview">${post.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</div>
                <div class="recent-post-meta">
                    <span class="recent-post-author">${post.author}</span>
                    <span class="recent-post-date">${formatDate(post.date)}</span>
                </div>
            `;
            gridContainer.appendChild(postElement);
        });
        
        recentPostsContainer.appendChild(gridContainer);
    } catch (error) {
        console.error('최근 게시글 업데이트 오류:', error);
        recentPostsContainer.innerHTML = '<div class="error">최근 게시글을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 글쓰기 모달 관련 함수들
function showWriteModal() {
    // 로그인 체크
    if (!window.currentUser) {
        alert('글을 작성하려면 로그인이 필요합니다.');
        signInWithGoogle();
        return;
    }
    
    // boardManager 초기화 체크
    if (!window.boardManager || !window.boardManager.userRoles) {
        alert('시스템이 아직 초기화 중입니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    // 글쓰기 권한 체크
    const userRole = window.currentUser.role || 'general';
    if (!window.boardManager.canWritePost(userRole)) {
        alert('글 작성 권한이 없습니다. 핵심 회원 이상만 글을 작성할 수 있습니다.');
        return;
    }
    
    document.getElementById('write-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeWriteModal() {
    document.getElementById('write-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 폼 초기화
    document.getElementById('write-form').reset();
    document.getElementById('post-content').innerHTML = '';
}

// 글쓰기 폼 제출 처리 (Firebase)
document.addEventListener('DOMContentLoaded', function() {
    const writeForm = document.getElementById('write-form');
    if (writeForm) {
        writeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').innerHTML.trim();
            const source = document.getElementById('post-source').value.trim();
            
            if (!title || !content) {
                alert('제목과 내용을 모두 입력해주세요.');
                return;
            }
            
            // boardManager 초기화 확인
            if (!window.boardManager) {
                alert('시스템이 초기화되지 않았습니다. 페이지를 새로고침 후 다시 시도해주세요.');
                return;
            }
            
            // 현재 게시판 ID 가져오기
            const currentBoardId = getCurrentBoardId() || window.boardManager.currentBoard;
            if (!currentBoardId) {
                alert('게시판을 선택해주세요.');
                return;
            }
            
            const submitBtn = document.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '게시 중...';
            submitBtn.disabled = true;
            
            try {
                await window.boardManager.addPost(currentBoardId, {
                    title: title,
                    content: content,
                    source: source,
                    author: updatePostAuthor()
                });
                
                closeWriteModal();
                alert('게시글이 성공적으로 등록되었습니다!');
                // 게시글 목록 새로고침
                updatePostsList(currentBoardId);
            } catch (error) {
                console.error('게시글 등록 오류:', error);
                alert('게시글 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// 텍스트 포맷팅 함수들
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('post-content').focus();
}

function insertImage() {
    document.getElementById('image-upload').click();
}

async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        alert('이미지 크기는 5MB 이하로 업로드해주세요.');
        return;
    }
    
    if (window.boardManager && window.boardManager.useFirebase) {
        try {
            // Firebase Storage에 이미지 업로드
            const storageRef = storage.ref();
            const imageRef = storageRef.child(`images/${Date.now()}_${file.name}`);
            
            const uploadTask = imageRef.put(file);
            
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('업로드 진행률:', progress + '%');
                }, 
                (error) => {
                    console.error('Firebase 이미지 업로드 오류:', error);
                    // Firebase 실패 시 로컬로 폴백
                    handleLocalImageUpload(file);
                }, 
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    const img = `<img src="${downloadURL}" alt="업로드된 이미지" style="max-width: 100%; height: auto; margin: 10px 0;">`;
                    document.getElementById('post-content').innerHTML += img;
                    console.log('Firebase 이미지 업로드 완료:', downloadURL);
                }
            );
        } catch (error) {
            console.error('Firebase 이미지 업로드 오류:', error);
            handleLocalImageUpload(file);
        }
    } else {
        handleLocalImageUpload(file);
    }
}

// 로컬 이미지 업로드 (Base64)
function handleLocalImageUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = `<img src="${e.target.result}" alt="업로드된 이미지" style="max-width: 100%; height: auto; margin: 10px 0;">`;
        document.getElementById('post-content').innerHTML += img;
        console.log('로컬 이미지 업로드 완료');
    };
    reader.readAsDataURL(file);
}

// 게시글 상세보기
async function showFullPost(postId, boardId) {
    try {
        let post;
        
        if (window.boardManager && window.boardManager.useFirebase) {
            const doc = await window.postsCollection.doc(postId).get();
            if (!doc.exists) {
                alert('게시글을 찾을 수 없습니다.');
                return;
            }
            post = { id: doc.id, ...doc.data() };
        } else {
            // 로컬에서 게시글 찾기
            const posts = window.boardManager ? window.boardManager.getLocalPosts(boardId) : [];
            post = posts.find(p => p.id == postId);
            if (!post) {
                alert('게시글을 찾을 수 없습니다.');
                return;
            }
        }
        
        const date = post.createdAt ? post.createdAt.toDate() : (post.date || new Date());
        
        // 삭제 버튼 표시 여부 확인
        const userRole = window.currentUser?.role || (window.boardManager?.userRoles?.GENERAL || 'general');
        const canDelete = window.boardManager?.canDeletePost(userRole) || false;
        
        // 모달 생성 및 표시
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content post-detail-modal">
                <div class="modal-header">
                    <h2>${post.title}</h2>
                    <div class="modal-header-actions">
                        ${canDelete ? `<button class="btn-delete-post" onclick="deletePost('${postId}', '${boardId}')">
                            <i class="fas fa-trash"></i> 삭제
                        </button>` : ''}
                        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                    </div>
                </div>
                <div class="post-detail-meta">
                    <div class="post-detail-info">
                        <span><i class="fas fa-user"></i> ${post.author}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(date)}</span>
                        <span><i class="fas fa-folder"></i> ${window.boardManager ? window.boardManager.getBoardName(boardId) : '게시판'}</span>
                    </div>
                </div>
                <div class="post-detail-content">
                    ${post.content}
                </div>
                ${post.source ? `
                    <div class="post-detail-source">
                        <h4><i class="fas fa-link"></i> 출처</h4>
                        <p>${post.source}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
        });
        
    } catch (error) {
        console.error('게시글 조회 오류:', error);
        alert('게시글을 불러오는 중 오류가 발생했습니다.');
    }
}

// 게시글 삭제 함수
async function deletePost(postId, boardId) {
    // 권한 재확인
    const userRole = window.currentUser?.role || 'general';
    if (!window.boardManager?.canDeletePost(userRole)) {
        alert('게시글 삭제 권한이 없습니다.');
        return;
    }
    
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        if (window.boardManager && window.boardManager.useFirebase) {
            await window.postsCollection.doc(postId).delete();
            console.log('Firebase에서 게시글 삭제 완료:', postId);
        }
        
        // 로컬에서도 삭제
        if (window.boardManager && window.boardManager.posts[boardId]) {
            window.boardManager.posts[boardId] = window.boardManager.posts[boardId].filter(post => post.id !== postId);
            window.boardManager.saveLocalPosts();
        }
        
        // 모달 닫기
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
        
        // 게시글 목록 새로고침
        updatePostsList(boardId);
        alert('게시글이 삭제되었습니다.');
        
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        alert('게시글 삭제 중 오류가 발생했습니다.');
    }
}

// 카카오톡 오픈채팅 관련 함수들
function openKakaoChat() {
    document.getElementById('kakaoModal').style.display = 'block';
}

function closeKakaoModal() {
    document.getElementById('kakaoModal').style.display = 'none';
}

// 날짜 포맷팅 함수
function formatDate(date) {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return '방금 전';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR');
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    // 홈페이지 표시
    await showHomePage();
    
    // 모달 외부 클릭 시 닫기 이벤트
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
});

// 추천도서 관련 함수들
async function loadBooks() {
    const booksGrid = document.getElementById('booksGrid');
    booksGrid.innerHTML = '<div class="loading">도서 목록을 불러오는 중...</div>';
    
    // 임시로 빈 상태 표시
    booksGrid.innerHTML = `
        <div class="no-books">
            <i class="fas fa-book-open"></i>
            <h3>추천도서 기능 준비 중</h3>
            <p>곧 다양한 PM/PO 추천도서를 만나보실 수 있습니다!</p>
        </div>
    `;
}

function createBookElement(book) {
    const bookElement = document.createElement('div');
    bookElement.className = 'book-card';
    
    const tags = book.tags ? book.tags.split(',').map(tag => tag.trim()) : [];
    const tagsHtml = tags.map(tag => `<span class="book-tag">${tag}</span>`).join('');
    
    bookElement.innerHTML = `
        <div class="book-cover" onclick="showBookDetail('${book.id}')">
            ${book.coverImage ? 
                `<img src="${book.coverImage}" alt="${book.title}">` : 
                `<div class="book-cover-placeholder"><i class="fas fa-book"></i></div>`
            }
        </div>
        <div class="book-info">
            <h3 class="book-title" onclick="showBookDetail('${book.id}')">${book.title}</h3>
            <p class="book-author">${book.author}</p>
            <div class="book-tags">${tagsHtml}</div>
            <p class="book-reason">${book.reason.substring(0, 100)}...</p>
            <div class="book-meta">
                <span class="book-writer">추천: ${book.authorName}</span>
                <span class="book-date">${formatDate(book.createdAt ? book.createdAt.toDate() : new Date())}</span>
            </div>
        </div>
    `;
    
    return bookElement;
}

// 도서 추가 모달 관련 함수들
function showAddBookModal() {
    document.getElementById('addBookModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAddBookModal() {
    document.getElementById('addBookModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('addBookForm').reset();
    document.getElementById('bookContentEditor').innerHTML = '';
}

// 도서 추가 폼 제출 처리 (Firebase)
document.addEventListener('DOMContentLoaded', function() {
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
        addBookForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const bookData = {
                title: formData.get('bookTitle').trim(),
                author: formData.get('bookAuthor').trim(),
                publisher: formData.get('bookPublisher').trim(),
                category: formData.get('bookCategory'),
                tags: formData.get('bookTags').trim(),
                reason: formData.get('bookReason').trim(),
                content: document.getElementById('bookContentEditor').innerHTML.trim(),
                authorName: formData.get('bookAuthorName').trim()
            };
            
            if (!bookData.title || !bookData.author || !bookData.reason || !bookData.authorName) {
                alert('필수 항목을 모두 입력해주세요.');
                return;
            }
            
            const submitBtn = document.querySelector('#addBookForm .btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '추가 중...';
            submitBtn.disabled = true;
            
            try {
                await booksCollection.add({
                    ...bookData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                closeAddBookModal();
                alert('도서가 성공적으로 추가되었습니다!');
                loadBooks(); // 목록 새로고침
                
            } catch (error) {
                console.error('도서 추가 오류:', error);
                alert('도서 추가 중 오류가 발생했습니다. 다시 시도해주세요.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});

// 도서 상세보기
async function showBookDetail(bookId) {
    try {
        const doc = await booksCollection.doc(bookId).get();
        if (!doc.exists) {
            alert('도서 정보를 찾을 수 없습니다.');
            return;
        }
        
        const book = { id: doc.id, ...doc.data() };
        
        // 모달에 데이터 설정
        document.getElementById('detailBookTitle').textContent = book.title;
        document.getElementById('detailBookAuthor').textContent = book.author;
        document.getElementById('detailBookPublisher').textContent = book.publisher || '-';
        document.getElementById('detailBookDate').textContent = formatDate(book.createdAt ? book.createdAt.toDate() : new Date());
        document.getElementById('detailBookWriter').textContent = book.authorName;
        document.getElementById('detailBookReason').textContent = book.reason;
        document.getElementById('detailBookContent').innerHTML = book.content || '-';
        
        // 태그 설정
        const tagsContainer = document.getElementById('detailBookTags');
        tagsContainer.innerHTML = '';
        if (book.tags) {
            const tags = book.tags.split(',').map(tag => tag.trim());
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'book-tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // 커버 이미지 설정
        const coverElement = document.getElementById('detailBookCover');
        if (book.coverImage) {
            coverElement.innerHTML = `<img src="${book.coverImage}" alt="${book.title}">`;
        } else {
            coverElement.innerHTML = '<i class="fas fa-book"></i>';
        }
        
        // 모달 표시
        document.getElementById('bookDetailModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('도서 상세 조회 오류:', error);
        alert('도서 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

function closeBookDetailModal() {
    document.getElementById('bookDetailModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 도서 필터링
function filterBooks() {
    const filterValue = document.getElementById('bookFilter').value;
    const bookCards = document.querySelectorAll('.book-card');
    
    bookCards.forEach(card => {
        if (filterValue === 'all') {
            card.style.display = 'block';
        } else {
            const tags = card.querySelector('.book-tags').textContent;
            if (tags.includes(filterValue)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// 도서 텍스트 포맷팅
function formatBookText(command) {
    document.execCommand(command, false, null);
    document.getElementById('bookContentEditor').focus();
}

// 컨설팅 후기 이미지 관리
const consultingReviews = [
    // 샘플 이미지들 - 실제 이미지 파일을 reviews/consulting/ 폴더에 추가하세요
    {
        src: './reviews/consulting/review1.jpg',
        caption: '이력서 컨설팅 후기 - "정말 도움이 많이 되었습니다!"'
    },
    {
        src: './reviews/consulting/review2.jpg',
        caption: '포트폴리오 컨설팅 후기 - "체계적인 피드백 감사합니다"'
    },
    {
        src: './reviews/consulting/review3.jpg',
        caption: '커리어 컨설팅 후기 - "명확한 방향을 잡을 수 있었어요"'
    },
    {
        src: './reviews/consulting/review4.jpg',
        caption: '자기소개서 컨설팅 후기 - "합격할 수 있었습니다!"'
    }
];

// 컨설팅 후기 로드
function loadConsultingReviews() {
    const reviewsGallery = document.getElementById('reviewsGallery');
    const reviewsPlaceholder = document.getElementById('reviewsPlaceholder');
    
    if (!reviewsGallery) return;
    
    // 기존 내용 초기화
    reviewsGallery.innerHTML = '';
    
    if (consultingReviews.length === 0) {
        reviewsPlaceholder.style.display = 'block';
        return;
    }
    
    reviewsPlaceholder.style.display = 'none';
    
    consultingReviews.forEach((review, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <img src="${review.src}" alt="컨설팅 후기 ${index + 1}" 
                 onclick="openImageModal('${review.src}', '${review.caption}')"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div class="review-placeholder" style="display: none;">
                <i class="fas fa-image"></i>
                <p>이미지 준비 중</p>
            </div>
            <div class="review-caption">${review.caption}</div>
        `;
        reviewsGallery.appendChild(reviewItem);
    });
    
    // 슬라이더 기능 초기화
    initReviewSlider();
}

// 이미지 모달 열기
function openImageModal(src, caption) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    if (!modal) {
        // 이미지 모달이 없으면 생성
        createImageModal();
        return openImageModal(src, caption);
    }
    
    modal.style.display = 'block';
    modalImg.src = src;
    modalCaption.textContent = caption;
    document.body.style.overflow = 'hidden';
}

// 이미지 모달 닫기
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 이미지 모달 생성
function createImageModal() {
    const modalHTML = `
        <div id="imageModal" class="image-modal" onclick="closeImageModal()">
            <div class="image-modal-content">
                <span class="close" onclick="closeImageModal()">&times;</span>
                <img id="modalImage" src="" alt="후기 이미지">
                <div id="modalCaption" class="image-caption"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 후기 슬라이더 초기화
function initReviewSlider() {
    const reviewsGallery = document.getElementById('reviewsGallery');
    if (!reviewsGallery) return;
    
    let currentSlide = 0;
    const reviewItems = reviewsGallery.querySelectorAll('.review-item');
    
    if (reviewItems.length <= 1) return;
    
    // 슬라이더 컨트롤 추가
    const sliderControls = document.createElement('div');
    sliderControls.className = 'slider-controls';
    sliderControls.innerHTML = `
        <button class="slider-btn prev-btn" onclick="changeSlide(-1)">
            <i class="fas fa-chevron-left"></i>
        </button>
        <div class="slider-dots">
            ${Array.from({length: reviewItems.length}, (_, i) => 
                `<span class="dot ${i === 0 ? 'active' : ''}" onclick="currentSlide = ${i}; updateSlider()"></span>`
            ).join('')}
        </div>
        <button class="slider-btn next-btn" onclick="changeSlide(1)">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    reviewsGallery.parentNode.insertBefore(sliderControls, reviewsGallery.nextSibling);
    
    // 전역 함수로 등록
    window.changeSlide = function(direction) {
        currentSlide += direction;
        if (currentSlide >= reviewItems.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = reviewItems.length - 1;
        updateSlider();
    };
    
    window.updateSlider = function() {
        const dots = document.querySelectorAll('.slider-dots .dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        // 모바일에서는 슬라이드 효과, 데스크톱에서는 그리드 유지
        if (window.innerWidth <= 768) {
            reviewsGallery.style.transform = `translateX(-${currentSlide * 100}%)`;
        }
    };
    
    // 자동 슬라이드 (5초마다)
    setInterval(() => {
        if (window.innerWidth <= 768) {
            changeSlide(1);
        }
    }, 5000);
}

// 프로필 설정 모달 관련 함수들
function showProfileSetupModal(user, isEditMode = false) {
    const modal = document.getElementById('profile-setup-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 수정 모드인 경우 기존 정보로 폼 채우기
    if (isEditMode && window.currentUser) {
        document.getElementById('nickname').value = window.currentUser.nickname || '';
        document.getElementById('job').value = window.currentUser.job || '';
        document.getElementById('domain').value = window.currentUser.domain || '';
        document.getElementById('region').value = window.currentUser.region || '';
        updateNicknamePreview();
        
        // 모달 제목 변경
        const modalTitle = modal.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = '프로필 수정';
        }
        
        // 버튼 텍스트 변경
        const submitBtn = modal.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.textContent = '수정 완료';
        }
    } else {
        // 신규 등록 모드
        const modalTitle = modal.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = '프로필 설정';
        }
        
        const submitBtn = modal.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.textContent = '저장';
        }
    }
    
    // 폼 이벤트 리스너 추가
    setupProfileFormListeners(user || window.currentUser, isEditMode);
}

function closeProfileSetupModal() {
    const modal = document.getElementById('profile-setup-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 폼 초기화
    document.getElementById('profile-setup-form').reset();
    updateNicknamePreview();
}

function setupProfileFormListeners(user, isEditMode = false) {
    console.log('setupProfileFormListeners 호출됨');
    
    const form = document.getElementById('profile-setup-form');
    if (!form) {
        console.error('profile-setup-form을 찾을 수 없습니다');
        return;
    }
    
    const inputs = form.querySelectorAll('input, select');
    console.log('찾은 입력 요소 개수:', inputs.length);
    
    // 기존 이벤트 리스너 제거
    inputs.forEach(input => {
        input.removeEventListener('change', updateNicknamePreview);
        input.removeEventListener('input', updateNicknamePreview);
    });
    
    // 실시간 닉네임 미리보기 업데이트
    inputs.forEach((input, index) => {
        console.log(`입력 요소 ${index}: ${input.id || input.name}`);
        input.addEventListener('change', () => {
            console.log(`${input.id} 변경됨:`, input.value);
            updateNicknamePreview();
        });
        input.addEventListener('input', () => {
            console.log(`${input.id} 입력됨:`, input.value);
            updateNicknamePreview();
        });
    });
    
    // 초기 미리보기 업데이트
    setTimeout(() => {
        updateNicknamePreview();
    }, 100);
    
    // 폼 제출 이벤트
    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveUserProfile(user, isEditMode);
    };
}

function updateNicknamePreview() {
    console.log('updateNicknamePreview 호출됨');
    
    const nickname = document.getElementById('nickname')?.value?.trim() || '';
    const job = document.getElementById('job')?.value || '';
    const domain = document.getElementById('domain')?.value || '';
    const region = document.getElementById('region')?.value || '';
    
    console.log('입력값:', { nickname, job, domain, region });
    
    const previewText = document.getElementById('preview-text');
    if (!previewText) {
        console.error('preview-text 요소를 찾을 수 없습니다');
        return;
    }
    
    if (nickname && job && domain && region) {
        const fullNickname = `${nickname}/${job}/${domain}/${region}`;
        previewText.textContent = fullNickname;
        previewText.classList.remove('empty');
        console.log('완성된 닉네임:', fullNickname);
    } else {
        previewText.textContent = '정보를 입력하면 닉네임이 표시됩니다';
        previewText.classList.add('empty');
        console.log('정보 부족으로 기본 메시지 표시');
    }
}

async function saveUserProfile(user, isEditMode = false) {
    const nickname = document.getElementById('nickname').value.trim();
    const job = document.getElementById('job').value;
    const domain = document.getElementById('domain').value;
    const region = document.getElementById('region').value;
    
    if (!nickname || !job || !domain || !region) {
        alert('모든 필드를 입력해주세요.');
        return;
    }
    
    const submitBtn = document.querySelector('#profile-setup-form .btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = isEditMode ? '수정 중...' : '저장 중...';
    submitBtn.disabled = true;
    
    try {
        // 사용자 등급 결정
        let userRole = 'general'; // 기본값
        
        // 슈퍼바이저 이메일 확인
        if (user.email === 'meangyun0729@gmail.com') {
            userRole = 'supervisor';
        }
        
        const userData = {
            nickname: nickname,
            job: job,
            domain: domain,
            region: region,
            email: user.email,
            role: userRole,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // 신규 등록인 경우에만 createdAt 추가
        if (!isEditMode) {
            userData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // 기존 사용자 정보 조회 (등급 유지를 위해)
        if (isEditMode) {
            try {
                const existingDoc = await db.collection('users').doc(user.uid).get();
                if (existingDoc.exists) {
                    const existingData = existingDoc.data();
                    // 기존 등급이 있으면 유지 (슈퍼바이저 이메일이 아닌 경우)
                    if (user.email !== 'meangyun0729@gmail.com' && existingData.role) {
                        userData.role = existingData.role;
                    }
                }
            } catch (error) {
                console.log('기존 사용자 정보 조회 실패, 기본값 사용');
            }
        }
        
        // 수정 모드인 경우 merge: true 옵션 사용
        await db.collection('users').doc(user.uid).set(userData, { merge: isEditMode });
        
        // 전역 사용자 정보 업데이트
        window.currentUser = {
            uid: user.uid,
            email: user.email,
            nickname: nickname,
            job: job,
            domain: domain,
            region: region,
            role: userData.role,
            displayName: `${nickname}/${job}/${domain}/${region}`
        };
        
        // UI 업데이트
        updateUIForLoggedInUser(user);
        
        // 회원 관리 메뉴 업데이트
        if (typeof updateUserManagementMenu === 'function') {
            updateUserManagementMenu(userData.role);
        }
        
        closeProfileSetupModal();
        alert(isEditMode ? '프로필이 성공적으로 수정되었습니다!' : '프로필이 성공적으로 저장되었습니다!');
        
    } catch (error) {
        console.error('프로필 저장 오류:', error);
        alert(isEditMode ? '프로필 수정 중 오류가 발생했습니다. 다시 시도해주세요.' : '프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 글 작성 시 작성자 이름 업데이트
function updatePostAuthor() {
    if (window.currentUser) {
        return window.currentUser.displayName;
    }
    return '익명';
}

// 슬라이드쇼 함수들
function initReviewSlideshow() {
    const slideshowContainer = document.getElementById('review-slideshow');
    const dotsContainer = document.getElementById('slideshow-dots');
    
    if (!slideshowContainer || !dotsContainer) return;
    
    // 슬라이드 생성
    slideshowContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    
    reviewImages.forEach((image, index) => {
        // 슬라이드 아이템 생성
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.innerHTML = `
            <img src="${image.src}" alt="${image.caption}" onclick="openReviewModal('${image.src}', '${image.caption}')"
                 onerror="this.src='./reviews/placeholder.jpg'; this.alt='후기 이미지 준비중'">
            <div class="slide-caption">${image.caption}</div>
        `;
        slideshowContainer.appendChild(slide);
        
        // 도트 생성
        const dot = document.createElement('span');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => currentSlideGo(index);
        dotsContainer.appendChild(dot);
    });
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    // 현재 슬라이드 비활성화
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    // 새 슬라이드 인덱스 계산
    currentSlide += direction;
    if (currentSlide >= slides.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slides.length - 1;
    
    // 새 슬라이드 활성화
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function currentSlideGo(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    // 현재 슬라이드 비활성화
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    // 새 슬라이드로 이동
    currentSlide = n;
    
    // 새 슬라이드 활성화
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function openReviewModal(src, caption) {
    const modal = document.getElementById('review-modal');
    const modalImg = document.getElementById('review-modal-image');
    const modalCaption = document.getElementById('review-modal-caption');
    
    if (modal && modalImg && modalCaption) {
        modal.style.display = 'block';
        modalImg.src = src;
        modalCaption.textContent = caption;
    }
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 자동 슬라이드 기능
function startAutoSlide() {
    setInterval(() => {
        changeSlide(1);
    }, 5000); // 5초마다 슬라이드 변경
}

// 페이지네이션 함수들
function updatePostsListWithPagination(boardId, posts) {
    const container = document.getElementById('posts-list');
    if (!container) return;
    
    totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const currentPosts = posts.slice(startIndex, endIndex);
    
    let html = '<div class="posts-container">';
    
    if (currentPosts.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>아직 게시글이 없습니다</h3>
                <p>첫 번째 게시글을 작성해보세요!</p>
            </div>
        `;
    } else {
        currentPosts.forEach(post => {
            const date = post.date ? new Date(post.date).toLocaleDateString() : '날짜 없음';
            html += `
                <div class="post-item" onclick="showFullPost('${post.id}', '${boardId}')">
                    <div class="post-header">
                        <h3 class="post-title">${post.title}</h3>
                        <span class="post-date">${date}</span>
                    </div>
                    <div class="post-preview">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</div>
                    <div class="post-footer">
                        <span class="post-author">작성자: ${post.author || '익명'}</span>
                        ${post.source ? `<span class="post-source">출처: ${post.source}</span>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    
    // 페이지네이션 컨트롤 추가
    if (totalPages > 1) {
        html += createPaginationHTML();
    }
    
    // 취업준비 게시판인 경우 컨설팅받기 버튼 추가
    if (boardId === 'career-prep') {
        html += `
            <div class="consulting-cta-section">
                <div class="consulting-cta-card">
                    <h3><i class="fas fa-user-tie"></i> 전문 컨설팅 서비스</h3>
                    <p>PM/PO 커리어 전문가와 1:1 맞춤형 컨설팅을 받아보세요</p>
                    <button class="consulting-btn" onclick="showConsultingPage()">
                        <i class="fas fa-comments"></i> 컨설팅받기
                    </button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function createPaginationHTML() {
    let html = '<div class="pagination">';
    
    // 이전 페이지 버튼
    if (currentPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">이전</button>`;
    }
    
    // 페이지 번호들
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="pagination-btn active">${i}</button>`;
        } else {
            html += `<button class="pagination-btn" onclick="goToPage(${i})">${i}</button>`;
        }
    }
    
    // 다음 페이지 버튼
    if (currentPage < totalPages) {
        html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">다음</button>`;
    }
    
    html += '</div>';
    return html;
}

function goToPage(page) {
    currentPage = page;
    const currentBoardId = getCurrentBoardId();
    if (currentBoardId) {
        updatePostsList(currentBoardId);
    }
}

function getCurrentBoardId() {
    // 현재 표시 중인 게시판 ID를 반환하는 헬퍼 함수
    const boardPage = document.getElementById('board-page');
    if (boardPage && boardPage.style.display !== 'none') {
        const titleElement = document.getElementById('board-title');
        if (titleElement) {
            const title = titleElement.textContent;
            // 제목으로 boardId 매핑
            const titleToBoardId = {
                '직무': 'job-info',
                '취업준비': 'career-prep',
                '뉴스': 'news',
                '정책도서관': 'policy-library',
                '자주나오는 질문': 'faq',
                '스터디': 'study'
            };
            return titleToBoardId[title] || null;
        }
    }
    return null;
}

// 회원 관리 페이지 함수들
function showUserManagementPage() {
    // 권한 확인 - 슈퍼바이저와 운영진만 접근 가능
    const userRole = window.currentUser?.role || 'general';
    if (userRole !== 'supervisor' && userRole !== 'admin') {
        alert('회원 관리 권한이 없습니다. 슈퍼바이저 또는 운영진만 접근할 수 있습니다.');
        return;
    }
    
    // 페이지 전환
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'none';
    document.getElementById('consulting-page').style.display = 'none';
    document.getElementById('user-management-page').style.display = 'block';
    
    // 사용자 목록 로드
    loadUsersList();
}

async function loadUsersList() {
    const usersList = document.getElementById('users-list');
    if (!usersList) return;
    
    usersList.innerHTML = '<div class="loading">회원 목록을 불러오는 중...</div>';
    
    // boardManager 초기화 확인
    if (!window.boardManager) {
        console.error('BoardManager가 초기화되지 않았습니다.');
        usersList.innerHTML = '<div class="error">시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.</div>';
        return;
    }
    
    try {
        const users = await window.boardManager.getAllUsers();
        
        let html = '<div class="users-container">';
        
        if (users.length === 0) {
            html += '<div class="empty-state">등록된 회원이 없습니다.</div>';
        } else {
            html += '<div class="users-header">';
            html += '<h3>전체 회원 목록 (' + users.length + '명)</h3>';
            html += '</div>';
            
            users.forEach(user => {
                const roleClass = user.role || 'general';
                const roleName = window.boardManager.roleNames[user.role] || '일반';
                const displayName = user.nickname ? 
                    `${user.nickname}/${user.job}/${user.domain}/${user.region}` : 
                    user.email;
                
                html += `
                    <div class="user-item ${roleClass}">
                        <div class="user-info">
                            <div class="user-name">${displayName}</div>
                            <div class="user-email">${user.email}</div>
                            <div class="user-role">
                                <span class="role-badge role-${roleClass}">${roleName}</span>
                            </div>
                        </div>
                        <div class="user-actions">
                            ${canChangeUserRole(user.role) ? `
                                <select class="role-select" onchange="changeUserRole('${user.id}', this.value, '${user.role}')">
                                    <option value="general" ${user.role === 'general' ? 'selected' : ''}>일반</option>
                                    <option value="core" ${user.role === 'core' ? 'selected' : ''}>핵심</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>운영진</option>
                                    ${window.currentUser?.role === 'supervisor' ? `<option value="supervisor" ${user.role === 'supervisor' ? 'selected' : ''}>슈퍼바이저</option>` : ''}
                                </select>
                            ` : `<span class="role-fixed">${roleName}</span>`}
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        usersList.innerHTML = html;
        
    } catch (error) {
        console.error('회원 목록 로드 오류:', error);
        usersList.innerHTML = '<div class="error">회원 목록을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

function canChangeUserRole(targetRole) {
    const currentUserRole = window.currentUser?.role || 'general';
    if (!window.boardManager) {
        return false;
    }
    return window.boardManager.canChangeRole(currentUserRole, targetRole);
}

async function changeUserRole(userId, newRole, currentRole) {
    const currentUserRole = window.currentUser?.role || 'general';
    
    // 권한 재확인
    if (!window.boardManager?.canChangeRole(currentUserRole, currentRole)) {
        alert('이 회원의 등급을 변경할 권한이 없습니다.');
        // 원래 값으로 되돌리기
        const selectElement = event.target;
        selectElement.value = currentRole;
        return;
    }
    
    if (currentRole === newRole) return; // 변경사항 없음
    
    const currentRoleName = window.boardManager?.roleNames[currentRole] || '일반';
    const newRoleName = window.boardManager?.roleNames[newRole] || '일반';
    
    if (!confirm(`정말로 이 회원의 등급을 "${currentRoleName}"에서 "${newRoleName}"로 변경하시겠습니까?`)) {
        // 취소 시 원래 값으로 되돌리기
        const selectElement = event.target;
        selectElement.value = currentRole;
        return;
    }
    
    try {
        await window.boardManager.updateUserRole(userId, newRole);
        alert(`회원 등급이 "${newRoleName}"로 변경되었습니다.`);
        
        // 목록 새로고침
        loadUsersList();
        
    } catch (error) {
        console.error('등급 변경 오류:', error);
        alert('등급 변경 중 오류가 발생했습니다.');
        
        // 오류 시 원래 값으로 되돌리기
        const selectElement = event.target;
        selectElement.value = currentRole;
    }
}

// 개발자 도구에서 사용할 수 있는 전역 함수
window.updateAllUserRoles = async function() {
    if (!window.boardManager) {
        console.error('BoardManager가 초기화되지 않았습니다.');
        return;
    }
    
    try {
        const updateCount = await window.boardManager.updateExistingUsersRoles();
        console.log(`사용자 등급 업데이트 완료: ${updateCount}명 업데이트됨`);
        return updateCount;
    } catch (error) {
        console.error('사용자 등급 업데이트 실패:', error);
        throw error;
    }
}; 