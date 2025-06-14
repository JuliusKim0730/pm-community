// 부드러운 스크롤 및 기본 인터랙션 기능
document.addEventListener('DOMContentLoaded', function() {
    // 스크롤 시 헤더 스타일 변경
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(11, 13, 14, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = '#0B0D0E';
            header.style.backdropFilter = 'none';
        }
    });
    
    // 페이지 로드 시 환영 애니메이션
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    
    if (heroTitle && heroSubtitle) {
        setTimeout(() => {
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 300);
        
        setTimeout(() => {
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.transform = 'translateY(0)';
        }, 600);
    }
    
    // 카드 애니메이션 효과
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 애니메이션 적용할 요소들 관찰
    const animatedElements = document.querySelectorAll('.category-card, .recent-post-card, .post-item');
    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(element);
    });

    initDropdownMenus();
});

// 모바일 메뉴 반응형 처리
function handleResponsiveMenu() {
    const navList = document.querySelector('.nav-list');
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 768) {
        navList.style.flexWrap = 'wrap';
        navList.style.justifyContent = 'center';
    } else {
        navList.style.flexWrap = 'nowrap';
        navList.style.justifyContent = 'flex-end';
    }
}

// 리사이즈 이벤트 처리
window.addEventListener('resize', handleResponsiveMenu);
window.addEventListener('load', handleResponsiveMenu);

// 이미지 로딩 에러 처리
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            // 이미지 로딩 실패 시 기본 배경색으로 대체
            this.style.backgroundColor = '#f8f9fa';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.alt = '이미지를 불러올 수 없습니다';
        });
    });
});

// 로컬 스토리지 관리 유틸리티
const StorageUtils = {
    // 데이터 저장
    save: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            return false;
        }
    },
    
    // 데이터 불러오기
    load: function(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('데이터 불러오기 실패:', error);
            return null;
        }
    },
    
    // 데이터 삭제
    remove: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('데이터 삭제 실패:', error);
            return false;
        }
    }
};

// 폼 검증 유틸리티
const FormValidator = {
    // 이메일 검증
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // URL 검증
    isValidURL: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    // 텍스트 길이 검증
    isValidLength: function(text, minLength = 1, maxLength = 1000) {
        const length = text.trim().length;
        return length >= minLength && length <= maxLength;
    },
    
    // HTML 태그 제거
    stripHTML: function(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },
    
    // XSS 방지를 위한 HTML 인코딩
    escapeHTML: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 알림 메시지 시스템
const NotificationSystem = {
    show: function(message, type = 'info', duration = 3000) {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // 스타일 적용
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 자동 제거
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    },
    
    getIcon: function(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    getColor: function(type) {
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#007bff'
        };
        return colors[type] || '#007bff';
    }
};

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: auto;
        padding: 0.2rem;
        opacity: 0.8;
        transition: opacity 0.3s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// 키보드 단축키 지원
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K: 검색 (향후 구현)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // 검색 기능 구현 예정
        NotificationSystem.show('검색 기능은 곧 업데이트됩니다!', 'info');
    }
    
    // Ctrl/Cmd + N: 새 글 작성
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (boardManager && boardManager.currentBoard) {
            showWriteModal();
        }
    }
});

// 성능 최적화: 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 스크롤 이벤트 최적화
const optimizedScrollHandler = debounce(function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(11, 13, 14, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = '#0B0D0E';
        header.style.backdropFilter = 'none';
    }
}, 10);

window.addEventListener('scroll', optimizedScrollHandler);

// 페이지 가시성 API 활용
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 페이지가 숨겨졌을 때
        console.log('페이지가 백그라운드로 이동됨');
    } else {
        // 페이지가 다시 보일 때
        console.log('페이지가 다시 활성화됨');
        // 최신 데이터 새로고침 등 수행 가능
    }
});

// 브라우저 지원 체크
const BrowserSupport = {
    check: function() {
        const features = {
            localStorage: typeof(Storage) !== "undefined",
            flexbox: CSS.supports('display', 'flex'),
            grid: CSS.supports('display', 'grid'),
            intersectionObserver: 'IntersectionObserver' in window
        };
        
        const unsupported = Object.keys(features).filter(key => !features[key]);
        
        if (unsupported.length > 0) {
            console.warn('지원되지 않는 기능:', unsupported);
            NotificationSystem.show(
                '일부 기능이 제한될 수 있습니다. 최신 브라우저를 사용해주세요.',
                'warning',
                5000
            );
        }
        
        return features;
    }
};

