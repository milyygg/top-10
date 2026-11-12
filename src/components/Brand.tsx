import {Crown,BarChart3} from 'lucide-react';
export function Brand(){return <span className="brand"><BarChart3 aria-hidden="true"/><span>Топ-10<span className="brand-dot">.</span></span></span>}
export function Rank({n}:{n:number}){return <span className={`rank rank-${n}`}>{n<=3&&<Crown aria-hidden="true"/>}<b>{n}</b></span>}
