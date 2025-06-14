// 하이브리드 게시판 데이터 관리자 (Firebase + LocalStorage)
class HybridBoardManager {
    constructor() {
        this.currentBoard = '';
        this.useFirebase = false;
        this.posts = {};
        this.initialized = false;
        this.boardNames = {
            'job-info': '직무',
            'career-prep': '취업준비',
            'news': '뉴스',
            'policy-library': '정책도서관',
            'faq': '자주나오는 질문',
            'study': '스터디'
        };
        this.initializeManager();
    }

    // 매니저 초기화
    async initializeManager() {
        if (this.initialized) {
            return; // 이미 초기화됨
        }
        
        // Firebase 사용 가능 여부 확인
        try {
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                this.useFirebase = true;
                console.log('Firebase 모드로 초기화');
            } else {
                throw new Error('Firebase 사용 불가');
            }
        } catch (error) {
            this.useFirebase = false;
            console.log('로컬 스토리지 모드로 초기화');
            this.loadLocalPosts();
        }
        
        await this.initSampleData();
        this.initialized = true;
        console.log('BoardManager 초기화 완료');
    }

    // 로컬 스토리지에서 게시글 불러오기
    loadLocalPosts() {
        const saved = localStorage.getItem('pm-community-posts');
        this.posts = saved ? JSON.parse(saved) : {};
    }

    // 로컬 스토리지에 게시글 저장
    saveLocalPosts() {
        localStorage.setItem('pm-community-posts', JSON.stringify(this.posts));
    }

    // 샘플 데이터 초기화
    async initSampleData() {
        if (this.useFirebase) {
            try {
                const snapshot = await postsCollection.limit(1).get();
                if (snapshot.empty) {
                    console.log('Firebase 샘플 데이터 추가 중...');
                    await this.addSamplePosts();
                }
            } catch (error) {
                console.error('Firebase 샘플 데이터 초기화 오류:', error);
                this.useFirebase = false;
                this.initLocalSampleData();
            }
        } else {
            this.initLocalSampleData();
        }
    }

    // 로컬 샘플 데이터 초기화
    initLocalSampleData() {
        if (Object.keys(this.posts).length === 0) {
            console.log('로컬 샘플 데이터 추가 중...');
            this.posts = {
                'job-info': [
                    {
                        id: 1,
                        title: 'PM의 핵심 역할과 책임',
                        content: `프로덕트 매니저(PM)는 제품의 전략 수립부터 출시까지 전 과정을 관리하는 핵심 역할을 담당합니다.

<strong>주요 업무:</strong>
• 제품 로드맵 수립 및 관리
• 시장 조사 및 사용자 요구사항 분석
• 개발팀과의 협업 및 일정 관리
• 성과 분석 및 개선 방안 도출

실무에서는 다양한 이해관계자들과의 소통이 매우 중요합니다.`,
                        source: 'PM 실무 가이드북',
                        date: new Date('2024-12-20'),
                        author: '관리자'
                    },
                    {
                        id: 2,
                        title: 'PO와 PM의 차이점 완벽 정리',
                        content: `많은 분들이 헷갈려하시는 PO(Product Owner)와 PM(Product Manager)의 차이점을 명확히 정리했습니다.

<strong>Product Owner (PO):</strong>
• 애자일/스크럼 팀의 제품 책임자
• 백로그 관리 및 우선순위 결정
• 개발팀과 밀접한 협업

<strong>Product Manager (PM):</strong>
• 제품 전략 및 비전 수립
• 시장 분석 및 경쟁사 분석
• 비즈니스 성과 책임

실제로는 회사마다 역할 정의가 다를 수 있습니다.`,
                        source: 'https://example.com/po-vs-pm',
                        date: new Date('2024-12-19'),
                        author: 'PM김철수'
                    }
                ],
                'career-prep': [
                    {
                        id: 3,
                        title: 'PM 포트폴리오 작성 완전 가이드',
                        content: `PM 취업을 위한 포트폴리오 작성법을 단계별로 안내드립니다.

<strong>1. 프로젝트 선정</strong>
실제 업무 경험이나 개인 프로젝트 중 성과가 명확한 것을 선택하세요.

<strong>2. 구성 요소</strong>
• 문제 정의 및 배경
• 해결 과정 및 방법론
• 성과 및 학습점

<strong>3. 시각화</strong>
• 플로우차트, 와이어프레임 활용
• 데이터는 그래프로 표현
• Before/After 비교 필수`,
                        source: 'PM 취업 준비 커뮤니티',
                        date: new Date('2024-12-18'),
                        author: '취업멘토'
                    }
                ],
                'news': [
                    {
                        id: 4,
                        title: '2024년 PM 채용 시장 동향 분석',
                        content: `올해 PM 채용 시장의 주요 트렌드를 분석해보았습니다.

<strong>주요 트렌드:</strong>
• AI/ML 이해도 요구 증가
• 데이터 분석 역량 중시
• 사용자 경험(UX) 전문성 강화
• 애자일/스크럼 경험 필수

<strong>주요 기업별 채용 현황:</strong>
• 테크 스타트업: 전년 대비 30% 증가
• 대기업: 신규 디지털 전환 프로젝트 확대
• 금융권: 핀테크 부문 PM 수요 증가`,
                        source: 'IT 채용 동향 리포트 2024',
                        date: new Date('2024-12-17'),
                        author: '뉴스팀'
                    }
                ]
            };
            this.saveLocalPosts();
        }
    }

    // 샘플 게시글 추가
    async addSamplePosts() {
        const samplePosts = [
            {
                boardId: 'job-info',
                title: 'PM의 핵심 역할과 책임',
                content: `프로덕트 매니저(PM)는 제품의 전략 수립부터 출시까지 전 과정을 관리하는 핵심 역할을 담당합니다.

<strong>주요 업무:</strong>
• 제품 로드맵 수립 및 관리
• 시장 조사 및 사용자 요구사항 분석
• 개발팀과의 협업 및 일정 관리
• 성과 분석 및 개선 방안 도출

실무에서는 다양한 이해관계자들과의 소통이 매우 중요합니다.`,
                source: 'PM 실무 가이드북',
                author: '관리자'
            },
            {
                boardId: 'job-info',
                title: 'PO와 PM의 차이점 완벽 정리',
                content: `많은 분들이 헷갈려하시는 PO(Product Owner)와 PM(Product Manager)의 차이점을 명확히 정리했습니다.

<strong>Product Owner (PO):</strong>
• 애자일/스크럼 팀의 제품 책임자
• 백로그 관리 및 우선순위 결정
• 개발팀과 밀접한 협업

<strong>Product Manager (PM):</strong>
• 제품 전략 및 비전 수립
• 시장 분석 및 경쟁사 분석
• 비즈니스 성과 책임

실제로는 회사마다 역할 정의가 다를 수 있습니다.`,
                source: 'https://example.com/po-vs-pm',
                author: 'PM김철수'
            },
            {
                boardId: 'career-prep',
                title: 'PM 포트폴리오 작성 완전 가이드',
                content: `PM 취업을 위한 포트폴리오 작성법을 단계별로 안내드립니다.

<strong>1. 프로젝트 선정</strong>
실제 업무 경험이나 개인 프로젝트 중 성과가 명확한 것을 선택하세요.

<strong>2. 구성 요소</strong>
• 문제 정의 및 배경
• 해결 과정 및 방법론
• 성과 및 학습점

<strong>3. 시각화</strong>
• 플로우차트, 와이어프레임 활용
• 데이터는 그래프로 표현
• Before/After 비교 필수`,
                source: 'PM 취업 준비 커뮤니티',
                author: '취업멘토'
            },
            {
                boardId: 'news',
                title: '2024년 PM 채용 시장 동향 분석',
                content: `올해 PM 채용 시장의 주요 트렌드를 분석해보았습니다.

<strong>주요 트렌드:</strong>
• AI/ML 이해도 요구 증가
• 데이터 분석 역량 중시
• 사용자 경험(UX) 전문성 강화
• 애자일/스크럼 경험 필수

<strong>주요 기업별 채용 현황:</strong>
• 테크 스타트업: 전년 대비 30% 증가
• 대기업: 신규 디지털 전환 프로젝트 확대
• 금융권: 핀테크 부문 PM 수요 증가`,
                source: 'IT 채용 동향 리포트 2024',
                author: '뉴스팀'
            }
        ];

        for (const post of samplePosts) {
            await this.addPost(post.boardId, post);
        }
        console.log('샘플 데이터 추가 완료');
    }

    // 게시글 추가 (하이브리드)
    async addPost(boardId, postData) {
        if (this.useFirebase) {
            try {
                const newPost = {
                    boardId: boardId,
                    title: postData.title,
                    content: postData.content,
                    source: postData.source || '',
                    author: postData.author || '익명',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                const docRef = await postsCollection.add(newPost);
                console.log('Firebase 게시글 추가 완료:', docRef.id);
                return { id: docRef.id, ...newPost };
            } catch (error) {
                console.error('Firebase 게시글 추가 오류:', error);
                // Firebase 실패 시 로컬로 폴백
                this.useFirebase = false;
                return this.addLocalPost(boardId, postData);
            }
        } else {
            return this.addLocalPost(boardId, postData);
        }
    }

    // 로컬 게시글 추가
    addLocalPost(boardId, postData) {
        if (!this.posts[boardId]) {
            this.posts[boardId] = [];
        }
        
        const newPost = {
            id: Date.now(),
            title: postData.title,
            content: postData.content,
            source: postData.source || '',
            date: new Date(),
            author: postData.author || '익명'
        };
        
        this.posts[boardId].unshift(newPost);
        this.saveLocalPosts();
        console.log('로컬 게시글 추가 완료:', newPost.id);
        return newPost;
    }

    // 특정 게시판 게시글 가져오기 (하이브리드)
    async getPosts(boardId) {
        if (this.useFirebase) {
            try {
                const snapshot = await postsCollection
                    .where('boardId', '==', boardId)
                    .orderBy('createdAt', 'desc')
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
                
                return posts;
            } catch (error) {
                console.error('Firebase 게시글 조회 오류:', error);
                this.useFirebase = false;
                return this.getLocalPosts(boardId);
            }
        } else {
            return this.getLocalPosts(boardId);
        }
    }

    // 로컬 게시글 가져오기
    getLocalPosts(boardId) {
        if (!this.posts[boardId]) {
            return [];
        }
        return this.posts[boardId].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 모든 게시판의 최근 게시글 가져오기 (하이브리드)
    async getRecentPosts(limit = 6) {
        if (this.useFirebase) {
            try {
                const snapshot = await postsCollection
                    .orderBy('createdAt', 'desc')
                    .limit(limit)
                    .get();
                
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
                
                return posts;
            } catch (error) {
                console.error('Firebase 최근 게시글 조회 오류:', error);
                this.useFirebase = false;
                return this.getLocalRecentPosts(limit);
            }
        } else {
            return this.getLocalRecentPosts(limit);
        }
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


}

// 전역 게시판 매니저 인스턴스
const boardManager = new HybridBoardManager();

// 페이지 전환 함수들
async function showHomePage() {
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'none';
    document.getElementById('consulting-page').style.display = 'none';
    
    // boardManager 초기화 완료 대기
    if (boardManager && typeof boardManager.initializeManager === 'function') {
        await boardManager.initializeManager();
    }
    
    updateRecentPosts();
}

function showBoard(boardId) {
    boardManager.currentBoard = boardId;
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'block';
    document.getElementById('books-page').style.display = 'none';
    document.getElementById('consulting-page').style.display = 'none';
    
    // 게시판 제목 설정
    document.getElementById('board-title').textContent = boardManager.getBoardName(boardId);
    
    // 취업준비 게시판인 경우 컨설팅받기 버튼 추가
    const boardHeader = document.querySelector('.board-header');
    const existingConsultingBtn = document.getElementById('consulting-btn');
    
    if (boardId === 'career-prep' && !existingConsultingBtn) {
        const consultingBtn = document.createElement('button');
        consultingBtn.id = 'consulting-btn';
        consultingBtn.className = 'consulting-btn';
        consultingBtn.innerHTML = '<i class="fas fa-user-tie"></i> 컨설팅받기';
        consultingBtn.onclick = () => showConsultingPage();
        
        const writeBtn = document.querySelector('.write-btn');
        boardHeader.insertBefore(consultingBtn, writeBtn);
    } else if (boardId !== 'career-prep' && existingConsultingBtn) {
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
    loadConsultingReviews();
}

// 게시글 목록 업데이트 (하이브리드)
async function updatePostsList(boardId) {
    const postsList = document.getElementById('posts-list');
    postsList.innerHTML = '<div class="loading">게시글을 불러오는 중...</div>';
    
    try {
        const posts = await boardManager.getPosts(boardId);
        postsList.innerHTML = '';
        
        if (posts.length === 0) {
            postsList.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-inbox"></i>
                    <h3>아직 게시글이 없습니다</h3>
                    <p>첫 번째 게시글을 작성해보세요!</p>
                </div>
            `;
            return;
        }
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-item';
            postElement.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${post.title}</h3>
                    <div class="post-meta">
                        <span class="post-author"><i class="fas fa-user"></i> ${post.author}</span>
                        <span class="post-date"><i class="fas fa-calendar"></i> ${formatDate(post.date)}</span>
                    </div>
                </div>
                <div class="post-content">
                    ${post.content.replace(/<[^>]*>/g, '').substring(0, 200)}${post.content.length > 200 ? '...' : ''}
                </div>
                ${post.source ? `<div class="post-source"><i class="fas fa-link"></i> ${post.source}</div>` : ''}
                <div class="post-actions">
                    <button class="read-more-btn" onclick="showFullPost('${post.id}', '${boardId}')">
                        <i class="fas fa-eye"></i> 자세히 보기
                    </button>
                </div>
            `;
            postsList.appendChild(postElement);
        });
    } catch (error) {
        console.error('게시글 목록 업데이트 오류:', error);
        postsList.innerHTML = '<div class="error">게시글을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

// 최근 게시글 업데이트 (하이브리드)
async function updateRecentPosts() {
    const recentPostsContainer = document.getElementById('recent-posts');
    recentPostsContainer.innerHTML = '<div class="loading">최근 게시글을 불러오는 중...</div>';
    
    try {
        const posts = await boardManager.getRecentPosts();
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
            
            const submitBtn = document.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '게시 중...';
            submitBtn.disabled = true;
            
            try {
                await boardManager.addPost(boardManager.currentBoard, {
                    title: title,
                    content: content,
                    source: source,
                    author: '익명' // 추후 로그인 기능 추가 시 실제 사용자명으로 변경
                });
                
                closeWriteModal();
                alert('게시글이 성공적으로 등록되었습니다!');
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
    
    if (boardManager.useFirebase) {
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
        
        if (boardManager.useFirebase) {
            const doc = await postsCollection.doc(postId).get();
            if (!doc.exists) {
                alert('게시글을 찾을 수 없습니다.');
                return;
            }
            post = { id: doc.id, ...doc.data() };
        } else {
            // 로컬에서 게시글 찾기
            const posts = boardManager.getLocalPosts(boardId);
            post = posts.find(p => p.id == postId);
            if (!post) {
                alert('게시글을 찾을 수 없습니다.');
                return;
            }
        }
        
        const date = post.createdAt ? post.createdAt.toDate() : (post.date || new Date());
        
        // 모달 생성 및 표시
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content post-detail-modal">
                <div class="modal-header">
                    <h2>${post.title}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="post-detail-meta">
                    <div class="post-detail-info">
                        <span><i class="fas fa-user"></i> ${post.author}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(date)}</span>
                        <span><i class="fas fa-folder"></i> ${boardManager.getBoardName(boardId)}</span>
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

// 컨설팅 후기 로드 (추후 구현)
function loadConsultingReviews() {
    // 추후 Firebase에서 컨설팅 후기 이미지들을 로드하는 기능 구현
    console.log('컨설팅 후기 로드');
} 