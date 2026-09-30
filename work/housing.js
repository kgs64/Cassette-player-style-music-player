export const FRONT_FASTENERS=[[-6.68,-2.70],[6.68,-2.70],[-6.68,2.66],[6.68,2.66]];
export const LADDER_SUPPORT={x:-2.48,faceY:6.90,faceZ:1.575,footZ:3.25,footY:.23,capRadius:.05,railSpacing:.58,rungCount:21};
export function ladderPose(scale=[1,1,1],offsetY=0,skin=0){const s=LADDER_SUPPORT;const target=[s.x*scale[0],s.faceY*scale[1]+offsetY,(s.faceZ+skin)*scale[2]+s.capRadius];const rise=target[1]-s.footY,run=s.footZ-target[2];return {base:[target[0],s.footY,s.footZ],target,length:Math.hypot(rise,run),angle:-Math.atan2(run,rise)};}
