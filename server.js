
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
const __dirname = path.resolve();
import path from 'path';
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');
const PROF_FILE = path.join(DATA_DIR, 'profiles.json');

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, JSON.stringify({ profiles: {} }, null, 2));
  if (!fs.existsSync(PROF_FILE)) fs.writeFileSync(PROF_FILE, JSON.stringify({ profiles: {} }, null, 2));
}
ensureFiles();

function readMessages() { try { return JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch { return { profiles: {} }; } }
function writeMessages(db) { fs.writeFileSync(MSG_FILE, JSON.stringify(db, null, 2)); }
function readProfiles() { try { return JSON.parse(fs.readFileSync(PROF_FILE, 'utf8')); } catch { return { profiles: {} }; } }
function writeProfiles(db) { fs.writeFileSync(PROF_FILE, JSON.stringify(db, null, 2)); }

const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const anonName = () => "anon-" + Math.random().toString(36).slice(2, 7);

const BADWORDS = [/fuck/i, /shit/i, /bitch/i, /개새/i, /씨발/i, /좆/i];
const blocked = (t)=> BADWORDS.some(re=> re.test(t));

const createLimiter = rateLimit({ windowMs: 60*1000, limit: 10 });
const askLimiter    = rateLimit({ windowMs: 10*1000, limit: 6 });

app.post('/api/create-profile', createLimiter, (req, res) => {
  const { slug, displayName, passcode } = req.body || {};
  if (!slug || !/^[a-z0-9-]{3,24}$/.test(slug)) return res.status(400).json({ error: 'invalid_slug' });
  if (!passcode || String(passcode).length < 4) return res.status(400).json({ error: 'weak_passcode' });
  const profiles = readProfiles();
  if (profiles.profiles[slug]) return res.status(409).json({ error: 'slug_taken' });
  profiles.profiles[slug] = { slug, displayName: (displayName || slug), passHash: hash(passcode), createdAt: Date.now(), ownerToken: null };
  writeProfiles(profiles);
  return res.json({ ok: true, url: `/@${slug}`, owner: `/owner/${slug}` });
});

app.get('/api/profile/:slug', (req, res) => {
  const { slug } = req.params;
  const profiles = readProfiles();
  const p = profiles.profiles[slug];
  if (!p) return res.status(404).json({ error: 'not_found' });
  res.json({ slug, displayName: p.displayName, createdAt: p.createdAt });
});

app.get('/api/messages/:slug', (req, res) => {
  const { slug } = req.params;
  const db = readMessages();
  const list = db.profiles[slug]?.messages || [];
  res.json({ messages: list.slice(-300) });
});

app.post('/api/ask/:slug', askLimiter, (req, res) => {
  const { slug } = req.params;
  const { text, nickname } = req.body || {};
  if (typeof text !== 'string') return res.status(400).json({ error: 'bad_payload' });
  const clean = text.trim().slice(0, 2000);
  if (!clean) return res.status(400).json({ error: 'empty' });
  if (blocked(clean)) return res.status(400).json({ error: 'blocked' });
  const profiles = readProfiles();
  if (!profiles.profiles[slug]) return res.status(404).json({ error: 'not_found' });

  const db = readMessages();
  if (!db.profiles[slug]) db.profiles[slug] = { messages: [] };
  const msg = { id: nanoid(10), t: Date.now(), text: clean, nick: (nickname && nickname.trim().slice(0,16)) || anonName(), role: 'ask' };
  db.profiles[slug].messages.push(msg);
  if (db.profiles[slug].messages.length > 5000) db.proices = db.profiles[slug].messages.slice(-3000);
  writeMessages(db);
  io.to(`p:${slug}`).emit('message', msg);
  res.json({ ok: true, id: msg.id });
});

app.post('/api/owner/login', (req, res) => {
  const { slug, passcode } = req.body || {};
  const profiles = readProfiles();
  const p = profiles.profiles[slug];
  if (!p) return res.status(404).json({ error: 'not_found' });
  if (p.passHash !== hash(passcode)) return res.status(403).json({ error: 'bad_passcode' });
  const token = nanoid(24);
  p.ownerToken = hash(token);
  writeProfiles(profiles);
  res.cookie('ownerToken', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

function isOwner(req, slug) {
  const token = req.cookies?.ownerToken;
  if (!token) return false;
  const profiles = readProfiles();
  const p = profiles.profiles[slug];
  if (!p?.ownerToken) return false;
  return p.ownerToken === hash(token);
}

app.post('/api/answer/:slug', (req, res) => {
  const { slug } = req.params;
  if (!isOwner(req, slug)) return res.status(403).json({ error: 'not_owner' });
  const { text } = req.body || {};
  const clean = (text || '').trim().slice(0, 4000);
  if (!clean) return res.status(400).json({ error: 'empty' });
  const db = readMessages();
  if (!db.profiles[slug]) db.profiles[slug] = { messages: [] };
  const msg = { id: nanoid(10), t: Date.now(), text: clean, nick: 'owner', role: 'answer' };
  db.profiles[slug].messages.push(msg);
  if (db.profiles[slug].messages.length > 5000) db.profiles[slug].messages = db.profiles[slug].messages.slice(-3000);
  writeMessages(db);
  io.to(`p:${slug}`).emit('message', msg);
  res.json({ ok: true, id: msg.id });
});

app.get('/@:slug', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'profile.html')));
app.get('/owner/:slug', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'owner.html')));
app.get('/', (_req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));

io.on('connection', (socket) => {
  socket.on('join_profile', ({ slug }) => { if (slug) socket.join(`p:${slug}`); });
});

server.listen(PORT, () => { console.log(`Pushoong-ish Q&A on http://localhost:${PORT}`); });
