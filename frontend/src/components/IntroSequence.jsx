import React, { useEffect, useMemo, useRef, useState } from 'react';

const BOOT_LINES = [
  '> BOOTING KRYPTON ACTIVE-DEFENSE KERNEL...',
  '> LOADING TIKTOKEN PRE-FLIGHT HEURISTICS... OK',
  '> ESTABLISHING ENCRYPTED PROXY LAYER... OK',
  '> OWASP LLM10 SHIELD MODULE... ONLINE',
  '> GATEWAY SIGNATURE VERIFIED...',
];

const LOGO_MAIN = 'KRYPTON';
const LOGO_SUB = '// GATEWAY';
const MAIN_CHARS = LOGO_MAIN.split('');
const SUB_CHARS = LOGO_SUB.split('');
const TOTAL_CHARS = MAIN_CHARS.length + SUB_CHARS.length;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>/\\[]{}';

// Stage boundaries in ms elapsed since mount. A single rAF loop derives the
// current stage from elapsed time each frame instead of chaining setTimeouts,
// so a main-thread stall (e.g. the dashboard mounting underneath) can't make
// stage transitions drift or bunch up — the next frame just recomputes the
// correct stage for wherever the clock actually is.
const STAGE_AT = { converge: 1500, shield: 1800, decode: 2700, hold: 3600, wipe: 4300, done: 5000 };
const DECODE_MS_PER_CHAR = 45;

function randomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

function stageForElapsed(elapsed) {
  if (elapsed >= STAGE_AT.wipe) return 'wipe';
  if (elapsed >= STAGE_AT.hold) return 'hold';
  if (elapsed >= STAGE_AT.decode) return 'decode';
  if (elapsed >= STAGE_AT.shield) return 'shield';
  if (elapsed >= STAGE_AT.converge) return 'converge';
  return 'boot';
}

function DecodedText({ chars, offset, lockCount, colorClass }) {
  return chars.map((ch, i) => {
    const gi = offset + i;
    if (ch === ' ') {
      return <span key={gi} className="intro-letter">&nbsp;</span>;
    }
    const locked = lockCount > gi;
    return (
      <span
        key={gi}
        className={locked ? `intro-letter intro-letter-locked ${colorClass}` : 'intro-letter intro-letter-scramble'}
      >
        {locked ? ch : randomChar()}
      </span>
    );
  });
}