// 페이지 로드 완료 시 브라우저 지원 체크
window.addEventListener('load', function() {
    BrowserSupport.check();
});

// 추천도서 데이터
const booksData = [
    {
        id: 1,
        title: "인스파이어드",
        author: "마티 케이건 저/황진주 역",
        publisher: "제이펍",
        tags: ["PM/PO/전략/경영", "필독도서", "주니어", "시니어"],
        category: "inspire",
        description: "실리콘밸리 최고의 제품 관리자가 알려주는 제품 개발의 모든 것. PM이라면 반드시 읽어야 할 필독서입니다.",
        reason: "PM의 핵심 역할과 제품 개발 프로세스를 체계적으로 학습할 수 있는 최고의 입문서입니다.",
        content: "제품 관리의 모든 측면을 다루며, 실무에서 바로 적용할 수 있는 구체적인 방법론을 제시합니다.",
        writer: "관리자",
        date: new Date('2024-12-20'),
        image: null
    },
    {
        id: 2,
        title: "101가지 비즈니스 모델 이야기",
        author: "남태희, 김주희, 정지혜, 정혜진, 이재원 저",
        publisher: "한스미디어",
        tags: ["PM/PO/전략/경영", "경영진"],
        category: "business",
        description: "다양한 비즈니스 모델을 통해 사업 전략을 이해하고 새로운 아이디어를 얻을 수 있는 실무서입니다.",
        reason: "다양한 산업의 비즈니스 모델을 분석하여 전략적 사고력을 기를 수 있습니다.",
        content: "실제 기업 사례를 통해 비즈니스 모델의 핵심 요소와 성공 요인을 학습할 수 있습니다.",
        writer: "관리자",
        date: new Date('2024-12-19'),
        image: null
    },
    {
        id: 3,
        title: "구글의 아침은 자유가 시작된다",
        author: "라즐로 복",
        publisher: "알에이치코리아",
        tags: ["PM/PO/전략/경영", "시니어", "경영진"],
        category: "leadership",
        description: "구글의 인사 담당 수석 부사장이 공개하는 구글의 인재 경영 철학과 조직 문화에 대한 통찰입니다.",
        reason: "혁신적인 조직 문화와 인재 관리 방법을 통해 팀 리더십을 향상시킬 수 있습니다.",
        content: "구글의 채용, 성과 관리, 조직 운영 방식을 통해 현대적인 경영 철학을 이해할 수 있습니다.",
        writer: "관리자",
        date: new Date('2024-12-18'),
        image: null
    },
    {
        id: 4,
        title: "린 스타트업",
        author: "에릭 리스 저/이창수, 송우일 공역",
        publisher: "인사이트(insight)",
        tags: ["PM/PO/전략/경영", "필독도서", "경영진"],
        category: "product",
        description: "스타트업과 신제품 개발의 새로운 패러다임을 제시하는 린 스타트업 방법론의 바이블입니다.",
        reason: "불확실성이 높은 환경에서 제품을 성공적으로 개발하는 방법론을 제시합니다.",
        content: "Build-Measure-Learn 사이클을 통한 지속적인 학습과 개선 방법을 학습할 수 있습니다.",
        writer: "관리자",
        date: new Date('2024-12-17'),
        image: null
    }
];

// 로컬 스토리지에서 사용자 추가 도서 불러오기
function loadUserBooks() {
    const saved = localStorage.getItem('pm-community-books');
    return saved ? JSON.parse(saved) : [];
}

// 로컬 스토리지에 사용자 추가 도서 저장
function saveUserBooks(books) {
    localStorage.setItem('pm-community-books', JSON.stringify(books));
}

// 전체 도서 목록 가져오기 (기본 + 사용자 추가)
function getAllBooks() {
    const userBooks = loadUserBooks();
    return [...booksData, ...userBooks];
}

