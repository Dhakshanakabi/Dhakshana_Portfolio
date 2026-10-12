require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'dhakshanabalsan@gmail.com';
const RESUME = path.join(__dirname, 'public', 'assets', 'Dhakshana_CV.pdf');

app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- Download counter ----------
   Uses Upstash Redis (free) when UPSTASH_REDIS_REST_URL / _TOKEN are set (recommended for
   hosting, because free hosts wipe local files). Falls back to a local JSON file. */
const COUNT_FILE = path.join(__dirname, 'data', 'downloads.json');
const upstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'resume_downloads';

async function redis(cmd) {
  const r = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/${cmd}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
  });
  const j = await r.json();
  return Number(j.result) || 0;
}
function readFile() {
  try { return JSON.parse(fs.readFileSync(COUNT_FILE, 'utf8')).count || 0; } catch { return 0; }
}
async function getCount() { return upstash ? redis(`get/${KEY}`) : readFile(); }
async function incCount() {
  if (upstash) return redis(`incr/${KEY}`);
  const c = readFile() + 1;
  fs.mkdirSync(path.dirname(COUNT_FILE), { recursive: true });
  fs.writeFileSync(COUNT_FILE, JSON.stringify({ count: c }));
  return c;
}

app.get('/api/downloads', async (_req, res) => {
  try { res.json({ count: await getCount() }); } catch { res.json({ count: 0 }); }
});

// Count one download per IP per hour so refreshing/spamming can't inflate the number.
const recent = new Map();
app.get('/download-resume', async (req, res) => {
  const ip = req.ip;
  const last = recent.get(ip) || 0;
  if (Date.now() - last > 60 * 60 * 1000) {
    recent.set(ip, Date.now());
    try { await incCount(); } catch (e) { console.error('counter error', e.message); }
  }
  res.download(RESUME, 'Dhakshana_Kabi_CV.pdf');
});

/* ---------- Contact form -> email ---------- */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: (process.env.SMTP_PORT || '465') === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

app.post('/api/contact', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: 'Too many messages. Please try again later.' } }), async (req, res) => {
  const { name = '', email = '', message = '', website = '' } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot: bots fill this hidden field
  if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.trim().length < 5)
    return res.status(400).json({ ok: false, error: 'Please fill in a valid name, email and message.' });
  if (name.length > 100 || email.length > 150 || message.length > 3000)
    return res.status(400).json({ ok: false, error: 'Input too long.' });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[DEV – SMTP not configured] Message received:', { name, email, message });
    return res.json({ ok: true, dev: true });
  }
  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to: OWNER_EMAIL,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`,
      subject: `New portfolio message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<h2>New portfolio message</h2><p><b>Name:</b> ${esc(name)}</p><p><b>Email:</b> ${esc(email)}</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('mail error', e.message);
    res.status(500).json({ ok: false, error: 'Could not send the message right now. Please email me directly.' });
  }
});

app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`));
