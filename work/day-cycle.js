// Local civil-time art direction, not a latitude/season astronomical simulation.
const KEYS=[[0,'night'],[4.5,'night'],[6.25,'sunrise'],[9,'midday'],[14,'midday'],[18,'sunset'],[19,'sunset'],[21,'night'],[24,'night']];
export function sampleDayCycle(date=new Date()){
 const hour=date.getHours()+date.getMinutes()/60+date.getSeconds()/3600+date.getMilliseconds()/3600000;
 for(let i=1;i<KEYS.length;i++)if(hour<=KEYS[i][0]){const a=KEYS[i-1],b=KEYS[i],u=(hour-a[0])/(b[0]-a[0]);return {hour,from:a[1],to:b[1],blend:u*u*(3-2*u)};}
 return {hour,from:'night',to:'night',blend:1};
}