// 책 목록 로드 함수
function loadBooks() {
    const booksGrid = document.getElementById('booksGrid');
    const filter = document.getElementById('bookFilter').value;
    
    let allBooks = getAllBooks();
    let filteredBooks = allBooks;
    
    if (filter !== 'all') {
        filteredBooks = allBooks.filter(book => book.tags.includes(filter));
    }
    
    booksGrid.innerHTML = '';
    
    filteredBooks.forEach(book => {
        const bookCard = createBookCard(book);
        booksGrid.appendChild(bookCard);
    });
    
    if (filteredBooks.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-books" style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #888;">
                <i class="fas fa-book" style="font-size: 4rem; color: #555; margin-bottom: 1rem;"></i>
                <h3>해당 카테고리의 도서가 없습니다</h3>
                <p>다른 카테고리를 선택해보세요.</p>
            </div>
        `;
    }
}

// 책 카드 생성 함수
function createBookCard(book) {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.onclick = () => showBookDetail(book);
    
    const coverIcon = getCoverIcon(book.category);
    
    card.innerHTML = `
        <div class="book-cover ${book.category}">
            ${book.image ? `<img src="${book.image}" alt="${book.title}">` : `<i class="${coverIcon}"></i>`}
        </div>
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-publisher">${book.publisher}</div>
        <div class="book-tags">
            ${book.tags.map(tag => `<span class="book-tag ${getTagClass(tag)}">${tag}</span>`).join('')}
        </div>
        <div class="book-description">${book.description}</div>
    `;
    
    return card;
}

// 책 커버 아이콘 반환 함수
function getCoverIcon(category) {
    const icons = {
        'inspire': 'fas fa-lightbulb',
        'business': 'fas fa-chart-line',
        'strategy': 'fas fa-chess',
        'leadership': 'fas fa-users',
        'product': 'fas fa-rocket',
        'data': 'fas fa-database'
    };
    return icons[category] || 'fas fa-book';
}

// 태그 클래스 반환 함수
function getTagClass(tag) {
    if (tag.includes('시니어')) return 'senior';
    if (tag.includes('주니어')) return 'junior';
    if (tag.includes('필독도서')) return 'essential';
    return '';
}

// 책 필터링 함수
function filterBooks() {
    loadBooks();
}

// 책 상세보기 모달 표시
function showBookDetail(book) {
    const modal = document.getElementById('bookDetailModal');
    
    // 모달 내용 업데이트
    document.getElementById('detailBookTitle').textContent = book.title;
    document.getElementById('detailBookAuthor').textContent = book.author || '-';
    document.getElementById('detailBookPublisher').textContent = book.publisher || '-';
    document.getElementById('detailBookDate').textContent = formatDate(book.date);
    document.getElementById('detailBookWriter').textContent = book.writer || '-';
    document.getElementById('detailBookReason').textContent = book.reason || book.description;
    document.getElementById('detailBookContent').innerHTML = book.content || '상세 내용이 없습니다.';
    
    // 책 커버 업데이트
    const coverElement = document.getElementById('detailBookCover');
    coverElement.className = `book-cover-large ${book.category}`;
    
    if (book.image) {
        coverElement.innerHTML = `<img src="${book.image}" alt="${book.title}">`;
    } else {
        const coverIcon = getCoverIcon(book.category);
        coverElement.innerHTML = `<i class="${coverIcon}"></i>`;
    }
    
    // 태그 업데이트
    const tagsElement = document.getElementById('detailBookTags');
    tagsElement.innerHTML = book.tags.map(tag => 
        `<span class="book-tag ${getTagClass(tag)}">${tag}</span>`
    ).join('');
    
    modal.style.display = 'block';
}

// 책 상세보기 모달 닫기
function closeBookDetailModal() {
    document.getElementById('bookDetailModal').style.display = 'none';
}

// 책 추가 모달 표시
function showAddBookModal() {
    document.getElementById('addBookModal').style.display = 'block';
}

// 책 추가 모달 닫기
function closeAddBookModal() {
    document.getElementById('addBookModal').style.display = 'none';
    resetAddBookForm();
}

// 책 추가 폼 리셋
function resetAddBookForm() {
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookImage').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookPublisher').value = '';
    document.getElementById('bookCategory').value = 'inspire';
    document.getElementById('bookTags').value = '';
    document.getElementById('bookReason').value = '';
    document.getElementById('bookContentEditor').innerHTML = '';
    document.getElementById('bookAuthorName').value = '';
    
    // 이미지 미리보기 제거
    const preview = document.getElementById('imagePreview');
    preview.style.display = 'none';
}

// 이미지 미리보기
function previewBookImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            const img = document.getElementById('previewImg');
            img.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// 이미지 미리보기 제거
function removeImagePreview() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('bookImage').value = '';
}

// 책 내용 텍스트 포맷팅
function formatBookText(command) {
    document.execCommand(command, false, null);
    document.getElementById('bookContentEditor').focus();
}

// 새 책 추가
function addNewBook(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const imageFile = formData.get('bookImage');
    
    // 이미지 처리
    if (imageFile && imageFile.size > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            saveNewBook(formData, e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveNewBook(formData, null);
    }
}

// 새 책 저장
function saveNewBook(formData, imageData) {
    const tags = formData.get('bookTags').split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const newBook = {
        id: Date.now(),
        title: formData.get('bookTitle'),
        author: formData.get('bookAuthor') || '저자 미상',
        publisher: formData.get('bookPublisher') || '출판사 미상',
        tags: tags,
        category: formData.get('bookCategory'),
        description: formData.get('bookReason'),
        reason: formData.get('bookReason'),
        content: document.getElementById('bookContentEditor').innerHTML || '상세 내용이 없습니다.',
        writer: formData.get('bookAuthorName'),
        date: new Date(),
        image: imageData
    };
    
    // 사용자 도서 목록에 추가
    const userBooks = loadUserBooks();
    userBooks.unshift(newBook); // 최신 책이 위로
    saveUserBooks(userBooks);
    
    // 성공 알림
    NotificationSystem.show('새 책이 성공적으로 추가되었습니다!', 'success');
    
    // 모달 닫기 및 목록 새로고침
    closeAddBookModal();
    loadBooks();
}

// 날짜 포맷팅
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 컨설팅 페이지 표시
function showConsultingPage() {
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('board-page').style.display = 'none';
    document.getElementById('books-page').style.display = 'none';
    document.getElementById('consulting-page').style.display = 'block';
    loadReviewImages();
}

// 후기 이미지 로드 (샘플 데이터)
function loadReviewImages() {
    const reviewsGallery = document.getElementById('reviewsGallery');
    const reviewsPlaceholder = document.getElementById('reviewsPlaceholder');
    
    // 샘플 후기 데이터 (실제로는 지정된 폴더에서 이미지를 불러올 예정)
    const sampleReviews = [
        {
            id: 1,
            caption: "이력서 컨설팅 후기 - 대기업 PM 합격!",
            description: "전문적인 피드백 덕분에 이력서가 완전히 달라졌어요."
        },
        {
            id: 2,
            caption: "포트폴리오 리뷰 후기 - 스타트업 PO 전환 성공",
            description: "실무진 관점에서의 조언이 정말 도움이 되었습니다."
        },
        {
            id: 3,
            caption: "커리어 로드맵 컨설팅 - 체계적인 성장 계획 수립",
            description: "앞으로의 커리어 방향을 명확하게 잡을 수 있었어요."
        }
    ];
    
    // 실제 이미지가 있는지 확인 (현재는 샘플로 처리)
    const hasRealImages = false; // 실제 이미지 폴더 확인 후 true로 변경
    
    if (hasRealImages) {
        // 실제 이미지가 있을 때의 처리
        reviewsPlaceholder.style.display = 'none';
        reviewsGallery.style.display = 'grid';
        // 실제 이미지 로드 로직 추가
    } else {
        // 샘플 데이터로 처리
        reviewsGallery.innerHTML = '';
        
        sampleReviews.forEach(review => {
            const reviewItem = createSampleReviewItem(review);
            reviewsGallery.appendChild(reviewItem);
        });
        
        if (sampleReviews.length > 0) {
            reviewsPlaceholder.style.display = 'none';
            reviewsGallery.style.display = 'grid';
        } else {
            reviewsPlaceholder.style.display = 'block';
            reviewsGallery.style.display = 'none';
        }
    }
}

// 샘플 후기 아이템 생성
function createSampleReviewItem(review) {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.onclick = () => showImageModal(generateSampleImage(review.id), review.caption);
    
    item.innerHTML = `
        <div style="
            width: 100%;
            height: 250px;
            background: linear-gradient(135deg, #00d4ff, #0099cc);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            text-align: center;
            padding: 1rem;
        ">
            <i class="fas fa-comment-dots" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.8;"></i>
            <div style="font-size: 1.1rem; line-height: 1.4;">
                ${review.caption}
            </div>
        </div>
        <div class="review-caption">
            ${review.description}
        </div>
    `;
    
    return item;
}

// 샘플 이미지 생성 (실제로는 실제 이미지 경로 사용)
function generateSampleImage(id) {
    // 실제 구현에서는 실제 이미지 경로를 반환
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%2300d4ff"/><text x="200" y="300" text-anchor="middle" fill="white" font-size="24" font-family="Arial">컨설팅 후기 ${id}</text></svg>`;
}

// 이미지 모달 표시
function showImageModal(imageSrc, caption) {
    // 기존 모달 제거
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 생성
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="close" onclick="closeImageModal()">&times;</span>
            <img src="${imageSrc}" alt="${caption}">
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeImageModal();
        }
    });
}

