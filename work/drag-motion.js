// Acceleration and speed limits, critically damped spring, stable substeps.
export function smoothTapeMotion(p,v,target,dt){
 const steps=Math.max(1,Math.ceil(Math.min(dt,.1)/.008)),h=Math.min(dt,.1)/steps;
 for(let n=0;n<steps;n++){
  const dx=target.x-p.x,dy=target.y-p.y,dz=target.z-p.z;
  let ax=dx*196-v.x*28,ay=dy*196-v.y*28,az=dz*196-v.z*28;
  const a=Math.hypot(ax,ay,az),limit=a>110?110/a:1;
  v.x+=ax*limit*h;v.y+=ay*limit*h;v.z+=az*limit*h;
  const speed=Math.hypot(v.x,v.y,v.z);if(speed>17){v.x*=17/speed;v.y*=17/speed;v.z*=17/speed;}
  if(dx*dx+dy*dy+dz*dz<.000004&&speed<.02){p.copy(target);v.set(0,0,0);break;}
  p.x+=v.x*h;p.y+=v.y*h;p.z+=v.z*h;
 }
}
