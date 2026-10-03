import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {smoothTapeMotion} from './drag-motion.js';
for(const fps of [20,30,60,120]){
 const p=new Vector3(),v=new Vector3(),target=new Vector3(9,4,5);let last=p.clone();
 for(let i=0;i<fps*5;i++){smoothTapeMotion(p,v,target,1/fps);assert(v.length()<=17.00001);assert(p.distanceTo(last)<=17/fps+.00001);last.copy(p);}
 assert(p.distanceTo(target)<.003,`${fps} fps fails to settle`);
 target.set(-3,2,5);
 for(let i=0;i<fps*5;i++)smoothTapeMotion(p,v,target,1/fps);
 assert(p.distanceTo(target)<.003,'direction reversal fails to settle');
}
console.log('PASS 20/30/60/120 fps: bounded speed, displacement, settling and reversal');