// 이미지 모달 닫기
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// 실제 이미지 폴더에서 이미지 로드 (향후 구현용)
async function loadRealReviewImages(folderPath) {
    try {
        // 실제 구현에서는 서버 API나 파일 시스템 접근을 통해 이미지 목록을 가져옴
        // 예: const response = await fetch('/api/review-images');
        // const images = await response.json();
        
        const reviewsGallery = document.getElementById('reviewsGallery');
        const reviewsPlaceholder = document.getElementById('reviewsPlaceholder');
        
        // 이미지가 있는 경우
        // images.forEach((image, index) => {
        //     const reviewItem = createRealReviewItem(image, index);
        //     reviewsGallery.appendChild(reviewItem);
        // });
        
        console.log('실제 이미지 로드 기능은 서버 환경에서 구현됩니다.');
    } catch (error) {
        console.error('이미지 로드 실패:', error);
    }
}

// 실제 후기 아이템 생성 (향후 구현용)
function createRealReviewItem(imagePath, index) {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.onclick = () => showImageModal(imagePath, `컨설팅 후기 ${index + 1}`);
    
    item.innerHTML = `
        <img src="${imagePath}" alt="컨설팅 후기 ${index + 1}" loading="lazy">
        <div class="review-caption">
            컨설팅 후기 ${index + 1}
        </div>
    `;
    
    return item;
}

