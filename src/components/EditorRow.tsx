import {useEffect,useRef,useState} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {GripVertical,X,ImagePlus,ArrowUp,ArrowDown} from 'lucide-react';
import {metadata,youtubeId,type Entry,type Mode} from '../utils/model';
export function EditorRow({entry,index,mode,error,update,remove,move,total,onProcessing}:{entry:Entry;index:number;mode:Mode;error?:string;update:(patch:Partial<Entry>)=>void;remove:()=>void;move:(delta:number)=>void;total:number;onProcessing:(id:string,busy:boolean)=>void}){
 const {attributes,listeners,setNodeRef,transform,transition,isDragging}=useSortable({id:entry.id});
 const [status,setStatus]=useState('');
 const [loadedUrl,setLoadedUrl]=useState('');
 const [editing,setEditing]=useState(false);
 const [failedPreview,setFailedPreview]=useState('');
 const [fileError,setFileError]=useState('');
 const [busy,setBusy]=useState(false);
 const current=useRef(entry);current.current=entry;
 const updateRef=useRef(update);updateRef.current=update;
 const uploadVersion=useRef(0);
 const processingRef=useRef(onProcessing);processingRef.current=onProcessing;
 useEffect(()=>{processingRef.current(entry.id,busy);return()=>processingRef.current(entry.id,false);},[busy,entry.id]);
 useEffect(()=>()=>{uploadVersion.current++;},[]);
 useEffect(()=>{
  if(mode!=='youtube')return;
  const id=youtubeId(entry.url);setLoadedUrl('');setEditing(false);
  if(!id){setStatus('');return;}
  const controller=new AbortController();let active=true;
  const timeout=setTimeout(()=>controller.abort(),8000);
  setStatus('Получаем данные с YouTube…');const original=current.current;
  metadata(id,controller.signal).then(data=>{
   if(!active||controller.signal.aborted||current.current.url!==original.url)return;
   updateRef.current({text:current.current.text===original.text?data.title.slice(0,240):current.current.text,author:current.current.author===original.author?data.author.slice(0,100):current.current.author});
   setLoadedUrl(original.url);setStatus('Данные получены с YouTube');
  }).catch(()=>{if(active)setStatus('Метаданные недоступны. Укажите название и автора вручную.');}).finally(()=>clearTimeout(timeout));
  return()=>{active=false;controller.abort();clearTimeout(timeout);};
 },[entry.url,mode]);
 async function upload(file?:File){
  if(!file)return;const version=++uploadVersion.current;setFileError('');
  if(!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(file.type)){setFileError('Выберите JPEG, PNG, WebP, GIF или AVIF');return;}
  if(file.size>15*1024*1024){setFileError('Максимум 15 МБ на изображение');return;}
  setBusy(true);
  try{const image=await createImageBitmap(file);const c=document.createElement('canvas');const scale=Math.min(1,1600/Math.max(image.width,image.height));c.width=Math.max(1,Math.round(image.width*scale));c.height=Math.max(1,Math.round(image.height*scale));c.getContext('2d')!.drawImage(image,0,0,c.width,c.height);image.close();if(version===uploadVersion.current)updateRef.current({image:c.toDataURL('image/webp',0.92)});}
  catch{if(version===uploadVersion.current)setFileError('Не удалось прочитать изображение');}
  finally{if(version===uploadVersion.current)setBusy(false);}
 }
 const id=youtubeId(entry.url),automatic=loadedUrl===entry.url&&!!loadedUrl;
 const manual=mode==='custom'||!automatic||editing||!!error;
 return <article ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition,opacity:isDragging?.5:1}} className={`edit-row ${automatic&&!manual?'compact':''}`}>
  <div className="row-start"><button className="icon grip" aria-label={`Перетащить позицию ${index+1}`} {...attributes} {...listeners}><GripVertical/></button><span className="position">{index+1}</span></div>
  <div className="entry-fields">
   {mode==='youtube'?<>
    <label>Ссылка на YouTube<input aria-label={`Ссылка ${index+1}`} inputMode="url" value={entry.url} placeholder="https://www.youtube.com/watch?v=…" onChange={e=>update({url:e.target.value,text:'',author:''})}/></label>
    {id&&<div className="youtube-summary"><div className="youtube-thumb">{failedPreview!==id?<img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={`Превью позиции ${index+1}`} onError={()=>setFailedPreview(id)}/>:<span>Нет превью</span>}</div><div className="youtube-info">{automatic&&<><strong title={entry.text}>{entry.text}</strong>{entry.author&&<span>{entry.author}</span>}</>}<small role="status">{status}</small>{automatic&&<button className="edit-metadata" aria-expanded={manual} onClick={()=>setEditing(!editing)}>{editing?'Скрыть поля':'Изменить данные'}</button>}</div></div>}
   </>:<div className="upload-line">{entry.image&&<img className="upload-preview" src={entry.image} alt={`Изображение позиции ${index+1}`}/>}<label className="upload-button"><ImagePlus size={20}/>{busy?'Обработка…':entry.image?'Заменить фото':'Добавить фото'}<input disabled={busy} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label>{entry.image&&<button className="icon" aria-label="Удалить фото" onClick={()=>update({image:undefined})}><X size={18}/></button>}</div>}
   {manual&&<><label>{mode==='youtube'?'Название видео':'Текст участника'}<input maxLength={240} aria-label={`Название позиции ${index+1}`} value={entry.text} placeholder={mode==='youtube'?'Название видео':'Например, Дюна'} onChange={e=>update({text:e.target.value})}/></label>{mode==='youtube'&&<label>Автор<input maxLength={100} aria-label={`Автор позиции ${index+1}`} value={entry.author} onChange={e=>update({author:e.target.value})} placeholder="Необязательно"/></label>}</>}
   {(error||fileError)&&<p className="error" role="alert">{error||fileError}</p>}
  </div>
  <div className="row-actions"><button className="icon" aria-label={`Удалить позицию ${index+1}`} disabled={total<=3||busy} onClick={remove}><X size={18}/></button><button className="icon" aria-label={`Поднять позицию ${index+1}`} disabled={index===0} onClick={()=>move(-1)}><ArrowUp size={16}/></button><button className="icon" aria-label={`Опустить позицию ${index+1}`} disabled={index===total-1} onClick={()=>move(1)}><ArrowDown size={16}/></button></div>
 </article>;
}
