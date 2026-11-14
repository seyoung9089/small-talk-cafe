/* 구글 로그인(Firebase) 코드 보관본. 지금 사이트에는 들어 있지 않습니다.
   다시 켤 때: index.html의 로그인 자리 표시(AUTH 정의)를 이 코드로 바꾸고, 맨 끝 render(); 다음 줄에 fbInit(); 을 추가하고,
   FIREBASE_CONFIG에 설정값을 넣습니다. 프로필 화면의 로그인 영역·안내 문구는 커밋 e683976 의 index.html(renderProfile, renderInfo)에서 그대로 가져오면 됩니다. 설정 방법은 FIREBASE-SETUP.md 참고. */
/* ================= 구글 로그인 + 기록 동기화 (Firebase 무료 플랜) ================= */
/* 로그인은 선택입니다. 로그인하지 않아도 레벨·기록은 이 기기(localStorage)에 저장됩니다.
   로그인하면 이 기기 기록과 계정 기록을 합쳐(같은 대화는 한 번만) 다른 기기에서도 이어집니다.
   아래 값은 Firebase 콘솔 > 프로젝트 설정 > 내 앱 > 웹 앱의 'firebaseConfig'를 그대로 붙여 넣는 곳입니다.
   웹 앱 설정값은 원래 공개되는 값이라 여기 적어도 괜찮습니다(비밀키 아님). 접근은 Firestore 보안 규칙이 막아 줍니다. */
const FIREBASE_CONFIG=null;
const FB_VER='10.12.2';
const AUTH={on:!!FIREBASE_CONFIG,ready:false,user:null,busy:false,err:'',sync:''};
let FB=null;   // {signIn, signOut, load(uid), save(uid,data)}
function mergeGames(a,b){const m=new Map();[...(a||[]),...(b||[])].forEach(g=>{if(g&&g.at&&!m.has(g.at))m.set(g.at,g)});return [...m.values()].sort((x,y)=>x.at-y.at)}
function mergeSaved(a,b){const out=[];[...(a||[]),...(b||[])].forEach(x=>{if(x&&x.en&&!out.some(y=>y.en===x.en))out.push(x)});return out.sort((x,y)=>(y.at||0)-(x.at||0))}
async function syncNow(){
  if(!FB||!AUTH.user)return;AUTH.sync='동기화 중…';rerenderIdle();
  try{const remote=await FB.load(AUTH.user.uid)||{};
    const games=mergeGames(gamesList(),remote.games),saved=mergeSaved(savedList(),remote.saved);
    store.set('stc.games',games);store.set('stc.saved',saved);
    if(remote.talkLv&&!store.get('stc.talkLv',null))store.set('stc.talkLv',remote.talkLv);
    await FB.save(AUTH.user.uid,{name:AUTH.user.name||'',photo:AUTH.user.photo||'',games,saved,talkLv:store.get('stc.talkLv',null),updated:Date.now()});
    AUTH.sync='저장됨 · '+new Date().toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
  }catch(e){AUTH.sync='동기화하지 못했습니다. 인터넷 연결을 확인해 주세요. (기록은 이 기기에 안전하게 남아 있어요)'}
  rerenderIdle();
}
function rerenderIdle(){if(!S||S.receipt)render()}   // 대화 중에는 화면을 다시 그리지 않음
async function fbInit(){
  if(window.STC_FB_TEST){FB=window.STC_FB_TEST;AUTH.on=true}   // 시험용 가짜 로그인
  else if(FIREBASE_CONFIG){
    try{const base='https://www.gstatic.com/firebasejs/'+FB_VER+'/';
      const [A,U,F]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
      const fapp=A.initializeApp(FIREBASE_CONFIG),auth=U.getAuth(fapp),db=F.getFirestore(fapp);
      FB={onUser:cb=>U.onAuthStateChanged(auth,u=>cb(u?{uid:u.uid,name:u.displayName,photo:u.photoURL}:null)),
        signIn:()=>U.signInWithPopup(auth,new U.GoogleAuthProvider()),
        signOut:()=>U.signOut(auth),
        load:async uid=>{const d=await F.getDoc(F.doc(db,'users',uid));return d.exists()?d.data():null},
        save:(uid,data)=>F.setDoc(F.doc(db,'users',uid),data)};
    }catch(e){AUTH.err='로그인 기능을 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.';AUTH.ready=true;rerenderIdle();return}
  }else{AUTH.ready=true;return}
  FB.onUser(u=>{AUTH.user=u;AUTH.ready=true;AUTH.busy=false;if(u)syncNow();else{AUTH.sync='';rerenderIdle()}});
}
async function signIn(){if(!FB||AUTH.busy)return;AUTH.busy=true;AUTH.err='';render();
  try{await FB.signIn()}catch(e){const c=(e&&e.code)||'';AUTH.busy=false;
    AUTH.err=/popup-closed|cancelled-popup/.test(c)?'로그인 창이 닫혔어요. 다시 눌러 주세요.':/popup-blocked/.test(c)?'팝업이 막혔어요. 브라우저 주소창의 팝업 허용을 켜고 다시 눌러 주세요.':/unauthorized-domain/.test(c)?'이 주소는 아직 로그인 허용 목록에 없어요. (Firebase 승인된 도메인 확인 필요)':'로그인하지 못했어요. 카카오톡·인스타그램 안에서 열었다면 크롬이나 사파리로 열어 주세요.';render()}}
async function signOutNow(){if(!FB||!AUTH.user)return;
  /* 같이 쓰는 컴퓨터일 수 있으니, 계정에 저장이 끝난 뒤 이 기기의 기록을 지웁니다(계정에는 그대로 남음) */
  let ok=false;try{await FB.save(AUTH.user.uid,{name:AUTH.user.name||'',photo:AUTH.user.photo||'',games:gamesList(),saved:savedList(),talkLv:store.get('stc.talkLv',null),updated:Date.now()});ok=true}catch(e){}
  if(!ok){AUTH.err='계정에 저장하지 못해서 로그아웃을 멈췄어요. 인터넷 연결을 확인하고 다시 눌러 주세요.';render();return}
  try{await FB.signOut()}catch(e){}
  ['stc.games','stc.saved','stc.history','stc.talkLv'].forEach(k=>{try{localStorage.removeItem(k)}catch(e){}});store.set('stc.games',[]);
  AUTH.user=null;AUTH.sync='';AUTH.err='';render()}


