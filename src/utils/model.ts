export type Mode = 'youtube' | 'custom';
export interface Entry { id:string; text:string; author:string; url:string; image?:string }
export interface Ranking { title:string; mode:Mode; entries:Entry[] }
export const blank = ():Entry => ({id:crypto.randomUUID(),text:'',author:'',url:''});
export function youtubeId(value:string):string|null {
 try { const u=new URL(value); if(u.protocol!=='https:' || u.username || u.password || u.port) return null;
 const hosts=['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com','youtube-nocookie.com'];
 if(!hosts.includes(u.hostname)) return null;
 const parts=u.pathname.split('/').filter(Boolean);
 const id=u.hostname==='youtu.be' && parts.length===1 ? parts[0] : u.pathname==='/watch' && !u.hostname.includes('nocookie') ? u.searchParams.get('v') : parts.length===2 && ['shorts','live','embed'].includes(parts[0]) ? parts[1] : null;
 return id && /^[\w-]{11}$/.test(id) ? id : null;
 } catch {return null;}
}
export function groups(n:number):number[] {if(!Number.isInteger(n)||n<3||n>20) throw new Error('Ожидается от 3 до 20'); const count=Math.ceil(n/5); return Array.from({length:count},(_,i)=>Math.floor(n/count)+(i<n%count?1:0));}
export function validate(r:Ranking):Record<string,string> {const e:Record<string,string>={};if(!r.title.trim())e.title='Укажите название топа'; if(r.entries.length<3||r.entries.length>20)e.count='Нужно от 3 до 20 позиций';r.entries.forEach(x=>{if(r.mode==='youtube'&&!youtubeId(x.url))e[x.id]='Вставьте корректную HTTPS-ссылку YouTube';else if(r.mode==='youtube'&&!x.text.trim())e[x.id]='Укажите название видео';else if(r.mode==='custom'&&!x.text.trim()&&!x.image)e[x.id]='Добавьте текст или изображение';});return e;}
export async function metadata(id:string,signal:AbortSignal):Promise<{title:string;author:string}> {const response=await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+id)}&format=json`,{signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error();const data:unknown=await response.json();if(typeof data!=='object'||!data||!('title' in data)||typeof data.title!=='string'||!data.title.trim()||!('author_name' in data)||typeof data.author_name!=='string')throw new Error();return {title:data.title,author:data.author_name};}
