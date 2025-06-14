// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBqJXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "pmcommunity-default-rtdb.firebaseapp.com",
    projectId: "pmcommunity",
    storageBucket: "pmcommunity.appspot.com",
    messagingSenderId: "1081720120818",
    appId: "1:1081720120818:web:d6f12867b6ad32e58937b"
};

// Firebase 초기화 및 오류 처리
try {
    // Firebase 초기화
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase 초기화 완료');
    }

    // Firestore 데이터베이스 참조
    const db = firebase.firestore();

    // Storage 참조
    const storage = firebase.storage();

    // 컬렉션 참조
    const postsCollection = db.collection('posts');
    const booksCollection = db.collection('books');

    console.log('Firebase 서비스 초기화 완료');
} catch (error) {
    console.error('Firebase 초기화 오류:', error);
    
    // Firebase 연결 실패 시 로컬 스토리지 사용
    console.log('로컬 스토리지 모드로 전환');
    
    // 전역 변수로 설정하여 다른 스크립트에서 사용 가능
    window.firebaseError = true;
    window.useLocalStorage = true;
} 