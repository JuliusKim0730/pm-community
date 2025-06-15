# PM 커뮤니티 프로젝트 배포 및 작업 요약

## 📋 프로젝트 개요
- **프로젝트명**: PM 커뮤니티 - PM들의 수다
- **목적**: PM/PO/서비스 기획자들을 위한 커뮤니티 플랫폼
- **기술 스택**: HTML, CSS, JavaScript, Firebase, Vercel

## 🚀 배포 정보
- **현재 배포 URL**: https://pm-community-99drlpv1a-juliuskims-projects.vercel.app
- **목표 배포 URL**: https://pm-community.vercel.app
- **배포 플랫폼**: Vercel
- **Git 저장소**: https://github.com/JuliusKim0730/pm-community.git

## ✅ 완료된 주요 기능들

### 1. 자주나오는 질문 게시판 권한 제한
- **구현 내용**: 운영진, 슈퍼바이저 계정만 글쓰기 가능
- **기능**: 다른 등급 사용자는 글쓰기 버튼 자동 숨김 처리
- **파일**: `board.js`, `firebase-config.js`

### 2. 메뉴 명칭 변경
- **변경 사항**: "뉴스" → "역량 강화"
- **위치**: PM을 위한 공부 드롭다운 메뉴
- **아이콘**: 차트 아이콘으로 변경하여 역량 강화 의미 강조

### 3. 서비스경험디자인 자격증 메뉴 추가
- **위치**: PM을 위한 공부 드롭다운에 새로운 메뉴 추가
- **기능**: 
  - 전용 페이지 구현 (미리보기 이미지, 기능 소개, 링크 버튼)
  - https://service-quali-test.vercel.app/ 링크 연결
  - 실제 사이트 스크린샷 기반 미리보기 이미지
  - 모바일 최적화된 반응형 디자인

### 4. 권한 관리 시스템
- **사용자 등급**: 슈퍼바이저, 운영진, 핵심, 일반
- **권한별 기능**: 게시판별 글쓰기 권한 제어
- **UI 제어**: 로그인/로그아웃 시 권한에 따른 버튼 가시성 자동 업데이트

## 📁 주요 파일 구조
```
pm-community/
├── index.html              # 메인 HTML 파일
├── styles.css              # 스타일시트
├── board.js                # 게시판 관리 로직
├── script.js               # 메인 스크립트
├── firebase-config.js      # Firebase 설정 및 인증
├── vercel.json            # Vercel 배포 설정
└── .vercel/               # Vercel 프로젝트 설정
```

## 🔧 기술적 구현 사항

### Firebase 연동
- **인증**: Google 로그인
- **데이터베이스**: Firestore
- **스토리지**: Firebase Storage
- **보안 규칙**: 읽기는 공개, 쓰기는 인증된 사용자만

### 권한 시스템
```javascript
// 사용자 등급 정의
userRoles = {
    SUPERVISOR: 'supervisor',
    ADMIN: 'admin', 
    CORE: 'core',
    GENERAL: 'general'
};

// FAQ 게시판 권한 제한
canWritePost(userRole, boardId = null) {
    if (boardId === 'faq') {
        return userRole === this.userRoles.SUPERVISOR || 
               userRole === this.userRoles.ADMIN;
    }
    // 다른 게시판은 핵심 이상
    return userRole === this.userRoles.SUPERVISOR || 
           userRole === this.userRoles.ADMIN || 
           userRole === this.userRoles.CORE;
}
```

### 반응형 디자인
- 모바일 최적화
- 다크 테마 적용
- 그리드 레이아웃 활용

## 📝 Git 커밋 히스토리
1. **feat: FAQ 권한제한, 뉴스→역량강화, 서비스경험디자인 자격증 메뉴 추가**
2. **update: 서비스경험디자인 자격증 페이지 개선**
   - 실제 사이트 스크린샷으로 미리보기 이미지 교체
   - 모바일 최적화 기능 설명 제거

## 🔄 배포 상태
- **Git 저장소**: 최신 코드 푸시 완료
- **Vercel 배포**: 자동 배포 완료
- **도메인 연결**: pm-community.vercel.app 연결 필요 (수동 설정)

## 📞 연락처 및 지원
- **카카오톡 오픈채팅**: PM들의 수다
- **컨설팅 서비스**: 1:1 맞춤형 커리어 컨설팅 제공

## 🎯 향후 개선 사항
1. pm-community.vercel.app 도메인 연결 완료
2. 추가 기능 요청 시 구현
3. 사용자 피드백 반영

---
**마지막 업데이트**: 2024년 12월 (최신 배포 완료)
**개발자**: Julius Kim
**프로젝트 상태**: 배포 완료, 운영 중 