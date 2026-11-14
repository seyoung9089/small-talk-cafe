# 구글 로그인 켜기 (Firebase 무료 플랜, 약 10분)

로그인은 선택 기능입니다. 아래 설정 전에도 레벨·기록은 각 기기에 저장되고, 설정이 끝나면 다른 기기와 이어집니다.
카드 등록 없이 무료(Spark) 플랜으로 충분합니다.

## 1. 프로젝트 만들기
1. https://console.firebase.google.com 에 구글 계정으로 들어갑니다.
2. **프로젝트 만들기** → 이름 `small-talk-cafe` → Google 애널리틱스는 꺼도 됩니다 → **만들기**.

## 2. 구글 로그인 켜기
1. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**.
2. **로그인 방법** 탭 → **Google** → **사용 설정** 켜기 → 프로젝트 지원 이메일 고르기 → **저장**.
3. **설정** 탭 → **승인된 도메인** → **도메인 추가** → `seyoung9089.github.io` 입력 → 추가.

## 3. 기록 저장소(Firestore) 만들기
1. 왼쪽 메뉴 **빌드 → Firestore Database → 데이터베이스 만들기**.
2. 위치는 `asia-northeast3 (Seoul)` → **프로덕션 모드** → 만들기.
3. **규칙** 탭의 내용을 모두 지우고 아래를 붙여 넣은 뒤 **게시**. (각자 자기 기록만 읽고 쓸 수 있게 막는 규칙입니다)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 4. 웹 설정값 복사
1. 왼쪽 위 톱니바퀴 **프로젝트 설정 → 일반** → 아래쪽 **내 앱**에서 웹 아이콘 `</>` 클릭.
2. 앱 닉네임 `cafe` → **앱 등록** (Firebase 호스팅 체크는 안 해도 됩니다).
3. 화면에 나오는 `const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., ... };` 부분을 복사해서 Claude에게 보내 주세요.

이 값은 원래 웹페이지에 공개되는 값이라 보내도 괜찮습니다. 보안은 3번 규칙이 지켜 줍니다.
**서비스 계정 키(JSON 파일)나 비밀번호는 보내지 마세요.** 필요 없습니다.

## 코드에 넣는 곳
지금 사이트에는 로그인 코드가 빠져 있습니다. 다시 켤 때는 `extras/google-login.js` 맨 위 설명대로 index.html에 넣고, `FIREBASE_CONFIG`의 `null` 자리에 복사한 `{ ... }`를 넣습니다.
