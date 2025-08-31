import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import * as path from 'node:path';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit:'1mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');
const PROF_FILE = path.join(DATA_DIR, 'profiles.json');

const ensureFiles = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MSG_FILE)) fs.writeFileSync(MSG_FILE, JSON.stringify({ profiles: {} }, null, 2));
  if (!fs.existsSync(PROF_FILE)) fs.writeFileSync(PROF_FILE, JSON.stringify({ profiles: {} }, null, 2));
};
ensureFiles();

const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJSON = (f, obj) => fs.writeFileSync(f, JSON.stringify(obj, null, 2));

const hash = s => crypto.createHash('sha256').update(String(s)).digest('hex');

const createLimiter = rateLimit({ windowMs: 60*1000, limit: 10 });
const postLimiter   = rateLimit({ windowMs: 10*1000, limit: 6 });

// create
app.post('/api/curious/create', createLimiter, (req, res) => {
  const { alias, nickname, password } = req.body || {};
  if (!alias) return res.status(400).json({ error:'bad_alias' });
  if (!password) return res.status(400).json({ error:'bad_password' });
  const profiles = readJSON(PROF_FILE);
  if (profiles.profiles[alias]) return res.status(409).json({ error:'alias_taken' });
  profiles.profiles[alias] = { slug: alias, nickname, passHash: hash(password), createdAt: Date.now() };
  writeJSON(PROF_FILE, profiles);
  res.json({ ok:true, url:'/c/'+alias, owner:'/owner/'+alias });
});

// owner login
app.post('/api/owner/login', (req,res)=>{
  const { slug, password } = req.body || {};
  const profiles = readJSON(PROF_FILE);
  const p = profiles.profiles[slug];
  if (!p) return res.status(404).json({ error:'not_found' });
  if (p.passHash !== hash(password)) return res.status(403).json({ error:'bad_password' });
  res.cookie('ownerToken','ok'); res.json({ok:true});
});

// messages
app.get('/api/messages/:slug',(req,res)=>{
  const db=readJSON(MSG_FILE);
  res.json({messages:db.profiles[req.params.slug]?.messages||[]});
});
app.post('/api/ask/:slug', postLimiter,(req,res)=>{
  const { slug }=req.params; const { text }=req.body||{};
  const clean=(text||'').trim(); if(!clean) return res.status(400).json({error:'empty'});
  const db=readJSON(MSG_FILE); if(!db.profiles[slug]) db.profiles[slug]={messages:[]};
  const msg={id:nanoid(10),t:Date.now(),role:'ask',text:clean};
  db.profiles[slug].messages.push(msg); writeJSON(MSG_FILE,db); io.to(slug).emit('message',msg); res.json({ok:true});
});
app.post('/api/answer/:slug',(req,res)=>{
  const { slug }=req.params; const { text }=req.body||{};
  const clean=(text||'').trim(); if(!clean) return res.status(400).json({error:'empty'});
  const db=readJSON(MSG_FILE); if(!db.profiles[slug]) db.profiles[slug]={messages:[]};
  const msg={id:nanoid(10),t:Date.now(),role:'answer',text:clean};
  db.profiles[slug].messages.push(msg); writeJSON(MSG_FILE,db); io.to(slug).emit('message',msg); res.json({ok:true});
});

// views
app.get('/curious',(_req,res)=>res.sendFile(path.join(__dirname,'public','curious-create.html')));
app.get('/c/:slug',(_req,res)=>res.sendFile(path.join(__dirname,'public','curious-public.html')));
app.get('/owner/:slug',(_req,res)=>res.sendFile(path.join(__dirname,'public','curious-owner.html')));

io.on('connection',s=>{ s.on('join',({slug})=>slug&&s.join(slug)); });

server.listen(PORT,()=>console.log('Curious-only running on',PORT));
