export const OPEN_ANGLE=1.53, KEY_REST=.20, KEY_TRAVEL=.075;
// Fixed substeps and hard mechanical stops prevent large frames or rapid input
// from pushing a cap or hinge beyond its physical travel.
export function springStep(position,velocity,target,dt,stiffness,damping,min,max){
 let remaining=Math.min(.08,Math.max(0,dt));
 while(remaining>0){const step=Math.min(remaining,1/120);velocity+=(stiffness*(target-position)-damping*velocity)*step;position+=velocity*step;
  if(position<min){position=min;velocity=Math.max(0,velocity);}if(position>max){position=max;velocity=Math.min(0,velocity);}remaining-=step;}
 return {position,velocity};
}
