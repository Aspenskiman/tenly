/**
 * Tenly Marketing Site Builder
 * Reads the 5 brand PNGs and writes a standalone index.html
 * with all images embedded as base64 data URIs.
 */

const fs   = require('fs');
const path = require('path');

function b64(file) {
  return fs.readFileSync(path.join(__dirname, file)).toString('base64');
}

const imgs = {
  hero:          `data:image/png;base64,${b64('hero.png')}`,
  question:      `data:image/png;base64,${b64('question.png')}`,
  score:         `data:image/png;base64,${b64('score.png')}`,
  lean:          `data:image/png;base64,${b64('lean.png')}`,
  constellation: `data:image/png;base64,${b64('constellation.png')}`,
};

const html = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Tenly gives leaders a simple, shared language for human connection. One number. After every 1:1. Before it's too late." />
  <title>Tenly — Stop asking "How are you doing?"</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }

    /* ── Tokens ── */
    :root {
      --dark:    #07070E;
      --dark-2:  #0D0D1A;
      --indigo:  #6366F1;
      --indigo-d:#4F46E5;
      --amber:   #F59E0B;
      --amber-d: #D97706;
      --text:    #E2E8F0;
      --muted:   rgba(226,232,240,0.52);
      --border:  rgba(99,102,241,0.18);

      --font-serif: Georgia, 'Times New Roman', 'Noto Serif', serif;
      --font-sans:  -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Base ── */
    body {
      background: var(--dark);
      color: var(--text);
      font-family: var(--font-serif);
      line-height: 1.6;
      overflow-x: hidden;
    }
    img { display: block; max-width: 100%; }
    a   { color: inherit; text-decoration: none; }

    /* ── Nav ── */
    .nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 48px;
      height: 68px;
      background: rgba(7,7,14,0.82);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border);
    }
    .nav-logo {
      font-family: var(--font-sans);
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .nav-logo span { color: var(--amber); }
    .nav-links {
      display: flex;
      gap: 36px;
      font-family: var(--font-sans);
      font-size: 14px;
      color: var(--muted);
      list-style: none;
    }
    .nav-links a:hover { color: var(--text); transition: color .2s; }
    .nav-cta {
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 600;
      padding: 9px 22px;
      background: var(--indigo);
      border-radius: 6px;
      color: #fff;
      transition: background .2s;
    }
    .nav-cta:hover { background: var(--indigo-d); }

    /* ── Hero ── */
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
      padding-top: 68px;
    }
    .hero-image {
      position: relative;
      overflow: hidden;
    }
    .hero-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
    .hero-image::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent 70%, var(--dark) 100%);
    }
    .hero-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px 64px 80px 56px;
      background: var(--dark);
    }
    .hero-eyebrow {
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--amber);
      margin-bottom: 24px;
    }
    .hero-headline {
      font-size: clamp(36px, 4vw, 58px);
      font-weight: 400;
      line-height: 1.12;
      letter-spacing: -1px;
      color: #fff;
      margin-bottom: 20px;
    }
    .hero-headline em {
      font-style: italic;
      color: var(--muted);
    }
    .hero-sub {
      font-size: clamp(28px, 3vw, 42px);
      font-weight: 400;
      line-height: 1.2;
      color: var(--amber);
      margin-bottom: 28px;
      letter-spacing: -0.5px;
    }
    .hero-body {
      font-size: 17px;
      color: var(--muted);
      line-height: 1.75;
      max-width: 420px;
      margin-bottom: 44px;
    }
    .hero-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    .btn-primary {
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 600;
      padding: 14px 32px;
      background: var(--amber);
      color: var(--dark);
      border-radius: 6px;
      transition: background .2s, transform .15s;
    }
    .btn-primary:hover { background: var(--amber-d); transform: translateY(-1px); }
    .btn-ghost {
      font-family: var(--font-sans);
      font-size: 15px;
      font-weight: 400;
      color: var(--muted);
      padding: 14px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: color .2s;
    }
    .btn-ghost:hover { color: var(--text); }
    .btn-ghost::after { content: '↓'; font-size: 16px; }
    .hero-note {
      margin-top: 32px;
      font-family: var(--font-sans);
      font-size: 12px;
      color: rgba(226,232,240,0.28);
    }

    /* ── The Question ── */
    .section-question {
      position: relative;
      min-height: 560px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .section-question .bg-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
    .section-question .overlay {
      position: absolute;
      inset: 0;
      background: rgba(7,7,14,0.55);
    }
    .section-question .content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 80px 48px;
      max-width: 760px;
    }
    .section-label {
      font-family: var(--font-sans);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: var(--indigo);
      margin-bottom: 24px;
      display: block;
    }
    .section-headline {
      font-size: clamp(32px, 4vw, 52px);
      font-weight: 400;
      line-height: 1.15;
      letter-spacing: -0.8px;
      color: #fff;
      margin-bottom: 24px;
    }
    .section-body {
      font-size: 18px;
      color: var(--muted);
      line-height: 1.75;
      max-width: 600px;
      margin: 0 auto;
    }
    .section-body strong { color: var(--text); font-weight: 400; }

    /* ── The Score ── */
    .section-score {
      padding: 120px 80px;
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 80px;
      align-items: center;
      background: var(--dark-2);
    }
    .score-text {}
    .score-text .section-label { text-align: left; display: block; }
    .score-text .section-headline { text-align: left; margin-bottom: 28px; }
    .score-text .section-body { text-align: left; max-width: 100%; margin: 0; }
    .score-image-wrap {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08);
    }
    .score-image-wrap img { width: 100%; }
    .score-rule {
      margin: 36px 0;
      border: none;
      border-top: 1px solid var(--border);
    }
    .score-callout {
      font-family: var(--font-sans);
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
      padding: 16px 20px;
      border-left: 2px solid var(--amber);
      background: rgba(245,158,11,0.06);
      border-radius: 0 6px 6px 0;
    }
    .score-callout strong { color: var(--amber); font-weight: 600; }

    /* ── Lean In / Lean Out ── */
    .section-lean {
      padding: 120px 80px;
      background: var(--dark);
    }
    .lean-header {
      text-align: center;
      margin-bottom: 64px;
    }
    .lean-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 40px 100px rgba(0,0,0,0.5);
    }
    .lean-card {
      position: relative;
      min-height: 440px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 44px 48px;
      overflow: hidden;
    }
    .lean-card .bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* Left card shows left half of lean image */
    .lean-card.left .bg  { object-position: 0% center; }
    /* Right card shows right half */
    .lean-card.right .bg { object-position: 100% center; }

    .lean-card .card-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(7,7,14,0.88) 0%, rgba(7,7,14,0.35) 55%, transparent 100%);
    }
    .lean-card .card-content { position: relative; z-index: 2; }
    .lean-card-tag {
      font-family: var(--font-sans);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-bottom: 14px;
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
    }
    .lean-card.left .lean-card-tag  { color: var(--indigo); background: rgba(99,102,241,0.12); }
    .lean-card.right .lean-card-tag { color: var(--amber);  background: rgba(245,158,11,0.12); }
    .lean-card-headline {
      font-size: 28px;
      font-weight: 400;
      line-height: 1.2;
      color: #fff;
      margin-bottom: 12px;
      letter-spacing: -0.3px;
    }
    .lean-card-body {
      font-family: var(--font-sans);
      font-size: 14px;
      color: var(--muted);
      line-height: 1.65;
      max-width: 320px;
    }

    /* ── CTA / Constellation ── */
    .section-cta {
      position: relative;
      min-height: 600px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .section-cta .bg-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .section-cta .overlay {
      position: absolute;
      inset: 0;
      background: rgba(7,7,14,0.62);
    }
    .section-cta .content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 80px 48px;
      max-width: 680px;
    }
    .cta-headline {
      font-size: clamp(36px, 5vw, 60px);
      font-weight: 400;
      line-height: 1.1;
      letter-spacing: -1px;
      color: #fff;
      margin-bottom: 20px;
    }
    .cta-sub {
      font-size: 18px;
      color: var(--muted);
      line-height: 1.75;
      margin-bottom: 44px;
    }
    .cta-form {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .cta-input {
      font-family: var(--font-sans);
      font-size: 15px;
      padding: 14px 22px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 6px;
      color: #fff;
      width: 280px;
      outline: none;
      transition: border-color .2s;
    }
    .cta-input::placeholder { color: rgba(255,255,255,0.35); }
    .cta-input:focus { border-color: var(--indigo); }
    .cta-note {
      margin-top: 20px;
      font-family: var(--font-sans);
      font-size: 12px;
      color: rgba(226,232,240,0.28);
    }

    /* ── Social proof strip ── */
    .proof-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 48px;
      padding: 40px 80px;
      background: rgba(99,102,241,0.04);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .proof-item {
      text-align: center;
      font-family: var(--font-sans);
    }
    .proof-number {
      font-size: 28px;
      font-weight: 700;
      color: var(--amber);
      line-height: 1;
      margin-bottom: 4px;
    }
    .proof-label {
      font-size: 12px;
      color: var(--muted);
      letter-spacing: 0.3px;
    }
    .proof-divider {
      width: 1px;
      height: 40px;
      background: var(--border);
    }

    /* ── How it works ── */
    .section-how {
      padding: 120px 80px;
      background: var(--dark-2);
    }
    .how-header {
      text-align: center;
      margin-bottom: 72px;
    }
    .how-steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 48px;
      max-width: 960px;
      margin: 0 auto;
    }
    .how-step {
      text-align: center;
    }
    .how-step-number {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 700;
      color: var(--indigo);
    }
    .how-step-title {
      font-size: 20px;
      font-weight: 400;
      color: #fff;
      margin-bottom: 12px;
    }
    .how-step-body {
      font-family: var(--font-sans);
      font-size: 14px;
      color: var(--muted);
      line-height: 1.65;
    }
    .how-connector {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-top: 24px;
    }

    /* ── Footer ── */
    footer {
      padding: 48px 80px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--border);
      font-family: var(--font-sans);
      font-size: 13px;
      color: rgba(226,232,240,0.3);
      flex-wrap: wrap;
      gap: 16px;
    }
    .footer-logo {
      font-size: 16px;
      font-weight: 700;
      color: rgba(226,232,240,0.5);
    }
    .footer-logo span { color: var(--amber); }
    .footer-links {
      display: flex;
      gap: 28px;
      list-style: none;
    }
    .footer-links a:hover { color: var(--text); transition: color .2s; }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .nav { padding: 0 24px; }
      .nav-links { display: none; }

      .hero { grid-template-columns: 1fr; }
      .hero-image { min-height: 55vw; }
      .hero-content { padding: 48px 32px; }

      .section-score {
        grid-template-columns: 1fr;
        padding: 80px 32px;
        gap: 48px;
      }

      .section-lean { padding: 80px 24px; }
      .lean-cards { grid-template-columns: 1fr; }
      .lean-card { min-height: 360px; }

      .section-question .content { padding: 60px 24px; }
      .section-cta .content { padding: 60px 24px; }

      .section-how { padding: 80px 32px; }
      .how-steps { grid-template-columns: 1fr; gap: 40px; }

      .proof-strip { padding: 32px 24px; gap: 24px; }
      .proof-divider { display: none; }

      footer { padding: 32px 24px; flex-direction: column; align-items: flex-start; }
    }
  </style>
