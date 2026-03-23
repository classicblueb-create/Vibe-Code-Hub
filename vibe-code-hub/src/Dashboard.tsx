import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { LogOut, PlayCircle, ShieldCheck, CheckCircle2, Circle, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import MuxPlayer from '@mux/mux-player-react';

interface Progress {
  id: string;
  moduleId: string;
  completed: boolean;
}

const MODULES_DATA = [
  {
    id: 1,
    title: "แนะนำตัวบทนำ Vibe Coding Master Route",
    description: "ทำความรู้จักกับคอร์สเรียนและภาพรวมของเนื้อหาทั้งหมด",
    duration: "05:00",
    playbackId: "XnY4cOj2vK02LPyVDNKzizukOVyZzAxVL3LwtVsH0001jI"
  },
  {
    id: 2,
    title: "Introduction to Vibe Coding",
    description: "เริ่มต้นกับพื้นฐานการพัฒนาด้วย AI และการตั้งค่าสภาพแวดล้อม",
    duration: "10:24",
    playbackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  },
  {
    id: 3,
    title: "Advanced Prompt Engineering",
    description: "เรียนรู้การเขียน Prompt ที่มีประสิทธิภาพสำหรับการสร้างโค้ดและแก้ปัญหา",
    duration: "15:45",
    playbackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  },
  {
    id: 4,
    title: "Building Scalable Architectures",
    description: "รูปแบบการออกแบบและสถาปัตยกรรมระบบสำหรับเว็บแอปพลิเคชันสมัยใหม่",
    duration: "22:10",
    playbackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  },
  {
    id: 5,
    title: "State Management Mastery",
    description: "เจาะลึก React State, Context และ External Stores สำหรับแอปพลิเคชันซับซ้อน",
    duration: "18:30",
    playbackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  },
  {
    id: 6,
    title: "Security Best Practices",
    description: "ปกป้องแอปพลิเคชันจากช่องโหว่ทั่วไปและรักษาความปลอดภัยข้อมูลผู้ใช้",
    duration: "14:15",
    playbackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  },
  {
    id: 7,
    title: "Deployment and CI/CD",
    description: "อัตโนมัติกระบวนการ Build และ Deploy สำหรับการส่งมอบที่ราบรื่น",
    duration: "20:05",
    playbackId: "DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
  }
];

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playingModuleId, setPlayingModuleId] = useState<number | null>(null);
  const [playbackToken, setPlaybackToken] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    if (playingModuleId) {
      const module = MODULES_DATA.find(m => m.id === playingModuleId);
      if (module && module.playbackId) {
        setPlaybackToken(null);
        setIsSigned(false);
        setPlayerReady(false);
        fetch(`/api/mux/sign/${module.playbackId}`)
          .then(res => res.json())
          .then(data => {
            setIsSigned(data.signed === true);
            setPlaybackToken(data.signed ? data.token : null);
            setPlayerReady(true);
          })
          .catch(() => {
            setIsSigned(false);
            setPlaybackToken(null);
            setPlayerReady(true);
          });
      }
    } else {
      setPlaybackToken(null);
      setIsSigned(false);
      setPlayerReady(false);
    }
  }, [playingModuleId]);

  const handleNext = () => {
    if (playingModuleId && playingModuleId < TOTAL_MODULES) {
      setPlayingModuleId(playingModuleId + 1);
    }
  };

  const handlePrevious = () => {
    if (playingModuleId && playingModuleId > 1) {
      setPlayingModuleId(playingModuleId - 1);
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'userProgress'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const progressData: Progress[] = [];
      snapshot.forEach((d) => {
        progressData.push({ id: d.id, ...d.data() } as Progress);
      });
      setProgress(progressData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'userProgress');
    });
    return () => unsubscribe();
  }, [user]);

  const toggleProgress = async (moduleId: number) => {
    if (!user) return;
    const moduleIdStr = moduleId.toString();
    const existing = progress.find(p => p.moduleId === moduleIdStr);

    try {
      if (existing) {
        if (existing.completed) {
          await updateDoc(doc(db, 'userProgress', existing.id), {
            completed: false,
            completedAt: null
          });
        } else {
          await setDoc(doc(db, 'userProgress', existing.id), {
            userId: user.uid,
            moduleId: moduleIdStr,
            completed: true,
            completedAt: new Date().toISOString()
          });
        }
      } else {
        await setDoc(doc(collection(db, 'userProgress')), {
          userId: user.uid,
          moduleId: moduleIdStr,
          completed: true,
          completedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'userProgress');
    }
  };

  // ป้องกันการคลิกขวา
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const TOTAL_MODULES = MODULES_DATA.length;
  const completedCount = progress.filter(p => p.completed).length;
  const progressPercentage = Math.round((completedCount / TOTAL_MODULES) * 100);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 p-6 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-4 md:mb-4">
          <h2 className="font-bold text-lg">ความคืบหน้า</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-2 text-zinc-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-8 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm text-zinc-400 font-medium">ภาพรวม</span>
            <span className="text-2xl font-bold text-indigo-400 leading-none">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 text-center">
            เรียนจบแล้ว {completedCount} จาก {TOTAL_MODULES} บทเรียน
          </p>
        </div>

        <div className="space-y-1">
          {MODULES_DATA.map((module) => {
            const isCompleted = progress.find(p => p.moduleId === module.id.toString())?.completed;
            return (
              <button
                key={module.id}
                onClick={() => {
                  setPlayingModuleId(module.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 text-sm p-2.5 rounded-lg transition-colors text-left ${
                  isCompleted ? 'bg-emerald-500/5 border border-emerald-500/10' : 'hover:bg-zinc-900/50 border border-transparent'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className={`font-medium truncate ${isCompleted ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    บทที่ {module.id}
                  </span>
                  <span className="text-xs text-zinc-500 truncate" title={module.title}>
                    {module.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div className="p-2 bg-indigo-500/10 rounded-lg hidden sm:block">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="font-bold text-lg tracking-tight">Vibe Code Hub</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400 hidden sm:inline-block">{user?.email}</span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-sm mb-1">บทเรียนที่เรียนจบ</div>
              <div className="text-3xl font-bold">{completedCount} / {TOTAL_MODULES}</div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-sm mb-1">ความคืบหน้าโดยรวม</div>
              <div className="text-3xl font-bold text-indigo-400">{progressPercentage}%</div>
            </div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-sm mb-1">สถานะ</div>
              <div className="text-3xl font-bold text-emerald-400">
                {progressPercentage === 100 ? "เรียนจบแล้ว" : "กำลังเรียน"}
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">
              {playingModuleId
                ? `บทที่ ${playingModuleId}: ${MODULES_DATA.find(m => m.id === playingModuleId)?.title}`
                : "ยินดีต้อนรับสู่พอร์ทัล VIP"}
            </h1>
            <p className="text-zinc-400">
              {playingModuleId
                ? MODULES_DATA.find(m => m.id === playingModuleId)?.description
                : "เนื้อหาวิดีโอพิเศษสำหรับสมาชิกที่ได้รับอนุญาตเท่านั้น"}
            </p>
          </div>

          {playingModuleId ? (
            <div className="mb-12 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <div className="aspect-video bg-black flex items-center justify-center">
                {!playerReady ? (
                  <div className="text-zinc-500 animate-pulse">กำลังโหลดวิดีโอ...</div>
                ) : (
                  <MuxPlayer
                    playbackId={MODULES_DATA.find(m => m.id === playingModuleId)?.playbackId}
                    {...(isSigned && playbackToken ? { tokens: { playback: playbackToken } } : {})}
                    metadata={{
                      video_id: playingModuleId.toString(),
                      video_title: MODULES_DATA.find(m => m.id === playingModuleId)?.title,
                    }}
                    streamType="on-demand"
                    className="w-full h-full"
                    autoPlay
                  />
                )}
              </div>
              <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{MODULES_DATA.find(m => m.id === playingModuleId)?.title}</h2>
                  <p className="text-zinc-400">{MODULES_DATA.find(m => m.id === playingModuleId)?.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrevious} disabled={playingModuleId === 1} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full disabled:opacity-50">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={handleNext} disabled={playingModuleId === TOTAL_MODULES} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full disabled:opacity-50">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button onClick={() => setPlayingModuleId(null)} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-12 bg-gradient-to-br from-indigo-900/20 to-zinc-900 p-8 rounded-2xl border border-indigo-500/20">
              <h2 className="text-3xl font-bold mb-4">พร้อมเรียนต่อหรือยัง?</h2>
              <p className="text-zinc-400 mb-6 max-w-2xl">
                {progressPercentage === 100
                  ? "ยินดีด้วย! คุณเรียนจบทุกบทเรียนแล้ว สามารถกลับมาทบทวนได้ตลอดเวลา"
                  : "คุณกำลังคืบหน้าได้ดีมาก! เรียนต่อจากจุดที่หยุดไว้หรือเริ่มบทถัดไปเพื่อเรียนรู้เพิ่มเติม"}
              </p>
              <button
                onClick={() => {
                  const nextModule = MODULES_DATA.find(m => !progress.find(p => p.moduleId === m.id.toString())?.completed);
                  setPlayingModuleId(nextModule ? nextModule.id : 1);
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {progressPercentage === 100 ? "ทบทวนบทเรียน" : "เรียนต่อ"}
              </button>
            </div>
          )}

          {playingModuleId && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MODULES_DATA.map((module) => (
                <div key={module.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group hover:border-indigo-500/50 transition-colors">
                  <div
                    className="aspect-video bg-zinc-800 relative flex items-center justify-center group-hover:bg-zinc-700 transition-colors cursor-pointer"
                    onClick={() => setPlayingModuleId(module.id)}
                  >
                    <PlayCircle className="w-12 h-12 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-mono">
                      {module.duration}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-medium rounded">พรีเมียม</span>
                        <span className="text-xs text-zinc-500">บทที่ {module.id}</span>
                      </div>
                      <button onClick={() => toggleProgress(module.id)} className="text-zinc-500 hover:text-indigo-400 transition-colors">
                        {progress.find(p => p.moduleId === module.id.toString())?.completed
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          : <Circle className="w-5 h-5" />}
                      </button>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-indigo-400 transition-colors">{module.title}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">
                      {module.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
