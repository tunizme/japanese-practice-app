'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, Home, Layers, RotateCcw, Sparkles, Volume2, X } from 'lucide-react';
import { getKana, type Kana } from '@/lib/kana';
import { initial, readProgress, type Progress } from '@/lib/preferences';

type Card = { id: string; lesson: number; word: string; reading: string; romaji: string; meaningVi: string; partOfSpeech: string; audioPath: string | null; audioSource?: string | null };
type Lesson = { id: number; count: number; audioCount: number };
const storageKey = 'minna-play-v1';
const titles = ['Lời chào đầu tiên', 'Những vật quanh ta', 'Ở đây, ở đó', 'Một ngày của bạn', 'Đi đâu cùng nhau?', 'Những việc hằng ngày', 'Trao đi, nhận lại', 'Thế giới sắc màu', 'Điều bạn yêu thích', 'Có gì ở đó?'];
function shuffle<Value,>(items: Value[]) { return [...items].sort(() => Math.random() - 0.5); }
function Cat({ small = false }: { small?: boolean }) {
  return <svg className={small ? 'cat small' : 'cat'} viewBox="0 0 240 220" fill="none" aria-hidden="true"><ellipse cx="122" cy="202" rx="75" ry="10" fill="#D9D0ED"/><path d="M66 101L52 28Q52 15 67 25L104 52M139 52L179 24Q190 18 187 35L179 106" fill="#FFE2A8" stroke="#49364D" strokeWidth="5" strokeLinejoin="round"/><path d="M65 100Q47 52 114 53Q191 47 186 114L193 173Q190 204 124 201Q57 203 53 173Z" fill="#FFE9BC" stroke="#49364D" strokeWidth="5"/><path d="M66 44L71 71L88 60M171 43L153 60L174 70" fill="#F7B6B7"/><ellipse cx="86" cy="113" rx="5" ry="7" fill="#49364D"/><ellipse cx="151" cy="113" rx="5" ry="7" fill="#49364D"/><path d="M113 125L119 130L125 125M119 130Q112 142 105 133M119 130Q126 142 133 133" stroke="#49364D" strokeWidth="4" strokeLinecap="round"/><ellipse cx="73" cy="129" rx="12" ry="7" fill="#F6B7B4"/><ellipse cx="166" cy="129" rx="12" ry="7" fill="#F6B7B4"/><path d="M84 175L79 150L120 160L160 150L155 181L120 192Z" fill="#A18AE9" stroke="#49364D" strokeWidth="4"/><path d="M120 161V190" stroke="#49364D" strokeWidth="3"/><path d="M64 160Q84 144 88 165M174 159Q154 144 151 166" stroke="#49364D" strokeWidth="5" strokeLinecap="round"/></svg>;
}