</head>
<body>

<!-- ── Navigation ── -->
<nav class="nav">
  <a href="#" class="nav-logo">ten<span>.</span>ly</a>
  <ul class="nav-links">
    <li><a href="#how">How it works</a></li>
    <li><a href="#score">The score</a></li>
    <li><a href="#cta">Pricing</a></li>
    <li><a href="https://tenly-xi.vercel.app/login">Sign in</a></li>
  </ul>
  <a href="https://tenly-xi.vercel.app/register" class="nav-cta">Get started free</a>
</nav>

<!-- ── Hero ── -->
<section class="hero" id="top">
  <div class="hero-image">
    <img src="${imgs.hero}" alt="Two people in a focused 1:1 conversation, connected by a glowing seven" />
  </div>
  <div class="hero-content">
    <p class="hero-eyebrow">Leadership intelligence</p>
    <h1 class="hero-headline">
      Stop asking<br>
      <em>"How are you doing?"</em>
    </h1>
    <p class="hero-sub">Start knowing.</p>
    <p class="hero-body">
      Tenly gives leaders a simple, shared language for human connection.
      One number, logged after every 1:1. Over time, the patterns
      reveal who's thriving — and who needs you — before it's too late.
    </p>
    <div class="hero-actions">
      <a href="https://tenly-xi.vercel.app/register" class="btn-primary">Get started free</a>
      <a href="#how" class="btn-ghost">See how it works</a>
    </div>
    <p class="hero-note">No credit card required &nbsp;·&nbsp; Free for teams up to 10</p>
  </div>