// 드롭다운 메뉴 초기화
function initDropdownMenus() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 모바일에서 드롭다운 토글
            if (window.innerWidth <= 768) {
                const dropdown = this.closest('.nav-dropdown');
                const menu = dropdown.querySelector('.dropdown-menu');
                
                if (menu.style.display === 'block') {
                    menu.style.display = 'none';
                } else {
                    // 다른 드롭다운 닫기
                    document.querySelectorAll('.dropdown-menu').forEach(m => {
                        m.style.display = 'none';
                    });
                    menu.style.display = 'block';
                }
            }
        });
    });
    
    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (window.innerWidth <= 768) {
                    menu.style.display = 'none';
                }
            });
        }
    });
}

// 사용자 드롭다운 토글
function toggleUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('active');
    }
}

// 사용자 드롭다운 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('active');
    }
});

// 프로필 수정 모달 표시
function showEditProfileModal() {
    const modal = document.getElementById('profile-setup-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // 현재 사용자 정보로 폼 채우기
        if (window.currentUser) {
            fillProfileForm();
        }
    }
}

// 현재 사용자 정보로 프로필 폼 채우기
async function fillProfileForm() {
    try {
        if (!window.currentUser || !window.usersCollection) return;
        
        const userDoc = await window.usersCollection.doc(window.currentUser.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // 폼 필드 채우기
            const nicknameInput = document.getElementById('nickname-input');
            const jobSelect = document.getElementById('job-select');
            const domainSelect = document.getElementById('domain-select');
            const regionSelect = document.getElementById('region-select');
            
            if (nicknameInput) nicknameInput.value = userData.nickname || '';
            if (jobSelect) jobSelect.value = userData.job || '';
            if (domainSelect) domainSelect.value = userData.domain || '';
            if (regionSelect) regionSelect.value = userData.region || '';
            
            // 닉네임 미리보기 업데이트
            updateNicknamePreview();
        }
    } catch (error) {
        console.error('프로필 정보 로드 오류:', error);
    }
} 