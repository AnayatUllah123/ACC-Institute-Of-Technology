import { BookOpen, Braces, Code2, Cpu, Database, Globe2, Network } from 'lucide-react';
const styles=[
  {icon:Code2,pattern:/programming fundamentals|\bpf\b/i,css:'bg-cyan-100 text-cyan-900 border-cyan-200'},
  {icon:Braces,pattern:/object.oriented|\boop\b/i,css:'bg-violet-100 text-violet-900 border-violet-200'},
  {icon:Network,pattern:/data structures|algorithms|\bdsa\b/i,css:'bg-amber-100 text-amber-900 border-amber-200'},
  {icon:Globe2,pattern:/web|html|frontend/i,css:'bg-blue-100 text-blue-900 border-blue-200'},
  {icon:Database,pattern:/database|sql/i,css:'bg-rose-100 text-rose-900 border-rose-200'},
  {icon:Cpu,pattern:/machine|artificial|\bai\b/i,css:'bg-emerald-100 text-emerald-900 border-emerald-200'},
];
export default function AdminCourseBadge({title='Unassigned course'}){
 const match=styles.find(x=>x.pattern.test(title))||{icon:BookOpen,css:'bg-slate-100 text-slate-800 border-slate-200'};
 const Icon=match.icon;
 return <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${match.css}`}><Icon size={15} className="shrink-0" aria-hidden="true"/><span className="break-words">{title}</span></span>;
}