</section>

<!-- ── Social Proof Strip ── -->
<div class="proof-strip">
  <div class="proof-item">
    <div class="proof-number">1–10</div>
    <div class="proof-label">One shared scale</div>
  </div>
  <div class="proof-divider"></div>
  <div class="proof-item">
    <div class="proof-number">90s</div>
    <div class="proof-label">Average log time</div>
  </div>
  <div class="proof-divider"></div>
  <div class="proof-item">
    <div class="proof-number">7</div>
    <div class="proof-label">Days to first pattern</div>
  </div>
  <div class="proof-divider"></div>
  <div class="proof-item">
    <div class="proof-number">0</div>
    <div class="proof-label">Surveys. Ever.</div>
  </div>
</div>

<!-- ── The Question ── -->
<section class="section-question" id="question">
  <img class="bg-image" src="${imgs.question}" alt="Old question vs new question" />
  <div class="overlay"></div>
  <div class="content">
    <span class="section-label">The conversation shift</span>
    <h2 class="section-headline">
      One question changes<br>the conversation.
    </h2>
    <p class="section-body">
      <strong>"How are you doing?"</strong> invites a performance.
      Everyone says fine. Nobody learns anything.
      <br><br>
      <strong>"What's your Tenly score this week?"</strong> invites honesty.
      It's specific. It's shared. It opens a real conversation
      instead of closing one.
    </p>
  </div>
