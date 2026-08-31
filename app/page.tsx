'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

type Ratio = '1:1' | '4:5' | '9:16';
type Rights = { creator: string; source: string; license: string };
type CardData = { id: string; name: string; text: string; ratio: Ratio; fontSize: number; color: string; x: number; y: number; imageScale: number; imageX: number; imageY: number; image?: string; imageName?: string; rights: Rights; updatedAt: string };

const ratios: Record<Ratio, [number, number]> = {'1:1':[1080,1080],'4:5':[1080,1350],'9:16':[1080,1920]};
const colors = ['#ffffff','#17211d','#ffd166','#ef476f'];
const starterTemplates: CardData[] = [
  {id:'starter-square',name:'노을의 문장',text:'오늘의 작은 순간이\n내일의 이야기가 된다.',ratio:'1:1',fontSize:54,color:'#ffffff',x:50,y:68,imageScale:100,imageX:50,imageY:50,rights:{creator:'직접 제작',source:'',license:'본인 제작'},updatedAt:new Date().toISOString()},
  {id:'starter-feed',name:'오늘의 응원',text:'충분히 잘하고 있어요',ratio:'4:5',fontSize:58,color:'#ffffff',x:50,y:72,imageScale:100,imageX:50,imageY:50,rights:{creator:'직접 제작',source:'',license:'본인 제작'},updatedAt:new Date().toISOString()},
  {id:'starter-story',name:'새로운 시작',text:'천천히, 그래도 앞으로',ratio:'9:16',fontSize:62,color:'#ffd166',x:50,y:66,imageScale:100,imageX:50,imageY:50,rights:{creator:'직접 제작',source:'',license:'본인 제작'},updatedAt:new Date().toISOString()},
];

