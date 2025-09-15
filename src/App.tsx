import { useEffect, useState } from 'react';
import { auth, db } from './lib/firebase';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';

type Item = {
  id: string;
  uid: string;
  title: string;
  status: string;
  createdAt?: any;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  // 로그인 상태 감지
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // 내 아이템 실시간 구독
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const q = query(collection(db, 'items'), where('uid', '==', user.uid));
    const off = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return off;
  }, [user]);

  async function login() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }
  async function logout() {
    await signOut(auth);
  }
  async function addSampleItem() {
    if (!user) return;
    await addDoc(collection(db, 'items'), {
      uid: user.uid,
      title: '샘플 아이템',
      status: 'reading',
      createdAt: serverTimestamp(),
    });
  }
  async function removeItem(id: string) {
    await deleteDoc(doc(db, 'items', id));
  }

  return (
    <div>
      <header className="h-12 flex items-center justify-center bg-black text-white">
        Tailwind OK
      </header>

      <div className="p-4 space-y-3">
        <h1 className="text-xl font-bold">Firestore 리스트</h1>

        {!user ? (
          <button onClick={login} className="px-4 py-2 border rounded">
            Google로 로그인
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                안녕하세요, <b>{user.displayName}</b> 님
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addSampleItem}
                  className="px-3 py-2 border rounded"
                >
                  샘플 추가
                </button>
                <button onClick={logout} className="px-3 py-2 border rounded">
                  로그아웃
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="text-gray-600">
                아직 아이템이 없습니다. “샘플 추가”를 눌러보세요.
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li
                    key={it.id}
                    className="border rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{it.title}</div>
                      <div className="text-sm text-gray-500">{it.status}</div>
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="px-3 py-2 border rounded"
                      title="삭제"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