</section>

<!-- ── How It Works ── -->
<section class="section-how" id="how">
  <div class="how-header">
    <span class="section-label">The system</span>
    <h2 class="section-headline" style="text-align:center">Simple enough to sustain</h2>
  </div>
  <div class="how-steps">
    <div class="how-step">
      <div class="how-step-number">1</div>
      <h3 class="how-step-title">Have the 1:1</h3>
      <p class="how-step-body">
        Ask "What's your Tenly score this week?" at the end of any 1:1.
        Listen to what comes with the number.
      </p>
    </div>
    <div class="how-step">
      <div class="how-step-number">2</div>
      <h3 class="how-step-title">Log the score</h3>
      <p class="how-step-body">
        You log it — not them. A 1–10 rating that reflects the person's
        wellbeing as you understood it from the conversation.
      </p>
    </div>
    <div class="how-step">
      <div class="how-step-number">3</div>
      <h3 class="how-step-title">See the patterns</h3>
      <p class="how-step-body">
        Over time, trends emerge. Declining scores surface before
        resignations. Rising scores confirm your investment is landing.
      </p>
    </div>
  </div>
</section>

<!-- ── The Score ── -->
<section class="section-score" id="score">
  <div class="score-text">
    <span class="section-label">The Tenly score</span>
    <h2 class="section-headline">1 to 10.<br>Nothing more.</h2>
    <p class="section-body">
      Simple enough to ask in any 1:1.
      Specific enough to mean something.
      <br><br>
      A 4 is a conversation you need to have.
      A 9 is an investment that's working.
      A 7 three weeks in a row is a trend worth noting.
    </p>
    <hr class="score-rule" />
    <div class="score-callout">
      <strong>Important:</strong> the score is always logged by the leader
      after a real conversation — never by the employee. That's not a limitation.
      That's the point.
    </div>
  </div>
  <div class="score-image-wrap">
    <img src="${imgs.score}" alt="The Tenly 1 to 10 scale with 7 highlighted in amber" />
  </div>