export default function IntroSequence({ onComplete }) {
  // boot -> converge -> shield -> decode -> hold -> wipe -> done
  const [stage, setStage] = useState('boot');
  const [skipping, setSkipping] = useState(false);
  const [lockCount, setLockCount] = useState(0);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }).map(() => ({
        dx: (Math.random() - 0.5) * 640,
        dy: (Math.random() - 0.5) * 640,
        delay: Math.random() * 0.18,
      })),
    []
  );

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const rafRef = useRef(null);
  const skippedRef = useRef(false);

  useEffect(() => {
    const t0 = performance.now();

    const tick = () => {
      if (skippedRef.current) return;
      const elapsed = performance.now() - t0;
      const next = stageForElapsed(elapsed);

      setStage((prev) => (prev === next ? prev : next));

      if (elapsed >= STAGE_AT.decode) {
        const count = Math.min(TOTAL_CHARS, Math.floor((elapsed - STAGE_AT.decode) / DECODE_MS_PER_CHAR));
        setLockCount((prev) => (prev === count ? prev : count));
      }

      if (elapsed >= STAGE_AT.done) {
        onCompleteRef.current?.();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleSkip = () => {
    if (skipping) return;
    setSkipping(true);
    skippedRef.current = true;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setLockCount(TOTAL_CHARS);
    setStage('wipe');
    setTimeout(() => onCompleteRef.current?.(), 700);
  };

  const showParticles = stage === 'converge' || stage === 'shield';
  const showShield = stage === 'shield' || stage === 'decode' || stage === 'hold' || stage === 'wipe';
  const showLogo = stage === 'decode' || stage === 'hold' || stage === 'wipe';
  const holding = stage === 'hold';
  const wiping = stage === 'wipe';

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[200] bg-black overflow-hidden cursor-pointer select-none ${wiping ? 'intro-iris-out' : ''}`}
    >
      {/* Tron-style perspective grid floor */}
      <div className="intro-grid-3d-wrap absolute inset-0 overflow-hidden pointer-events-none">
        <div className="intro-grid-3d">
          <div className="intro-grid-3d-scroll" />
        </div>
      </div>

      {/* ambience */}
      <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-ember/10 via-ember/0 to-transparent intro-scanline pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-ember/10 blur-[150px] rounded-full pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.9) 100%)' }}
      />

      {/* boot terminal */}
      {stage === 'boot' && (
        <div className="absolute top-10 left-10 font-mono text-xs md:text-sm text-ember/90 space-y-2">
          {BOOT_LINES.map((line, i) => (
            <div
              key={i}
              className="intro-line"
              style={{ animationDelay: `${i * 0.26}s`, animationFillMode: 'backwards' }}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* centerpiece: converge particles + shield + shockwave rings + logo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        {showShield && (
          <div className="intro-punch relative flex items-center justify-center w-28 h-28">
            {showParticles && (
              <div className="absolute inset-0 pointer-events-none">
                {particles.map((p, i) => (
                  <span
                    key={i}
                    className="intro-particle absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-ember"
                    style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, animationDelay: `${p.delay}s` }}
                  />
                ))}
              </div>
            )}

            {(stage === 'shield' || stage === 'decode') && (
              <>
                <span className="intro-ring absolute inset-0 rounded-full border border-ember" style={{ animationDelay: '0s' }} />
                <span className="intro-ring absolute inset-0 rounded-full border border-ember" style={{ animationDelay: '0.25s' }} />
                <span className="intro-ring absolute inset-0 rounded-full border border-ember" style={{ animationDelay: '0.5s' }} />
              </>
            )}

            <div className="intro-shield-glow absolute inset-0 bg-ember rounded-full blur-2xl" />

            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <path
                d="M12 2 L20 5.5 V11.5 C20 16.5 16.5 20.5 12 22 C7.5 20.5 4 16.5 4 11.5 V5.5 L12 2 Z"
                stroke="#e8602e"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                className="intro-shield-path"
              />
              <path
                d="M8.5 12 L11 14.5 L15.5 9.5"
                stroke="#ff8a5c"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                className="intro-shield-path"
                style={{ animationDelay: '0.5s' }}
              />
            </svg>
          </div>
        )}

        {showLogo && (
          <div className="text-center">
            <h1
              className={`font-display font-bold text-4xl md:text-6xl tracking-[0.03em] flex justify-center flex-wrap ${
                holding ? 'intro-chroma' : ''
              }`}
            >
              <DecodedText chars={MAIN_CHARS} offset={0} lockCount={lockCount} colorClass="text-white" />
              <span className="w-3 md:w-4" />
              <DecodedText
                chars={SUB_CHARS}
                offset={MAIN_CHARS.length}
                lockCount={lockCount}
                colorClass="text-ember"
              />
            </h1>

            <p
              className="intro-subtitle mt-4 text-ember/80 font-mono text-[10px] md:text-xs uppercase opacity-0"
              style={{ animationDelay: '0.75s', animationFillMode: 'forwards' }}
            >
              System: Protected · Active-Defense Engine Online
            </p>
          </div>
        )}
      </div>

      {holding && <div className="intro-flash absolute inset-0 bg-ember pointer-events-none" />}
      {wiping && <div className="intro-portal-ring pointer-events-none" />}

      <div className="intro-skip absolute bottom-6 right-8 font-mono text-[10px] text-gray-600 hover:text-ember uppercase tracking-widest">
        Click to skip &rarr;
      </div>
    </div>
  );
}
