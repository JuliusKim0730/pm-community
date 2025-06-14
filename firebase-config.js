// Firebase 설정 (현재 비활성화 - 로컬 스토리지 모드 사용)
console.log('로컬 스토리지 모드로 실행');

// Firebase 사용 불가 상태로 설정
window.firebaseError = true;
window.useLocalStorage = true;

// 더미 객체들 생성 (오류 방지용)
window.firebase = {
    apps: [],
    firestore: () => ({
        collection: () => ({
            add: () => Promise.reject('Firebase 비활성화'),
            get: () => Promise.reject('Firebase 비활성화'),
            doc: () => ({
                get: () => Promise.reject('Firebase 비활성화')
            })
        })
    }),
    storage: () => ({
        ref: () => ({
            child: () => ({
                put: () => Promise.reject('Firebase 비활성화')
            })
        })
    })
};

// 컬렉션 참조 더미
window.postsCollection = window.firebase.firestore().collection('posts');
window.booksCollection = window.firebase.firestore().collection('books');
window.db = window.firebase.firestore();
window.storage = window.firebase.storage();

console.log('로컬 스토리지 모드 초기화 완료'); 