const makeId = () => `card-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const normalizeCard = (value:Partial<CardData>):CardData => ({...starterTemplates[0],...value,x:value.x??50,imageScale:value.imageScale??100,imageX:value.imageX??50,imageY:value.imageY??50,rights:{...starterTemplates[0].rights,...value.rights}});
const isValidCard = (value: unknown): value is CardData => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<CardData>;
  return typeof v.name === 'string' && typeof v.text === 'string' && !!v.ratio && v.ratio in ratios && typeof v.fontSize === 'number' && typeof v.color === 'string' && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.imageScale === 'number' && typeof v.imageX === 'number' && typeof v.imageY === 'number' && !!v.rights && typeof v.rights.creator === 'string' && typeof v.rights.source === 'string' && typeof v.rights.license === 'string';
};
const hasRequiredImportFields = (value:unknown) => {if(!value||typeof value!=='object')return false;const v=value as Partial<CardData>;return typeof v.name==='string'&&typeof v.text==='string'&&!!v.ratio&&v.ratio in ratios&&typeof v.fontSize==='number'&&typeof v.color==='string'&&typeof v.y==='number'&&!!v.rights&&typeof v.rights.creator==='string'&&typeof v.rights.source==='string'&&typeof v.rights.license==='string';};

const withoutImage = ({image,...data}:CardData) => data;
const openImageDb = () => new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('card-studio-images',1);request.onupgradeneeded=()=>request.result.createObjectStore('images');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
const storeImage = async(id:string,image?:string)=>{const db=await openImageDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction('images','readwrite');const store=tx.objectStore('images');image?store.put(image,id):store.delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();};
const readImage = async(id:string)=>{const db=await openImageDb();const result=await new Promise<string|undefined>((resolve,reject)=>{const request=db.transaction('images').objectStore('images').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});db.close();return result;};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [card,setCard] = useState<CardData>(starterTemplates[0]);
  const [templates,setTemplates] = useState<CardData[]>([]);
  const [message,setMessage] = useState('준비됐어요. 문구를 바꿔보세요.');
  const [showTemplates,setShowTemplates] = useState(false);
  const [showRights,setShowRights] = useState(false);
  const [hydrated,setHydrated] = useState(false);

  useEffect(()=>{
    try {
      const raw=localStorage.getItem('card-studio-templates');
      const saved=raw?JSON.parse(raw):starterTemplates;
      const migrated=Array.isArray(saved)?saved.map(normalizeCard):starterTemplates;
      setTemplates(migrated.every(isValidCard)?migrated:starterTemplates);
    } catch { setTemplates(starterTemplates); }
    setHydrated(true);
  },[]);
  useEffect(()=>{ if(hydrated) try{localStorage.setItem('card-studio-templates',JSON.stringify(templates.map(withoutImage)));}catch{setMessage('템플릿 설정 저장 공간이 부족합니다. 불필요한 템플릿을 삭제해 주세요.');} },[templates,hydrated]);

  const draw = useCallback(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const [w,h]=ratios[card.ratio]; canvas.width=w; canvas.height=h;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    const paint=(img?:HTMLImageElement)=>{
      ctx.clearRect(0,0,w,h);
      if(img){ const scale=Math.max(w/img.width,h/img.height)*(card.imageScale/100); const dw=img.width*scale,dh=img.height*scale; const dx=(w-dw)*(card.imageX/100),dy=(h-dh)*(card.imageY/100); ctx.drawImage(img,dx,dy,dw,dh); ctx.fillStyle='#14271f33';ctx.fillRect(0,0,w,h); }
      else { const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#eaa66f');sky.addColorStop(.48,'#ead6a9');sky.addColorStop(1,'#304b3a');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.fillStyle='#fae9b9';ctx.beginPath();ctx.arc(w*.5,h*.24,w*.14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#47684f';ctx.beginPath();ctx.ellipse(w*.2,h*.88,w*.72,h*.34,-.15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#263f32';ctx.beginPath();ctx.ellipse(w*.88,h*.92,w*.8,h*.36,.18,0,Math.PI*2);ctx.fill(); }
      const fontPx=Math.round(card.fontSize*w/540); ctx.font=`900 ${fontPx}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=card.color;ctx.shadowColor='#10241e99';ctx.shadowBlur=fontPx*.28;ctx.shadowOffsetY=fontPx*.06;
      const maxWidth=w*.84; const lines:string[]=[];
      card.text.split('\n').forEach(paragraph=>{ if(!paragraph){lines.push('');return;} const words=paragraph.includes(' ')?paragraph.split(' '):[...paragraph]; let line=''; words.forEach((word,i)=>{const joiner=paragraph.includes(' ')?(line?' ':''):'';const test=line+joiner+word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;if(i===words.length-1)lines.push(line);}); });
      const lineHeight=fontPx*1.22; const centerY=h*card.y/100; const centerX=w*card.x/100; const startY=centerY-(lines.length-1)*lineHeight/2; lines.slice(0,8).forEach((line,i)=>ctx.fillText(line,centerX,startY+i*lineHeight,maxWidth));
      ctx.shadowColor='transparent';ctx.font=`600 ${Math.max(13,w*.014)}px Arial`;ctx.textAlign='left';ctx.fillStyle='#ffffffaa';ctx.fillText('CARD STUDIO',w*.045,h*.96);
    };
    if(card.image){const img=new Image();img.onload=()=>paint(img);img.onerror=()=>paint();img.src=card.image;} else paint();
  },[card]);
  useEffect(()=>{draw();},[draw]);

  const patchCard=(patch:Partial<CardData>)=>setCard(prev=>({...prev,...patch}));
  const onImage=(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0]; if(!file)return;
    if(!['image/png','image/jpeg'].includes(file.type)){setMessage('지원하지 않는 파일입니다. PNG 또는 JPEG를 선택해 주세요. 기존 작업은 유지됐습니다.');event.target.value='';return;}
    if(file.size>10*1024*1024){setMessage('파일이 10MB를 넘습니다. 기존 작업은 유지됐습니다.');event.target.value='';return;}
    const reader=new FileReader();reader.onload=()=>{patchCard({image:String(reader.result),imageName:file.name,imageScale:100,imageX:50,imageY:50});setMessage(`${file.name} 이미지를 불러왔습니다.`)};reader.onerror=()=>setMessage('이미지를 읽지 못했습니다. 기존 작업은 유지됐습니다.');reader.readAsDataURL(file);
  };
  const download=(format:'png'|'jpeg')=>{const canvas=canvasRef.current;if(!canvas)return;const mime=format==='png'?'image/png':'image/jpeg';canvas.toBlob(blob=>{if(!blob){setMessage('파일을 만들지 못했습니다. 다시 시도해 주세요.');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`card-${card.ratio.replace(':','x')}.${format==='png'?'png':'jpg'}`;a.click();URL.revokeObjectURL(url);setMessage(`화면과 같은 ${format.toUpperCase()} 파일을 저장했습니다.`);},mime,.92);};
  const saveTemplate=async()=>{const name=prompt('템플릿 이름을 입력하세요.',card.name||'새 템플릿');if(!name)return;const next={...card,id:makeId(),name,updatedAt:new Date().toISOString()};try{await storeImage(next.id,next.image);setTemplates(prev=>[next,...prev]);setCard(next);setMessage(`“${name}” 템플릿과 이미지를 이 기기에 저장했습니다.`);}catch{setMessage('이미지 저장 공간이 부족합니다. 기존 작업은 유지됐습니다.');}};
  const updateTemplate=async()=>{if(!templates.some(t=>t.id===card.id)){setMessage('먼저 템플릿으로 저장해 주세요.');return;}const next={...card,updatedAt:new Date().toISOString()};try{await storeImage(next.id,next.image);setTemplates(prev=>prev.map(t=>t.id===card.id?next:t));setMessage(`“${card.name}” 변경 내용을 저장했습니다.`);}catch{setMessage('템플릿 이미지를 저장하지 못했습니다. 기존 저장본은 유지됩니다.');}};
  const loadTemplate=async(template:CardData)=>{try{const image=await readImage(template.id);setCard({...template,image});setShowTemplates(false);setMessage(`“${template.name}” 템플릿을 불러왔습니다.`);}catch{setMessage('템플릿 이미지를 불러오지 못했습니다. 설정은 유지됩니다.');}};
  const removeTemplate=async(id:string)=>{const target=templates.find(t=>t.id===id);if(!target||!confirm(`“${target.name}” 템플릿을 삭제할까요?`))return;try{await storeImage(id);setTemplates(prev=>prev.filter(t=>t.id!==id));setMessage('템플릿을 삭제했습니다. 새로고침 후에도 반영됩니다.');}catch{setMessage('템플릿을 삭제하지 못했습니다. 다시 시도해 주세요.');}};
  const exportJson=()=>{const blob=new Blob([JSON.stringify(card,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${card.name||'card-template'}.json`;a.click();URL.revokeObjectURL(url);setMessage(card.image?'이미지를 포함한 완전한 템플릿 JSON을 저장했습니다.':'템플릿 JSON을 저장했습니다.');};
  const importJson=(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=async()=>{try{const raw=JSON.parse(String(reader.result));if(!hasRequiredImportFields(raw))throw new Error('필수 항목 누락');const value=normalizeCard(raw);if(!isValidCard(value))throw new Error('유효하지 않은 값');if(value.image&&!value.image.startsWith('data:image/'))throw new Error('잘못된 이미지');const next={...value,id:makeId(),updatedAt:new Date().toISOString()};await storeImage(next.id,next.image);setCard(next);setTemplates(prev=>[next,...prev]);setMessage('이미지와 설정을 포함한 JSON 템플릿을 안전하게 가져왔습니다.');}catch{setMessage('JSON이 손상됐거나 필수 항목이 없습니다. 기존 작업은 유지됐습니다.');}finally{event.target.value='';}};reader.onerror=()=>setMessage('JSON 파일을 읽지 못했습니다. 기존 작업은 유지됐습니다.');reader.readAsText(file);};
  const resetCard=()=>{setCard({...starterTemplates[0],id:makeId(),updatedAt:new Date().toISOString()});setMessage('새 카드로 초기화했습니다. 저장된 템플릿은 그대로 유지됩니다.');};
  const dims=ratios[card.ratio];

  return <main className="studio-shell">
    <header className="topbar"><div className="brand-mark" aria-hidden="true">짤</div><div><h1>짤·카드 스튜디오</h1><p>이미지 한 장, 문구 한 줄로 완성하는 나만의 카드</p></div><div className="header-actions"><button onClick={()=>setShowTemplates(v=>!v)}>템플릿 <b>{templates.length}</b></button><span className="privacy-badge">로그인 없음 · 기기에 저장</span></div></header>
    <section className="workspace" aria-label="카드 편집 작업 영역">
      <aside className="control-panel"><div className="panel-heading"><span>01</span><div><strong>카드 설정</strong><small>이미지와 문구를 정해보세요</small></div></div>
        <label className="upload-box"><span className="upload-icon">＋</span><strong>{card.imageName||'이미지 불러오기'}</strong><small>PNG 또는 JPEG · 최대 10MB</small><input type="file" accept="image/png,image/jpeg" onChange={onImage}/></label>
        <label className="field-label" htmlFor="caption">카드 문구 <b>{card.text.length}/180</b></label><textarea id="caption" maxLength={180} value={card.text} onChange={e=>patchCard({text:e.target.value})}/>
        <div className="ratio-row" aria-label="화면 비율">{(Object.keys(ratios) as Ratio[]).map(r=><button key={r} onClick={()=>patchCard({ratio:r})} className={`ratio ${card.ratio===r?'active':''}`}>{r}</button>)}</div>
        <button className="rights-toggle" onClick={()=>setShowRights(v=>!v)}>권리·출처 정보 <span>{showRights?'−':'＋'}</span></button>
        {showRights&&<div className="rights-fields"><label>제작자<input value={card.rights.creator} onChange={e=>patchCard({rights:{...card.rights,creator:e.target.value}})} placeholder="직접 제작 또는 제작자"/></label><label>원본 출처 URL<input value={card.rights.source} onChange={e=>patchCard({rights:{...card.rights,source:e.target.value}})} placeholder="직접 제작이면 비워도 됩니다"/></label><label>라이선스·이용 조건<input value={card.rights.license} onChange={e=>patchCard({rights:{...card.rights,license:e.target.value}})} placeholder="예: CC BY 4.0"/></label></div>}
      </aside>
      <section className="preview-panel"><div className="preview-toolbar"><div><strong>미리보기</strong><span>{dims[0]} × {dims[1]} PNG</span></div><span className="live-dot">실시간 반영</span></div><div className="canvas-wrap"><canvas ref={canvasRef} className={`artboard ratio-${card.ratio.replace(':','-')}`} aria-label="완성 카드 미리보기"/></div><p className="status-message" role="status">{message}</p></section>
      <aside className="tool-panel"><div className="panel-heading"><span>02</span><div><strong>스타일</strong><small>문구를 더 돋보이게</small></div></div>
        <label className="field-label">글자 크기 <b>{card.fontSize}</b></label><input type="range" min="20" max="100" value={card.fontSize} onChange={e=>patchCard({fontSize:Number(e.target.value)})}/>
        <label className="field-label">글자 색상</label><div className="color-options">{colors.map(color=><button key={color} onClick={()=>patchCard({color})} className={card.color===color?'selected':''} style={{background:color}} aria-label={`${color} 색상`}/>)}</div>
        <label className="field-label">가로 위치 <b>{card.x}%</b></label><input aria-label="문구 가로 위치" type="range" min="15" max="85" value={card.x} onChange={e=>patchCard({x:Number(e.target.value)})}/>
        <label className="field-label">세로 위치 <b>{card.y}%</b></label><input type="range" min="10" max="90" value={card.y} onChange={e=>patchCard({y:Number(e.target.value)})}/>
        {card.image&&<details className="image-controls"><summary>이미지 배치 조절</summary><label className="field-label">확대 <b>{card.imageScale}%</b></label><input aria-label="이미지 확대" type="range" min="100" max="220" value={card.imageScale} onChange={e=>patchCard({imageScale:Number(e.target.value)})}/><label className="field-label">가로 초점 <b>{card.imageX}%</b></label><input aria-label="이미지 가로 초점" type="range" min="0" max="100" value={card.imageX} onChange={e=>patchCard({imageX:Number(e.target.value)})}/><label className="field-label">세로 초점 <b>{card.imageY}%</b></label><input aria-label="이미지 세로 초점" type="range" min="0" max="100" value={card.imageY} onChange={e=>patchCard({imageY:Number(e.target.value)})}/></details>}
        <div className="template-actions"><button onClick={saveTemplate}>새 템플릿 저장</button><button onClick={updateTemplate}>현재 템플릿 수정</button></div>
        <div className="download-actions"><button className="download-button" onClick={()=>download('png')}>PNG 저장 <span>↓</span></button><button onClick={()=>download('jpeg')}>JPG 저장</button></div><div className="json-actions"><button onClick={exportJson}>JSON 내보내기</button><button onClick={()=>importRef.current?.click()}>JSON 가져오기</button><input ref={importRef} hidden type="file" accept="application/json,.json" onChange={importJson}/></div><button className="reset-button" onClick={resetCard}>새 카드로 초기화</button>
      </aside>
    </section>
    {showTemplates&&<div className="template-drawer"><div className="drawer-head"><div><strong>내 템플릿</strong><small>설정은 브라우저에, 이미지는 안전한 기기 저장소에 보관됩니다</small></div><button onClick={()=>setShowTemplates(false)}>×</button></div><div className="template-list">{templates.map(t=><article key={t.id}><button className="template-load" onClick={()=>loadTemplate(t)}><span>{t.ratio}</span><div><strong>{t.name}</strong><small>{t.text.slice(0,34)||'문구 없음'}</small></div></button><button className="template-delete" onClick={()=>removeTemplate(t.id)} aria-label={`${t.name} 삭제`}>삭제</button></article>)}</div></div>}
  </main>;
}
