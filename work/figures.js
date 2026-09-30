// Geometry shared by the scene and headless contact tests (no renderer required).
export const FIGURE_PLACEMENT={left:[-4.55,.17,2.95],observer:[-7.35,.17,5.10],bench:[-5.20,0,5.94],benchSitter:[0,.31,.24],crateSitter:[0,.23,.18]};
export const CLIMBER={rung:9,rungY:.18+9*.32,rootZ:.19,treadHeight:.04,treadY:.18+9*.32+.015,gripY:.18+10*.32};
CLIMBER.rootY=CLIMBER.treadY+CLIMBER.treadHeight/2+.003;
export function buildFigure(g,shape,materials,pose,variant='classic'){
 const {group,box,rod,ball}=shape,{cloth,pants,skin,dark}=materials;
 const sitting=pose==='sit',climbing=pose==='climb';
 const body=group(g,0,.28,0);box(body,.16,.23,.105,0,.075,0,cloth,.045);
 const head=group(body,0,.22,0);ball(head,.079,0,.052,0,skin);const hair=ball(head,.079,0,.078,-.01,dark);hair.scale.y=.56;
 // Silhouette changes leave feet and ladder grips on the same contact points.
 if(variant==='cap'){box(head,.17,.035,.14,0,.12,0,cloth,.014);box(head,.17,.017,.105,0,.10,.095,cloth,.006);}
 if(variant==='coat'){box(body,.195,sitting?.17:.26,.13,0,sitting?.07:.015,0,cloth,.025);for(const y of [-.045,.015,.075])ball(body,.009,0,y,.07,dark);}
 if(variant==='backpack'){box(body,.145,.17,.09,0,.07,-.10,pants,.028);for(const x of [-.065,.065])rod(body,[x,.16,-.01],[x,-.015,.061],.012,dark);}
 if(variant==='curly'){for(const x of [-.052,0,.052])for(const z of [-.04,.018])ball(head,.039,x,.115,z,dark);box(body,.18,.16,.12,0,.04,0,cloth,.025);}
 if(variant==='headphones'){for(const x of [-.083,.083])ball(head,.035,x,.06,0,dark);rod(head,[-.08,.10,0],[0,.15,0],.013,dark);rod(head,[0,.15,0],[.08,.10,0],.013,dark);}
 for(const x of [-.025,.025])ball(head,.006,x,.06,.073,dark);
 const arms=[],legs=[],shoes=[],hands=[];
 for(const side of [-1,1]){
  const arm=group(body,side*.105,.15,0);
  const elbow=climbing?[side*.025,-.09,.09]:[side*.026,-.145,0];
  const hand=climbing?[side*.055,CLIMBER.gripY-CLIMBER.rootY-.43,CLIMBER.rootZ]:[side*.026,-.22,.03];
  rod(arm,[0,0,0],elbow,.026,cloth);rod(arm,elbow,hand,.022,skin);hands.push(ball(arm,.027,...hand,skin));arms.push(arm);
  const leg=group(g,side*.052,sitting?.27:.25,0);
  const knee=sitting?[0,0,.13]:climbing?[0,-.105,.12]:[0,-.215,.015];
  rod(leg,[0,0,0],knee,.028,pants);
  if(sitting||climbing)rod(leg,knee,[0,sitting?-.235:-.21,sitting?.15:.17],.026,pants);
  shoes.push(box(leg,.069,.04,climbing?.14:.12,0,sitting?-.25:-.23,climbing?CLIMBER.rootZ:sitting?.18:.045,dark,.010));legs.push(leg);
 }
 return {body,head,arms,legs,shoes,hands};
}
