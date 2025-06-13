// 게시판 데이터 저장소 (localStorage 사용)
class BoardManager {
    constructor() {
        this.currentBoard = '';
        this.posts = this.loadPosts();
        this.boardNames = {
            'job-info': '직무',
            'career-prep': '취업준비',
            'news': '뉴스',
            'policy-library': '정책도서관',
            'faq': '자주나오는 질문',
            'study': '스터디'
        };
        this.initSampleData();
    }

    // 로컬 스토리지에서 게시글 불러오기
    loadPosts() {
        const saved = localStorage.getItem('pm-community-posts');
        return saved ? JSON.parse(saved) : {};
    }

    // 로컬 스토리지에 게시글 저장
    savePosts() {
        localStorage.setItem('pm-community-posts', JSON.stringify(this.posts));
    }

    // 샘플 데이터 초기화
    initSampleData() {
        if (Object.keys(this.posts).length === 0) {
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
            this.savePosts();
        }
    }

    // 게시글 추가
    addPost(boardId, postData) {
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
        
        this.posts[boardId].unshift(newPost); // 최신글이 위로
        this.savePosts();
        return newPost;
    }

    // 특정 게시판 게시글 가져오기
    getPosts(boardId) {
        if (!this.posts[boardId]) {
            return [];
        }
        // 최신순 정렬
        return this.posts[boardId].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 모든 게시판의 최근 게시글 가져오기
    getRecentPosts(limit = 6) {
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
        
        // 최신순 정렬 후 제한
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
const boardManager = new BoardManager();

// 페이지 전환 함수들
function showHomePage() {
    document.getElementById('home-page').style.display = 'block';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'none';
    document.getElementById('consulting-page').style.display = 'none';
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
    
    if (boardId === 'career' && !existingConsultingBtn) {
        const consultingBtn = document.createElement('button');
        consultingBtn.id = 'consulting-btn';
        consultingBtn.className = 'consulting-header-btn';
        consultingBtn.innerHTML = '<i class="fas fa-user-tie"></i> 컨설팅받기';
        consultingBtn.onclick = showConsultingPage;
        
        // 글쓰기 버튼 앞에 삽입
        const writeBtn = document.querySelector('.write-btn');
        boardHeader.insertBefore(consultingBtn, writeBtn);
    } else if (boardId !== 'career' && existingConsultingBtn) {
        existingConsultingBtn.remove();
    }
    
    // 게시글 목록 업데이트
    updatePostsList(boardId);
}

function showCategory(category) {
    if (category === 'books') {
        showBooksPage();
    } else {
        showBoard(category);
    }
}

function showBooksPage() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'block';
    document.getElementById('consulting-page').style.display = 'none';
    loadBooks();
}

// 게시글 목록 업데이트
function updatePostsList(boardId) {
    const posts = boardManager.getPosts(boardId);
    const postsListElement = document.getElementById('posts-list');
    
    if (posts.length === 0) {
        postsListElement.innerHTML = `
            <div class="no-posts">
                <i class="fas fa-edit"></i>
                <p>아직 게시글이 없습니다.</p>
                <p>첫 번째 글을 작성해보세요!</p>
            </div>
        `;
        return;
    }
    
    postsListElement.innerHTML = posts.map(post => `
        <article class="post-item">
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <span class="post-author">
                        <i class="fas fa-user"></i> ${post.author}
                    </span>
                    <span class="post-date">
                        <i class="fas fa-calendar"></i> ${formatDate(post.date)}
                    </span>
                </div>
            </div>
            <div class="post-content">
                ${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}
            </div>
            ${post.source ? `
                <div class="post-source">
                    <i class="fas fa-link"></i>
                    <span>출처: ${post.source}</span>
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="btn-read-more" onclick="showFullPost(${post.id}, '${boardId}')">
                    자세히 보기
                </button>
            </div>
        </article>
    `).join('');
}

// 최근 게시글 업데이트
function updateRecentPosts() {
    const recentPosts = boardManager.getRecentPosts();
    const recentPostsElement = document.getElementById('recent-posts');
    
    if (recentPosts.length === 0) {
        recentPostsElement.innerHTML = '<p class="no-recent-posts">최근 게시글이 없습니다.</p>';
        return;
    }
    
    recentPostsElement.innerHTML = `
        <div class="recent-posts-grid">
            ${recentPosts.map(post => `
                <div class="recent-post-card" onclick="showBoard('${post.boardId}')">
                    <div class="recent-post-category">${post.boardName}</div>
                    <h4 class="recent-post-title">${post.title}</h4>
                    <p class="recent-post-preview">${post.content.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
                    <div class="recent-post-date">${formatDate(post.date)}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// 글쓰기 모달 관련 함수들
function showWriteModal() {
    document.getElementById('write-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 폼 초기화
    document.getElementById('write-form').reset();
    document.getElementById('post-content').innerHTML = '';
}

function closeWriteModal() {
    document.getElementById('write-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 글 작성 폼 제출
document.addEventListener('DOMContentLoaded', function() {
    const writeForm = document.getElementById('write-form');
    if (writeForm) {
        writeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').innerHTML.trim();
            const source = document.getElementById('post-source').value.trim();
            
            if (!title || !content) {
                if (typeof NotificationSystem !== 'undefined') {
                    NotificationSystem.show('제목과 내용을 모두 입력해주세요.', 'error');
                } else {
                    alert('제목과 내용을 모두 입력해주세요.');
                }
                return;
            }
            
            const postData = {
                title,
                content,
                source,
                author: '익명' // 실제 서비스에서는 로그인 사용자 정보 사용
            };
            
            boardManager.addPost(boardManager.currentBoard, postData);
            updatePostsList(boardManager.currentBoard);
            closeWriteModal();
            
            if (typeof NotificationSystem !== 'undefined') {
                NotificationSystem.show('게시글이 성공적으로 등록되었습니다!', 'success');
            } else {
                alert('게시글이 성공적으로 등록되었습니다!');
            }
        });
    }
});

// 텍스트 에디터 기능들
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('post-content').focus();
}

function insertImage() {
    document.getElementById('image-upload').click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
        if (typeof NotificationSystem !== 'undefined') {
            NotificationSystem.show('이미지 크기는 5MB 이하로 업로드해주세요.', 'warning');
        } else {
            alert('이미지 크기는 5MB 이하로 업로드해주세요.');
        }
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        
        const editor = document.getElementById('post-content');
        editor.appendChild(img);
        editor.focus();
    };
    reader.readAsDataURL(file);
}

// 전체 게시글 보기 (모달로 구현)
function showFullPost(postId, boardId) {
    const posts = boardManager.getPosts(boardId);
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    // 전체 게시글 보기 모달 생성
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'full-post-modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>${post.title}</h2>
                <span class="close" onclick="document.getElementById('full-post-modal').remove()">&times;</span>
            </div>
            <div class="post-meta" style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
                <span style="margin-right: 1rem;"><i class="fas fa-user"></i> ${post.author}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(post.date)}</span>
            </div>
            <div class="post-full-content" style="line-height: 1.8; margin-bottom: 1.5rem;">
                ${post.content}
            </div>
            ${post.source ? `
                <div class="post-source" style="margin-top: 1.5rem;">
                    <i class="fas fa-link"></i>
                    <span>출처: ${post.source}</span>
                </div>
            ` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    });
}

// 카카오톡 오픈채팅 모달
function openKakaoChat() {
    document.getElementById('kakaoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeKakaoModal() {
    document.getElementById('kakaoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// 날짜 포맷팅 함수
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    showHomePage();
    
    // 모달 배경 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                if (modal.id === 'write-modal') {
                    closeWriteModal();
                } else if (modal.id === 'kakaoModal') {
                    closeKakaoModal();
                }
            }
        });
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeWriteModal();
            closeKakaoModal();
            
            // 전체 게시글 모달 닫기
            const fullPostModal = document.getElementById('full-post-modal');
            if (fullPostModal) {
                fullPostModal.remove();
                document.body.style.overflow = 'auto';
            }
        }
    });
});

// 에디터 placeholder 효과
document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('post-content');
    if (editor) {
        editor.addEventListener('focus', function() {
            if (this.innerHTML === '') {
                this.innerHTML = '';
            }
        });
        
        editor.addEventListener('blur', function() {
            if (this.innerHTML === '') {
                this.innerHTML = '';
            }
        });
    }
}); 