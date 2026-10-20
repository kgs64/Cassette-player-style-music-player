(function(root){
 // Keep physical slots stable; navigation visits only occupied pages.
 function next(tracks,drawers,current,direction,pageSize=8,drawerCapacity=96){
  const pages=[...new Set(tracks.filter(t=>t.cabinetSlot).map(t=>Math.floor((Math.max(0,drawers.indexOf(t.cabinetSlot.drawer))*drawerCapacity+t.cabinetSlot.index)/pageSize)))].sort((a,b)=>a-b);
  if(!pages.length)return 0;
  if(direction<0)return pages.filter(p=>p<current).at(-1)??pages.at(-1);
  return pages.find(p=>p>current)??pages[0];
 }
 root.cassetteCabinetPages={next};
})(globalThis);
