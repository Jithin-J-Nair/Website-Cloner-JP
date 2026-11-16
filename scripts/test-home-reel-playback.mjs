#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
fs.mkdirSync('temp', {recursive:true});
const dir=fs.mkdtempSync(path.resolve('temp/reel-playback-'));
try {
  const source=fs.readFileSync('src/components/home/HomeReelPlayback.ts','utf8');
  fs.writeFileSync(`${dir}/playback.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText);
  const {createHomeReelPlayback}=await import(pathToFileURL(`${dir}/playback.mjs`));
  class Button extends EventTarget {attrs={};textContent='';setAttribute(k,v){this.attrs[k]=v;}}
  class Video {muted=true;paused=true;dataset={};blocked=true;attempts=[];play(){this.attempts.push(this.muted?'muted':'audible');if(!this.muted&&this.blocked)return Promise.reject(new Error('NotAllowedError'));this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
  const settle=()=>new Promise(resolve=>setImmediate(resolve));
  const video=new Video(),button=new Button(),playback=createHomeReelPlayback(video,button);
  playback.update(true,false);await settle();assert.deepEqual(video.attempts,['muted']);
  playback.update(true,true);await settle();assert.deepEqual(video.attempts,['muted','audible','muted']);assert.equal(video.paused,false);assert.equal(video.muted,true);assert.equal(button.attrs['aria-label'],'Enable reel sound');
  playback.update(true,true);await settle();assert.equal(video.attempts.length,3,'blocked autoplay is not retried each frame');
  video.blocked=false;button.dispatchEvent(new Event('click'));await settle();assert.equal(video.muted,false);assert.equal(video.paused,false);
  button.dispatchEvent(new Event('click'));await settle();assert.equal(video.muted,true);
  playback.update(false,false);assert.equal(video.paused,true);playback.update(true,true);await settle();assert.equal(video.muted,true,'explicit mute survives leaving and returning');
  playback.dispose();assert.equal(video.paused,true);
  console.log('PASS reel playback: preview, audible attempt, policy fallback, user sound and mute, offscreen pause, cleanup');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