export default function StudyApp() {
  const [view, setView] = useState<'home' | 'vocabulary' | 'kana'>('home');
  const [progress, setProgress] = useState<Progress>(initial);
  const [ready, setReady] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [random, setRandom] = useState(true);
  const { script, composite } = progress.kana;
  const groupMode = composite ? 'composite' : 'single';
  const selectedGroups = progress.kana.selected[script][groupMode];
  function setScript(value: 'hiragana' | 'katakana') {
    setProgress(previous => ({ ...previous, kana: { ...previous.kana, script: value } }));
  }
  function setComposite(value: boolean) {
    setProgress(previous => ({ ...previous, kana: { ...previous.kana, composite: value } }));
  }
  function setSelectedGroups(value: string[] | ((previous: string[]) => string[])) {
    setProgress(previous => {
      const selection = previous.kana.selected[script];
      const groups = typeof value === 'function' ? value(selection[groupMode]) : value;
      return { ...previous, kana: { ...previous.kana, selected: { ...previous.kana.selected, [script]: { ...selection, [groupMode]: groups } } } };
    });
  }
  const [queue, setQueue] = useState<Kana[]>([]);
  const [kanaIndex, setKanaIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'wrong' | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [kanaActive, setKanaActive] = useState(false);
  const [kanaDone, setKanaDone] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const kanaAccepted = useRef(false);
  const currentCard = cards[cardIndex];
  const currentKana = queue[kanaIndex];
  const kana = getKana(script, composite);
  const availableGroups = [...new Set(kana.map(item => item.group))];
  const totalWords = lessons.reduce((total, lesson) => total + lesson.count, 0);

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); setProgress(readProgress(saved)); } catch { }
    setReady(true);
    fetch('/data/lessons.json').then(response => { if (!response.ok) throw Error(); return response.json(); }).then(setLessons).catch(() => setError('Chưa tải được danh sách bài. Hãy tải lại trang.'));
    return () => { audio.current?.pause(); };
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { setError('Trình duyệt không cho phép lưu tiến độ. Bạn vẫn có thể học trong phiên này.'); } } }, [progress, ready]);
  function play(card: Card) { audio.current?.pause(); if (!card.audioPath) return; audio.current = new Audio(card.audioPath); audio.current.play().catch(() => setError('Không phát được âm thanh. Hãy thử lại.')); }
  function navigate(next: typeof view) { audio.current?.pause(); setView(next); setFlashActive(false); setKanaActive(false); setKanaDone(false); setError(''); }
  async function startFlash() {
    if (!progress.selected.length) return;
    setBusy(true); setError('');
    try {
      const loaded: Card[][] = await Promise.all(progress.selected.map(async lesson => { const response = await fetch(`/data/lesson-${lesson}.json`); if (!response.ok) throw Error(); return response.json(); }));
      const pool = loaded.flat();
      if (!pool.length) { setError('Bài đã chọn chưa có từ vựng.'); return; }
      setCards(random ? shuffle(pool) : pool); setCardIndex(0); setFlipped(false); setFlashActive(true);
    } catch { setError('Không tải được từ vựng. Hãy thử lại.'); } finally { setBusy(false); }
  }
  function moveCard(direction: number) {
    const nextIndex = cardIndex + direction;
    if (nextIndex < 0 || nextIndex >= cards.length) return;
    audio.current?.pause();
    setCardIndex(nextIndex);
    setFlipped(false);
  }
  useEffect(() => {
    if (!flashActive) return;
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.altKey || event.ctrlKey || event.metaKey || target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) setFlipped(previous => !previous);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!event.repeat && currentCard) play(currentCard);
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = cardIndex + direction;
        if (nextIndex >= 0 && nextIndex < cards.length) {
          audio.current?.pause();
          setCardIndex(nextIndex);
          setFlipped(false);
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flashActive, cardIndex, cards.length]);
  function startKana(pool = kana.filter(item => selectedGroups.includes(item.group))) { if (!pool.length) return; kanaAccepted.current = false; setQueue(shuffle(pool)); setKanaIndex(0); setAnswer(''); setFeedback(null); setHintVisible(false); setMistakes([]); setKanaActive(true); setKanaDone(false); }
  function advanceKana() { setAnswer(''); setFeedback(null); setHintVisible(false); if (kanaIndex + 1 >= queue.length) { setKanaActive(false); setKanaDone(true); } else setKanaIndex(previous => previous + 1); }
  useEffect(() => {
    kanaAccepted.current = false;
    if (kanaActive && feedback === null) input.current?.focus();
  }, [kanaActive, kanaIndex, feedback]);
  function markMistake() { setMistakes(previous => [...new Set([...previous, currentKana.id])]); }
  function updateKanaAnswer(value: string) {
    if (!currentKana || kanaAccepted.current) return;
    setAnswer(value);
    const normalized = value.trim().toLowerCase();
    if (currentKana.answers.includes(normalized)) {
      kanaAccepted.current = true;
      advanceKana();
    } else if (normalized && !currentKana.answers.some(candidate => candidate.startsWith(normalized))) {
      markMistake();
      setFeedback('wrong');
    } else setFeedback(null);
  }
  function toggleKanaHint() {
    if (kanaAccepted.current) return;
    if (!hintVisible) markMistake();
    setHintVisible(previous => !previous);
    input.current?.focus();
  }
  useEffect(() => {
    if (!kanaActive) return;
    function handleHintKey(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      if (!event.repeat) toggleKanaHint();
    }
    window.addEventListener('keydown', handleHintKey);
    return () => window.removeEventListener('keydown', handleHintKey);
  }, [kanaActive, hintVisible, currentKana]);

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('home'); }}><span className="brand-icon">あ</span><span>minna<span className="brand-play">play</span><small>TIẾNG NHẬT, THẬT VUI!</small></span></a><nav aria-label="Điều hướng chính">{([{ id: 'home', name: 'Góc học tập', icon: Home }, { id: 'vocabulary', name: 'Flashcard từ vựng', icon: Layers }, { id: 'kana', name: 'Luyện bảng chữ', icon: BookOpen }] as const).map(item => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={21}/><span>{item.name}</span></button>)}</nav><div className="sidebar-note"><Cat small/><strong>Mỗi ngày một chút,<br/>tiến bộ một thật nhiều!</strong><p>Cùng mình học tiếng Nhật nhé.</p></div><span className="sidebar-footer">Made for your little wins.</span></aside>
    <main id="main"><header className="topbar"><span>Góc nhỏ học tiếng Nhật <span className="topbar-jp">日本語を楽しもう</span></span></header>
      {error && <div role="status" className="notice">{error}<button aria-label="Đóng thông báo" onClick={() => setError('')}><X size={16}/></button></div>}
      {view === 'home' && <><section className="welcome"><div><div className="eyebrow"><Sparkles size={15}/> MỖI NGÀY MỘT CHÚT TIẾNG NHẬT</div><h1>Chào bạn,<br/>hôm nay mình học gì?</h1><p>Một từ mới, một bước nhỏ.<br/>Cùng biến tiếng Nhật thành niềm vui mỗi ngày.</p><button className="button primary" onClick={() => navigate('vocabulary')}>Bắt đầu học nào <ArrowRight size={19}/></button></div><div className="welcome-art"><span className="floating-label label-one">こんにちは!</span><span className="spark spark-one">✦</span><Cat/><span className="floating-label label-two">いっしょに がんばろう</span><span className="spark spark-two">✧</span></div></section>
      <section className="stats" aria-label="Tiến độ học"><div><span className="stat-icon mint"><Check/></span><span><strong>{totalWords}</strong><small>Từ vựng sẵn sàng</small></span></div><div><span className="stat-icon lavender"><BookOpen/></span><span><strong>{lessons.length}<em> / 25</em></strong><small>Bài học sẵn sàng</small></span></div><div><span className="stat-icon peach"><Headphones/></span><span><strong>Từng bước nhỏ</strong><small>Học theo nhịp của bạn</small></span></div></section>
      <div className="section-title"><div><h2>Chọn hành trình của bạn</h2><p>Học một chút thôi, nhưng nhớ thật lâu.</p></div><span className="handwritten">Let’s do this! ↙</span></div><section className="journeys"><button className="journey vocabulary-journey" onClick={() => navigate('vocabulary')}><span className="journey-art"><span className="mini-card back-card">あ</span><span className="mini-card front-card">猫<small>ねこ · con mèo</small></span></span><span className="pill">MINNA NO NIHONGO</span><h3>Lật thẻ, nhớ từ</h3><p>Từ vựng theo từng bài, có nghĩa tiếng Việt<br/>và âm thanh để luyện phát âm.</p><span className="journey-link">Học flashcard <ArrowRight size={19}/></span></button><button className="journey kana-journey" onClick={() => navigate('kana')}><span className="journey-art kana-art"><span>あ</span><span>ア</span><i>✦</i></span><span className="pill">HIRAGANA & KATAKANA</span><h3>Làm quen bảng chữ</h3><p>Chọn nhóm chữ, nhập romaji.<br/>Tự tin đọc tiếng Nhật từ những nét đầu tiên.</p><span className="journey-link">Luyện bảng chữ <ArrowRight size={19}/></span></button></section><div className="bottom-tip"><Sparkles size={20}/><p><strong>Mẹo nhỏ:</strong> Chỉ cần 10 phút mỗi ngày. Đều đặn quan trọng hơn thật nhiều!</p><span>がんばって!</span></div></>}
      {view === 'vocabulary' && <><PageHeading tag="MINNA NO NIHONGO" title="Lật một thẻ, nhớ một từ." description="Chọn bài yêu thích và bắt đầu hành trình từ vựng."/>{flashActive && currentCard ? <section className="practice"><div className="practice-top"><button className="text-button" onClick={() => { audio.current?.pause(); setFlashActive(false); }}><ArrowLeft size={17}/> Chọn bài</button><span>Bài {currentCard.lesson} · {cardIndex + 1} / {cards.length}</span></div><ProgressBar value={cardIndex} total={cards.length}/><div className="flashcard-stage">
              <div className={`flashcard-flipper ${flipped ? 'is-flipped' : ''}`}>
                <div className="flashcard-face flashcard-front" aria-hidden={flipped} inert={flipped}>
                  <button className="flashcard-flip-area" onClick={() => setFlipped(true)} aria-label="Lật thẻ xem nghĩa">
                  <span className="pill">TỪ VỰNG TIẾNG NHẬT</span>
                  <span className="card-content"><span className="japanese-word" lang="ja">{currentCard.word}</span>{/\p{Script=Han}/u.test(currentCard.word) && currentCard.reading && currentCard.reading !== currentCard.word && <span className="front-reading" lang="ja">{currentCard.reading}</span>}</span>
                  <span className="flip-hint"><RotateCcw size={16}/> Nhấn vào thẻ hoặc Space để lật</span>
                  </button>
                  <button className="card-audio-button" disabled={!currentCard.audioPath} onClick={() => play(currentCard)} aria-label={currentCard.audioPath ? (currentCard.audioSource === 'edge-tts' ? 'Nghe phát âm (giọng tổng hợp)' : 'Nghe phát âm') : 'Chưa có âm thanh'} title={currentCard.audioPath ? (currentCard.audioSource === 'edge-tts' ? 'Nghe phát âm (giọng tổng hợp)' : 'Nghe phát âm') : 'Chưa có âm thanh'}><Volume2 size={21}/></button>
                </div>
                <div className="flashcard-face flashcard-back" aria-hidden={!flipped} inert={!flipped}>
                  <button className="flashcard-flip-area" onClick={() => setFlipped(false)} aria-label="Lật thẻ về từ tiếng Nhật">
                  <span className="pill">CÙNG GHI NHỚ NHÉ</span>
                  <span className="card-content"><span lang="ja" className="reading">{currentCard.reading || currentCard.word}</span><span className="romaji">{currentCard.romaji}</span><strong className="meaning">{currentCard.meaningVi}</strong><span className="card-part">{currentCard.partOfSpeech}</span></span>
                  <span className="flip-hint"><RotateCcw size={16}/> Nhấn để xem lại từ tiếng Nhật</span>
                  </button>
                  <button className="card-audio-button" disabled={!currentCard.audioPath} onClick={() => play(currentCard)} aria-label={currentCard.audioPath ? (currentCard.audioSource === 'edge-tts' ? 'Nghe phát âm (giọng tổng hợp)' : 'Nghe phát âm') : 'Chưa có âm thanh'} title={currentCard.audioPath ? (currentCard.audioSource === 'edge-tts' ? 'Nghe phát âm (giọng tổng hợp)' : 'Nghe phát âm') : 'Chưa có âm thanh'}><Volume2 size={21}/></button>
                </div>
              </div>
            </div>
            <div className="card-navigation"><button className="button secondary" disabled={cardIndex === 0} onClick={() => moveCard(-1)} aria-label="Thẻ trước"><ArrowLeft size={21}/></button><span aria-live="polite">{cardIndex + 1} / {cards.length}</span><button className="button primary" disabled={cardIndex === cards.length - 1} onClick={() => moveCard(1)} aria-label="Thẻ tiếp theo"><ArrowRight size={21}/></button></div>
            <p className="keyboard-hint"><kbd>↑</kbd> nghe phát âm <span>·</span> <kbd>Space</kbd> lật thẻ <span>·</span> <kbd>←</kbd> <kbd>→</kbd> chuyển thẻ</p>
          </section> : <><div className="selection-toolbar"><strong>{progress.selected.length} bài đã chọn</strong><button className="text-button" onClick={() => setProgress(previous => ({ ...previous, selected: previous.selected.length === lessons.length ? [] : lessons.map(lesson => lesson.id) }))}>{progress.selected.length === lessons.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button></div><div className="lesson-grid">{lessons.map(lesson => <button key={lesson.id} aria-pressed={progress.selected.includes(lesson.id)} className={`lesson-card tone-${(lesson.id - 1) % 4} ${progress.selected.includes(lesson.id) ? 'selected' : ''}`} onClick={() => setProgress(previous => ({ ...previous, selected: previous.selected.includes(lesson.id) ? previous.selected.filter(id => id !== lesson.id) : [...previous.selected, lesson.id] }))}><span className="lesson-number">{String(lesson.id).padStart(2, '0')}</span><span className="selection-check">{progress.selected.includes(lesson.id) && <Check size={15}/>}</span><h3>{titles[lesson.id - 1] || `Bài ${lesson.id}`}</h3><p>{lesson.count} từ vựng · {lesson.audioCount} audio</p></button>)}</div><div className="start-panel"><label><input type="checkbox" checked={random} onChange={event => setRandom(event.target.checked)}/> Trộn ngẫu nhiên</label><button className="button primary" disabled={busy || !progress.selected.length} onClick={() => startFlash()}>{busy ? 'Đang tải…' : 'Bắt đầu học'}<ArrowRight size={18}/></button></div><p className="subtle-note">Hiện có {lessons.length} bài. Các bài tiếp theo sẽ xuất hiện khi dữ liệu được bổ sung.</p></>}</>}
      {view === 'kana' && <><PageHeading tag="TỪ NHỮNG NÉT ĐẦU TIÊN" title="Chữ nhỏ, niềm vui lớn." description="Làm quen từng nhóm chữ, tự tin hơn mỗi ngày."/>{kanaActive && currentKana ? <section className="practice"><div className="practice-top"><button className="text-button" onClick={() => { setKanaActive(false); }}><ArrowLeft size={17}/> Chọn nhóm</button><span>{kanaIndex + 1} / {queue.length} · {mistakes.length} chữ cần ôn</span></div><ProgressBar value={kanaIndex} total={queue.length}/><div className={`kana-question ${feedback || ''}`}>
<div className="kana-question-header"><span className="pill">CHỮ NÀY ĐỌC LÀ GÌ?</span><button type="button" className="kana-hint-button" onClick={toggleKanaHint} aria-pressed={hintVisible} aria-controls="kana-hint-card" aria-keyshortcuts="Space" title="Space để bật hoặc tắt gợi ý">{hintVisible ? 'Ẩn gợi ý' : 'Gợi ý'}</button></div>
<div className="kana-flip-stage" id="kana-hint-card"><div key={currentKana.id} className={`kana-flipper ${hintVisible ? 'is-flipped' : ''}`}><div className="kana-letter-face" aria-hidden={hintVisible}><span className="big-kana" lang="ja">{currentKana.character}</span></div><div className="kana-letter-face kana-romaji-face" aria-hidden={!hintVisible}><span className="hint-romaji">{currentKana.answers.join(' / ')}</span></div></div></div>
<form onSubmit={event => event.preventDefault()}><label htmlFor="romaji">Nhập cách đọc romaji</label><input ref={input} autoFocus id="romaji" value={answer} onChange={event => { if ((event.nativeEvent as InputEvent).isComposing) setAnswer(event.target.value); else updateKanaAnswer(event.target.value); }} onCompositionEnd={event => updateKanaAnswer(event.currentTarget.value)} autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="Nhập romaji" aria-invalid={feedback === 'wrong'} aria-describedby="answer-feedback"/><div id="answer-feedback" className="answer-feedback" role="status">{feedback === 'wrong' ? 'Chưa đúng rồi, thử lại nhé!' : ''}</div></form></div></section> : kanaDone ? <Result title="Một lượt luyện thật tuyệt!" description={`${queue.length - mistakes.length}/${queue.length} chữ đúng ngay lần đầu · Độ chính xác ${Math.round((queue.length - mistakes.length) / queue.length * 100)}%.`} onBack={() => setKanaDone(false)} extra={mistakes.length ? <button className="button primary" onClick={() => startKana(queue.filter(item => mistakes.includes(item.id)))}>Luyện lại {mistakes.length} chữ sai</button> : undefined}/> : <><div className="kana-options"><div className="segmented">{(['hiragana', 'katakana'] as const).map(value => <button key={value} aria-pressed={script === value} className={script === value ? 'active' : ''} onClick={() => setScript(value)}>{value === 'hiragana' ? 'あ Hiragana' : 'ア Katakana'}</button>)}</div><div className="segmented"><button className={!composite ? 'active' : ''} onClick={() => { setComposite(false); }}>Chữ đơn</button><button className={composite ? 'active' : ''} onClick={() => { setComposite(true); }}>Âm ghép</button></div></div><div className="selection-toolbar"><strong>Chọn nhóm bạn muốn luyện</strong><button className="text-button" onClick={() => setSelectedGroups(availableGroups.every(group => selectedGroups.includes(group)) ? [] : availableGroups)}>Chọn / bỏ tất cả</button></div><div className="kana-grid">{availableGroups.map(group => <button key={group} className={`kana-group ${selectedGroups.includes(group) ? 'selected' : ''}`} aria-pressed={selectedGroups.includes(group)} onClick={() => setSelectedGroups(previous => previous.includes(group) ? previous.filter(id => id !== group) : [...previous, group])}><span className="kana-group-heading">Nhóm {group}<span className="selection-check">{selectedGroups.includes(group) && <Check size={14}/>}</span></span><span className="kana-group-letters">{kana.filter(item => item.group === group).map(item => <span key={item.id}><b lang="ja">{item.character}</b><small>{item.answers[0]}</small></span>)}</span></button>)}</div><div className="start-panel"><span><strong>{kana.filter(item => selectedGroups.includes(item.group)).length}</strong> chữ đã chọn</span><button className="button primary" disabled={!kana.some(item => selectedGroups.includes(item.group))} onClick={() => startKana()}>Bắt đầu luyện<ArrowRight size={18}/></button></div><p className="subtle-note">Chấp nhận các cách viết như shi / si, chi / ti, tsu / tu. を được luyện là wo.</p></>}</>}
      <footer>Chậm một chút cũng được, miễn là bạn vẫn bước tiếp. <span>一歩ずつ。</span></footer>
    </main></div>;
}
function PageHeading({ tag, title, description }: { tag: string; title: string; description: string }) { return <div className="page-heading"><span className="eyebrow">{tag}</span><h1>{title}</h1><p>{description}</p></div>; }
function ProgressBar({ value, total }: { value: number; total: number }) { return <div className="progress-track" role="progressbar" aria-label="Tiến độ học" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><span style={{ width: `${total ? value / total * 100 : 0}%` }}/></div>; }
function Result({ title, description, onBack, extra }: { title: string; description: string; onBack: () => void; extra?: React.ReactNode }) { return <section className="result"><Cat/><h2>{title}</h2><p>{description}</p><div className="result-actions">{extra}<button className="button secondary" onClick={onBack}>Quay lại lựa chọn<ArrowLeft size={18}/></button></div></section>; }
