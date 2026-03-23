import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { LogOut, PlayCircle, ShieldCheck, CheckCircle2, Circle, Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import MuxPlayer from '@mux/mux-player-react';

interface Progress {
  id: string;
  moduleId: string;
  completed: boolean;
}

interface SubEpisode {
  id: string;
  title: string;
  playbackId?: string;
  youtubeId?: string;
}

interface ModuleData {
  id: number;
  title: string;
  description: string;
  playbackId?: string;
  youtubeId?: string;
  subEpisodes?: SubEpisode[];
}

const MODULES_DATA: ModuleData[] = [
  {
    id: 1,
    title: "แนะนำตัวบทนำ Vibe Coding Master Route",
    description: "ทำความรู้จักกับคอร์สเรียนและภาพรวมของเนื้อหาทั้งหมด",
    playbackId: "XnY4cOj2vK02LPyVDNKzizukOVyZzAxVL3LwtVsH0001jI"
  },
  {
    id: 2,
    title: "Module 1 - ปูพื้นฐาน Vibe Coding & Ecosystem",
    description: "ทำความรู้จัก Vibe Coding จาก \"Code-First\" สู่ \"Vibe-First\" โดยใช้ความรู้สึกและสไตล์นำทาง\nThe Dream Team Ecosystem: Gemini (สมอง), Stitch (ตา), AI Studio (มือ), และ Antigravity (ผู้ช่วย Senior)\nรูปแบบเว็บไซต์ทำเงิน: Landing Page vs SaaS/Web App",
    playbackId: "RS7t2OGfWFbQQJizsPSOU9XF5UMirLrYUfjUVHsTfpQ"
  },
  {
    id: 3,
    title: "Module 2 - จากไอเดียสู่แผนที่รันได้จริง (Master PRD)",
    description: "PRD คืออะไร ทำไมถึงสำคัญ: เปลี่ยนไอเดียให้เป็น \"แผนที่\" ป้องกันไม่ให้ AI หลงทาง\nMaster PRD Prompt: สูตรคำสั่งลับให้ AI สวมบทบาทเป็น Product Manager\nMinimal PRD Checklist: 5 คำถามสำคัญก่อนเริ่มสร้างแอป",
    playbackId: "Xwqc011h00ydW1l01o1HNjYQo02OmfcFjk02cOfX01hBa5I01M"
  },
  {
    id: 4,
    title: "Module 3: Stitch จัด Vibe หน้าตาให้โดนใจ",
    description: "เสกหน้าเว็บจากจินตนาการ: ใช้ AI Stitch แปลงข้อความ ภาพสเก็ตช์ หรือลิงก์เว็บเป็น UI ที่สวยงาม\nส่งออกไปเขียนโค้ดต่อ: เตรียม UI ส่งออกแบบคลิกเดียวไปยัง Google AI Studio",
    playbackId: "4Sa4zLVwTcLOK2IctHr6013ie9GMaPHiJlFGj9PzRbXw"
  },
  {
    id: 5,
    title: "Module 4: AI Studio ปั้น App & UGC",
    description: "จากภาพสู่แอปที่คลิกได้ด้วย Google AI Studio\nTech Stack สำหรับ Vibe Coder: Next.js ตัวเลือกที่ดีที่สุดสำหรับเว็บแอปครบวงจร\nสร้าง UGC Generator: ระบบรูปภาพและวิดีโอรีวิวสินค้าพร้อม Prompt แบบ Vibe Coder",
    subEpisodes: [
      { id: "ep1", title: "ตอนที่ 1: AI Studio ปั้น Frontend ในพริบตา", playbackId: "hKEWzqiPkTzdlHxOY2teh3ywg37tyXwZB2KpwpIpvX4" },
      { id: "ep2", title: "ตอนที่ 2: สร้างโปรเจค UGC", playbackId: "lG5oBTQ2Pi02X56xyjxBgmegcyFdjAPgfFVE701NQna5s" },
      { id: "ep3", title: "ตอนที่ 3: เข้าใจ API KEY และค่าใช้จ่ายของ Google", playbackId: "O2moytc3PJBcDdOh9yevIl9LDjzn1BcWZFe8fcIW9H4" }
    ]
  },
  {
    id: 6,
    title: "Module 5: Antigravity - ใส่หัวใจให้ระบบ (Backend & Logic)",
    description: "รู้จัก Antigravity AI Agent: ผู้ช่วยที่คิด วางแผน และเขียนระบบหลังบ้านที่ซับซ้อน\nการทำงานแบบอัตโนมัติ: เชื่อมต่อ Database, เขียน Logic ยากๆ, และ Debug ตรงจุด\nทดสอบเสมือนผู้ใช้จริงด้วย Browser Automation",
    subEpisodes: [
      { id: "ep1", title: "ตอนที่ 1: Backend & Logic", playbackId: "e5009LoId9KVy011EBUMwki01GI5QD8kNNiZCtYiPMrwwM" },
      { id: "ep2", title: "ตอนที่ 2: Backend & Logic (ต่อ)", playbackId: "301IyBA7qzIzPPP9fTOR4E13gXuxbklVVcTvT7UmSIHI" }
    ]
  },
  {
    id: 7,
    title: "Module 6: Database & Security",
    description: "ฐานข้อมูลที่ Vibe Coder ต้องรู้: ระบบ All-in-One สำหรับเริ่มต้น SaaS\nสร้างระบบ Authentication: สมัครสมาชิกและล็อกอินผ่าน Email\nกฎเหล็กความปลอดภัย RLS: Row Level Security เส้นแบ่ง \"แอปของเล่น\" กับ \"แอปที่ขายได้\"",
    playbackId: "Aj01dTB2jzBCSkDsb2NcRtuJ9ATnY8hMVYd29inCVpTo"
  },
  {
    id: 8,
    title: "Module 7: Deploy แอปสู่โลกกว้าง",
    description: "นำขึ้นเว็บจริงให้คนทั้งโลกเห็น: 2 เส้นทางหลัก Vercel (สำหรับความยืดหยุ่น) และ Google Cloud Run (สำหรับสายลุยจาก AI Studio)\nการตั้งค่า Billing แบบไม่ช็อก: เปิดระบบคิดเงินใน Google Cloud อย่างปลอดภัย การเช็ก Log และวิธีซ่อน API Key",
    subEpisodes: [
      { id: "ep1", title: "ตอนที่ 1: Deploy แอปสู่โลกกว้าง", youtubeId: "z6EbwFdYTpw" },
      { id: "ep2", title: "ตอนที่ 2: Deploy แอปสู่โลกกว้าง Part 2 (ด้วย Cloud Run)", youtubeId: "KOr9HjIbdLQ" }
    ]
  },
  {
    id: 9,
    title: "Module 8-9: Security ขั้นสุด & ปิดโปรเจกต์ระดับโปรดักชัน",
    description: "ระดับโปร: ปกป้องบิลค่าใช้งาน AI ด้วยการเก็บ API Key ใน Secret Manager และ Environment Variables\nโมเดลธุรกิจสร้างรายได้: Subscription, ซื้อขาด (One-time), ระบบเครดิต, และ Freemium\nก้าวต่อไปของ Vibe Coder: สรุปทักษะทั้งหมดและการเข้าถึงกลุ่ม Community เพื่อรับ Support ต่อเนื่อง",
    youtubeId: "of_hLP4VJaI"
  },
  {
    id: 10,
    title: "บทจบและการดูแลต่อเนื่อง",
    description: "แนะนำการดูแลต่อเนื่องและคลังข้อมูลที่อัพเดทตามเทรนด์ให้ผู้เรียนทุกคนเข้าถึงได้ตลอดชีพ",
    youtubeId: "3-wif9y_o78"
  }
];

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [progress, setProgress] = useState<Progress[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playingModuleId, setPlayingModuleId] = useState<number | null>(null);
  const [playingSubEpisodeId, setPlayingSubEpisodeId] = useState<string | null>(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set());
  const [playbackToken, setPlaybackToken] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const allPlayableItems = useMemo(() => {
    return MODULES_DATA.flatMap(m => {
      if (m.subEpisodes) {
        return m.subEpisodes.map(s => ({
          moduleId: m.id,
          subEpisodeId: s.id,
          title: s.title,
          playbackId: s.playbackId,
          youtubeId: s.youtubeId,
          progressKey: `${m.id}-${s.id}`
        }));
      }
      return [{
        moduleId: m.id,
        subEpisodeId: undefined as string | undefined,
        title: m.title,
        playbackId: m.playbackId,
        youtubeId: m.youtubeId,
        progressKey: m.id.toString()
      }];
    });
  }, []);

  const TOTAL_LESSONS = allPlayableItems.length;

  const currentItemIndex = useMemo(() => {
    if (!playingModuleId) return -1;
    return allPlayableItems.findIndex(item =>
      item.moduleId === playingModuleId &&
      (item.subEpisodeId ?? null) === playingSubEpisodeId
    );
  }, [playingModuleId, playingSubEpisodeId, allPlayableItems]);

  const currentPlaybackId = useMemo(() => {
    if (!playingModuleId) return null;
    const module = MODULES_DATA.find(m => m.id === playingModuleId);
    if (!module) return null;
    if (module.subEpisodes && playingSubEpisodeId) {
      return module.subEpisodes.find(s => s.id === playingSubEpisodeId)?.playbackId ?? null;
    }
    return module.playbackId ?? null;
  }, [playingModuleId, playingSubEpisodeId]);

  const currentYoutubeId = useMemo(() => {
    if (!playingModuleId) return null;
    const module = MODULES_DATA.find(m => m.id === playingModuleId);
    if (!module) return null;
    if (module.subEpisodes && playingSubEpisodeId) {
      return module.subEpisodes.find(s => s.id === playingSubEpisodeId)?.youtubeId ?? null;
    }
    return module.youtubeId ?? null;
  }, [playingModuleId, playingSubEpisodeId]);

  const currentTitle = useMemo(() => {
    if (!playingModuleId) return '';
    const module = MODULES_DATA.find(m => m.id === playingModuleId);
    if (!module) return '';
    if (module.subEpisodes && playingSubEpisodeId) {
      const sub = module.subEpisodes.find(s => s.id === playingSubEpisodeId);
      return sub ? `บทที่ ${module.id} – ${sub.title}` : module.title;
    }
    return module.title;
  }, [playingModuleId, playingSubEpisodeId]);

  const currentDescription = useMemo(() => {
    if (!playingModuleId) return '';
    return MODULES_DATA.find(m => m.id === playingModuleId)?.description ?? '';
  }, [playingModuleId]);

  const currentProgressKey = useMemo(() => {
    if (!playingModuleId) return null;
    const module = MODULES_DATA.find(m => m.id === playingModuleId);
    if (!module) return null;
    if (module.subEpisodes && playingSubEpisodeId) return `${playingModuleId}-${playingSubEpisodeId}`;
    return playingModuleId.toString();
  }, [playingModuleId, playingSubEpisodeId]);

  const isItemCompleted = (progressKey: string) =>
    progress.find(p => p.moduleId === progressKey)?.completed ?? false;

  const videoPlayerRef = useRef<HTMLDivElement>(null);

  const getThumbnailUrl = (module: ModuleData, subEpisodeId?: string | null): string | null => {
    if (subEpisodeId && module.subEpisodes) {
      const sub = module.subEpisodes.find(s => s.id === subEpisodeId);
      if (sub?.playbackId) return `https://image.mux.com/${sub.playbackId}/thumbnail.jpg?time=10&width=640`;
      if (sub?.youtubeId) return `https://img.youtube.com/vi/${sub.youtubeId}/mqdefault.jpg`;
    }
    if (module.playbackId) return `https://image.mux.com/${module.playbackId}/thumbnail.jpg?time=10&width=640`;
    if (module.youtubeId) return `https://img.youtube.com/vi/${module.youtubeId}/mqdefault.jpg`;
    return null;
  };

  const prevItem = useMemo(() =>
    currentItemIndex > 0 ? allPlayableItems[currentItemIndex - 1] : null,
    [currentItemIndex, allPlayableItems]
  );

  const nextItem = useMemo(() =>
    currentItemIndex < allPlayableItems.length - 1 ? allPlayableItems[currentItemIndex + 1] : null,
    [currentItemIndex, allPlayableItems]
  );

  const playItem = (moduleId: number, subEpisodeId: string | null = null) => {
    setPlayingModuleId(moduleId);
    setPlayingSubEpisodeId(subEpisodeId);
    setExpandedModuleIds(prev => new Set([...prev, moduleId]));
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (playingModuleId !== null) {
      setTimeout(() => {
        videoPlayerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [playingModuleId, playingSubEpisodeId]);

  const handleNext = () => {
    if (currentItemIndex < allPlayableItems.length - 1) {
      const next = allPlayableItems[currentItemIndex + 1];
      playItem(next.moduleId, next.subEpisodeId ?? null);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      const prev = allPlayableItems[currentItemIndex - 1];
      playItem(prev.moduleId, prev.subEpisodeId ?? null);
    }
  };

  const toggleModuleExpanded = (moduleId: number) => {
    setExpandedModuleIds(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  useEffect(() => {
    if (!playingModuleId) {
      setPlaybackToken(null);
      setIsSigned(false);
      setPlayerReady(false);
      return;
    }
    const module = MODULES_DATA.find(m => m.id === playingModuleId);
    if (!module) return;

    let playbackId: string | undefined;
    let youtubeId: string | undefined;
    if (module.subEpisodes && playingSubEpisodeId) {
      const sub = module.subEpisodes.find(s => s.id === playingSubEpisodeId);
      playbackId = sub?.playbackId;
      youtubeId = sub?.youtubeId;
    } else {
      playbackId = module.playbackId;
      youtubeId = module.youtubeId;
    }

    if (youtubeId) {
      setPlaybackToken(null);
      setIsSigned(false);
      setPlayerReady(true);
      return;
    }

    if (!playbackId) {
      setPlayerReady(true);
      return;
    }

    setPlaybackToken(null);
    setIsSigned(false);
    setPlayerReady(false);
    fetch(`/api/mux/sign/${playbackId}`)
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
  }, [playingModuleId, playingSubEpisodeId]);

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

  const toggleProgress = async (progressKey: string) => {
    if (!user) return;
    const existing = progress.find(p => p.moduleId === progressKey);
    try {
      if (existing) {
        if (existing.completed) {
          await updateDoc(doc(db, 'userProgress', existing.id), { completed: false, completedAt: null });
        } else {
          await setDoc(doc(db, 'userProgress', existing.id), {
            userId: user.uid, moduleId: progressKey, completed: true, completedAt: new Date().toISOString()
          });
        }
      } else {
        await setDoc(doc(collection(db, 'userProgress')), {
          userId: user.uid, moduleId: progressKey, completed: true, completedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'userProgress');
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  const completedCount = progress.filter(p => p.completed).length;
  const progressPercentage = Math.min(100, Math.round((completedCount / TOTAL_LESSONS) * 100));

  const renderDescription = (description: string) => {
    const lines = description.split('\n').filter(l => l.trim());
    if (lines.length <= 1) return <p className="text-zinc-400 text-sm">{description}</p>;
    return (
      <ul className="space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-sm text-zinc-400">
            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:sticky md:top-0 md:h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">ความคืบหน้า</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-zinc-400 font-medium">ภาพรวม</span>
              <span className="text-2xl font-bold text-indigo-400 leading-none">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-3 text-center">
              เรียนจบแล้ว {completedCount} จาก {TOTAL_LESSONS} บทเรียน
            </p>
          </div>

          <div className="space-y-1">
            {MODULES_DATA.map((module) => {
              const isModuleActive = playingModuleId === module.id;
              const isExpanded = expandedModuleIds.has(module.id);

              if (module.subEpisodes) {
                const allSubDone = module.subEpisodes.every(s => isItemCompleted(`${module.id}-${s.id}`));
                return (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModuleExpanded(module.id)}
                      className={`w-full flex items-center gap-3 text-sm p-2.5 rounded-lg transition-colors text-left ${
                        isModuleActive
                          ? 'bg-indigo-500/10 border border-indigo-500/20'
                          : allSubDone
                          ? 'bg-emerald-500/5 border border-emerald-500/10'
                          : 'hover:bg-zinc-900/50 border border-transparent'
                      }`}
                    >
                      {allSubDone
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        : <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                      }
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`font-medium truncate ${isModuleActive || allSubDone ? 'text-zinc-200' : 'text-zinc-500'}`}>
                          บทที่ {module.id}
                        </span>
                        <span className="text-xs text-zinc-500 truncate" title={module.title}>
                          {module.title}
                        </span>
                      </div>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="ml-7 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                        {module.subEpisodes.map(sub => {
                          const progressKey = `${module.id}-${sub.id}`;
                          const isDone = isItemCompleted(progressKey);
                          const isActive = isModuleActive && playingSubEpisodeId === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => playItem(module.id, sub.id)}
                              className={`w-full flex items-center gap-2 text-xs p-2 rounded-lg transition-colors text-left ${
                                isActive
                                  ? 'bg-indigo-500/20 border border-indigo-500/30'
                                  : isDone
                                  ? 'bg-emerald-500/5 border border-emerald-500/10'
                                  : 'hover:bg-zinc-900/50 border border-transparent'
                              }`}
                            >
                              {isDone
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                : <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                              }
                              <span className={`truncate ${isActive ? 'text-indigo-300' : isDone ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                {sub.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const progressKey = module.id.toString();
              const isDone = isItemCompleted(progressKey);
              return (
                <button
                  key={module.id}
                  onClick={() => playItem(module.id, null)}
                  className={`w-full flex items-center gap-3 text-sm p-2.5 rounded-lg transition-colors text-left ${
                    isModuleActive
                      ? 'bg-indigo-500/10 border border-indigo-500/20'
                      : isDone
                      ? 'bg-emerald-500/5 border border-emerald-500/10'
                      : 'hover:bg-zinc-900/50 border border-transparent'
                  }`}
                >
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    : <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                  }
                  <div className="flex flex-col min-w-0">
                    <span className={`font-medium truncate ${isModuleActive || isDone ? 'text-zinc-200' : 'text-zinc-500'}`}>
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
        </div>

        {/* LINE Contact in sidebar bottom */}
        <div className="p-4 border-t border-zinc-800">
          <a
            href="https://line.me/ti/p/~@237dhtqp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/20 rounded-xl transition-colors w-full"
          >
            <MessageCircle className="w-4 h-4 text-[#06C755] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#06C755]">ติดต่อสอบถามเพิ่มเติม</p>
              <p className="text-xs text-zinc-500 truncate">LINE Official</p>
            </div>
          </a>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <button className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-sm mb-1">บทเรียนที่เรียนจบ</div>
              <div className="text-3xl font-bold">{completedCount} / {TOTAL_LESSONS}</div>
            </div>
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-sm mb-1">ความคืบหน้าโดยรวม</div>
              <div className="text-3xl font-bold text-indigo-400">{progressPercentage}%</div>
            </div>
            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
              <div className="text-zinc-500 text-sm mb-1">สถานะ</div>
              <div className="text-3xl font-bold text-emerald-400">
                {progressPercentage === 100 ? "เรียนจบแล้ว" : "กำลังเรียน"}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">
              {playingModuleId ? currentTitle : "ยินดีต้อนรับสู่ระบบของสมาชิก VIP ที่เรียนคอร์ส Vibe Coding Master Route กับเรา"}
            </h1>
            {playingModuleId && (
              <div className="mt-2">{renderDescription(currentDescription)}</div>
            )}
            {!playingModuleId && (
              <p className="text-zinc-400 text-sm">เนื้อหาวิดีโอพิเศษสำหรับสมาชิกที่ได้รับอนุญาตเท่านั้น</p>
            )}
          </div>

          {/* Video Player */}
          {playingModuleId ? (
            <div ref={videoPlayerRef} className="mb-10 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
              <div className="aspect-video bg-black flex items-center justify-center">
                {!playerReady ? (
                  <div className="text-zinc-500 animate-pulse">กำลังโหลดวิดีโอ...</div>
                ) : currentYoutubeId ? (
                  <iframe
                    key={currentYoutubeId}
                    src={`https://www.youtube.com/embed/${currentYoutubeId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    title={currentTitle}
                  />
                ) : currentPlaybackId ? (
                  <MuxPlayer
                    playbackId={currentPlaybackId}
                    {...(isSigned && playbackToken ? { tokens: { playback: playbackToken } } : {})}
                    metadata={{ video_id: currentProgressKey ?? '', video_title: currentTitle }}
                    streamType="on-demand"
                    className="w-full h-full"
                    autoPlay
                  />
                ) : (
                  <div className="text-zinc-500">ไม่พบวิดีโอ</div>
                )}
              </div>
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {currentProgressKey && (
                    <button
                      onClick={() => toggleProgress(currentProgressKey)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-sm"
                    >
                      {isItemCompleted(currentProgressKey)
                        ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> <span className="text-emerald-400">เรียนจบแล้ว</span></>
                        : <><Circle className="w-4 h-4" /> <span>ทำเครื่องหมายว่าจบ</span></>
                      }
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePrevious} disabled={currentItemIndex === 0} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={handleNext} disabled={currentItemIndex === allPlayableItems.length - 1} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setPlayingModuleId(null); setPlayingSubEpisodeId(null); }} className="p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-10 bg-gradient-to-br from-indigo-900/20 to-zinc-900 p-8 rounded-2xl border border-indigo-500/20">
              <h2 className="text-2xl font-bold mb-3">พร้อมเรียนต่อหรือยัง?</h2>
              <p className="text-zinc-400 mb-5 text-sm max-w-2xl">
                {progressPercentage === 100
                  ? "ยินดีด้วย! คุณเรียนจบทุกบทเรียนแล้ว สามารถกลับมาทบทวนได้ตลอดเวลา"
                  : "เลือกบทเรียนจากรายการด้านล่าง หรือกด \"เรียนต่อ\" เพื่อเรียนต่อจากจุดที่หยุดไว้"}
              </p>
              <button
                onClick={() => {
                  const next = allPlayableItems.find(item => !isItemCompleted(item.progressKey));
                  const target = next ?? allPlayableItems[0];
                  playItem(target.moduleId, target.subEpisodeId ?? null);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors text-sm"
              >
                {progressPercentage === 100 ? "ทบทวนบทเรียน" : "เรียนต่อ"}
              </button>
            </div>
          )}

          {/* When playing: show only prev/next */}
          {playingModuleId && (prevItem || nextItem) && (
            <div className="mb-10">
              <h2 className="text-base font-semibold text-zinc-400 mb-4">บทที่เกี่ยวข้อง</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[prevItem && { item: prevItem, label: 'บทก่อนหน้า' }, nextItem && { item: nextItem, label: 'บทถัดไป' }]
                  .filter(Boolean)
                  .map((entry) => {
                    const { item, label } = entry!;
                    const mod = MODULES_DATA.find(m => m.id === item.moduleId)!;
                    const thumb = getThumbnailUrl(mod, item.subEpisodeId);
                    const progressKey = item.subEpisodeId ? `${item.moduleId}-${item.subEpisodeId}` : item.moduleId.toString();
                    const isDone = isItemCompleted(progressKey);
                    return (
                      <button
                        key={item.progressKey}
                        onClick={() => playItem(item.moduleId, item.subEpisodeId ?? null)}
                        className="flex gap-4 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-colors text-left group"
                      >
                        <div className="relative w-36 shrink-0 bg-zinc-800 overflow-hidden">
                          {thumb ? (
                            <>
                              <img src={thumb} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                            </>
                          ) : (
                            <div className="absolute inset-0 bg-zinc-800" />
                          )}
                          <PlayCircle className="absolute inset-0 m-auto w-8 h-8 text-white/80 group-hover:text-indigo-400 transition-colors drop-shadow z-10" />
                        </div>
                        <div className="flex flex-col justify-center py-3 pr-4 min-w-0">
                          <span className="text-xs text-zinc-500 mb-1">{label}</span>
                          <span className="text-sm font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors line-clamp-2">{item.title}</span>
                          {isDone && <span className="mt-1.5 flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />เรียนจบแล้ว</span>}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Module Cards Grid — shown only when not playing */}
          {!playingModuleId && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES_DATA.map((module) => {
              if (module.subEpisodes) {
                const allSubDone = module.subEpisodes.every(s => isItemCompleted(`${module.id}-${s.id}`));
                const hasYoutube = module.subEpisodes.some(s => s.youtubeId);
                return (
                  <div key={module.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 hover:border-indigo-500/40 transition-colors">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${hasYoutube ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            {hasYoutube ? 'YouTube' : 'พรีเมียม'}
                          </span>
                          <span className="text-xs text-zinc-500">บทที่ {module.id}</span>
                        </div>
                        {allSubDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <h3 className="font-semibold text-sm mb-3 leading-snug">{module.title}</h3>
                      <div className="space-y-1.5">
                        {module.subEpisodes.map(sub => {
                          const progressKey = `${module.id}-${sub.id}`;
                          const isDone = isItemCompleted(progressKey);
                          const isActive = playingModuleId === module.id && playingSubEpisodeId === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => playItem(module.id, sub.id)}
                              className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors text-left text-xs ${
                                isActive
                                  ? 'bg-indigo-500/20 border border-indigo-500/30'
                                  : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
                              }`}
                            >
                              <PlayCircle className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                              <span className={`flex-1 truncate ${isActive ? 'text-indigo-300' : 'text-zinc-300'}`}>{sub.title}</span>
                              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const progressKey = module.id.toString();
              const isDone = isItemCompleted(progressKey);
              const isActive = playingModuleId === module.id;
              const isYoutube = !!module.youtubeId;
              return (
                <div
                  key={module.id}
                  className={`bg-zinc-900 rounded-2xl overflow-hidden border transition-colors group cursor-pointer ${
                    isActive ? 'border-indigo-500/40' : 'border-zinc-800 hover:border-indigo-500/40'
                  }`}
                  onClick={() => playItem(module.id, null)}
                >
                  <div className="aspect-video bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                    {getThumbnailUrl(module) ? (
                      <>
                        <img
                          src={getThumbnailUrl(module)!}
                          alt={module.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
                    )}
                    <PlayCircle className={`relative z-10 w-10 h-10 drop-shadow-lg transition-colors ${isActive ? 'text-indigo-400' : 'text-white/80 group-hover:text-indigo-400'}`} />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${isYoutube ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                          {isYoutube ? 'YouTube' : 'พรีเมียม'}
                        </span>
                        <span className="text-xs text-zinc-500">บทที่ {module.id}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleProgress(progressKey); }}
                        className="text-zinc-500 hover:text-indigo-400 transition-colors"
                      >
                        {isDone
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <Circle className="w-4 h-4" />
                        }
                      </button>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug group-hover:text-indigo-400 transition-colors">
                      {module.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>}

          {/* LINE Contact footer */}
          <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-zinc-500 text-sm">© Vibe Code Hub · สงวนลิขสิทธิ์สำหรับสมาชิก VIP เท่านั้น</p>
            <a
              href="https://line.me/ti/p/~@237dhtqp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#06C755]/10 hover:bg-[#06C755]/20 border border-[#06C755]/20 rounded-xl transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4 text-[#06C755]" />
              <span className="text-[#06C755] font-medium">ติดต่อสอบถามเพิ่มเติม LINE Official</span>
            </a>
          </div>
        </main>
      </div>
    </div>
  );
};