</section>

<!-- ── Lean In / Lean Out ── -->
<section class="section-lean" id="lean">
  <div class="lean-header">
    <span class="section-label">Two modes</span>
    <h2 class="section-headline" style="text-align:center">Know which mode you're in</h2>
    <p class="section-body" style="text-align:center;max-width:560px;margin:16px auto 0">
      Not every 1:1 calls for the same energy.
      Tenly shows you who needs your full attention — and who's already there.
    </p>
  </div>
  <div class="lean-cards">
    <div class="lean-card left">
      <img class="bg" src="${imgs.lean}" alt="Leader leaning in with urgency" />
      <div class="card-overlay"></div>
      <div class="card-content">
        <span class="lean-card-tag">Lean in</span>
        <h3 class="lean-card-headline">Some scores<br>demand attention.</h3>
        <p class="lean-card-body">
          A 4. A sudden drop from 8 to 5.
          Three weeks below 6. Tenly flags the signal
          so you can show up before it's a crisis.
        </p>
      </div>
    </div>
    <div class="lean-card right">
      <img class="bg" src="${imgs.lean}" alt="Leader in expansive, open posture" />
      <div class="card-overlay"></div>
      <div class="card-content">
        <span class="lean-card-tag">Lean back</span>
        <h3 class="lean-card-headline">Some people<br>are already thriving.</h3>
        <p class="lean-card-body">
          Consistent 8s and 9s. A steady upward trend.
          Tenly confirms what your gut already suspects —
          your investment is working.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- ── CTA / Constellation ── -->
<section class="section-cta" id="cta">
  <img class="bg-image" src="${imgs.constellation}" alt="Data lines showing one descending amber trend among four rising lines" />
  <div class="overlay"></div>
  <div class="content">
    <span class="section-label" style="color:var(--amber)">Get started today</span>
    <h2 class="cta-headline">See your team's truth.</h2>
    <p class="cta-sub">
      One number, after every 1:1. Patterns emerge.
      Problems surface early. Your job gets clearer.
    </p>
    <div class="cta-form">
      <input
        type="email"
        class="cta-input"
        placeholder="your@company.com"
        aria-label="Work email"
      />
      <a href="https://tenly-xi.vercel.app/register" class="btn-primary">
        Start free
      </a>
    </div>
    <p class="cta-note">Free forever for small teams &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; 2-minute setup</p>
  </div>
</section>

<!-- ── Footer ── -->
<footer>
  <span class="footer-logo">ten<span>.</span>ly</span>
  <ul class="footer-links">
    <li><a href="#">Privacy</a></li>
    <li><a href="#">Terms</a></li>
    <li><a href="https://tenly-xi.vercel.app/login">Sign in</a></li>
    <li><a href="https://tenly-xi.vercel.app/register">Get started</a></li>
  </ul>
  <span>© 2026 Tenly. All rights reserved.</span>
</footer>

</body>
</html>
`;

const outPath = path.join(__dirname, 'index.html');
fs.writeFileSync(outPath, html, 'utf8');

const bytes = fs.statSync(outPath).size;
console.log('✓ index.html written — ' + (bytes / 1024).toFixed(0) + ' KB (standalone, all images embedded)');
