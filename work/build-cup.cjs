// Reposition the cup without rebuilding the older scene baseline.
const fs=require('node:fs'),path=require('node:path');
const files=['index.html','cassette-world.html'].map(n=>path.join(__dirname,'../outputs',n));
const edits=[['var SB=s0(u0,-4.45,.238,4.15);','var SB=s0(u0,-4.45,.23,4.15);'],['var SB=s0(u0,-2.44,.772,4.81);','var SB=s0(u0,-4.45,.23,4.15);'],['SB.rotation.z=Math.sin(t*.075)*Yg*.008','SB.rotation.z=0']];
const result=files.map(f=>{let s=fs.readFileSync(f,'utf8');for(const [a,b]of edits){if(s.includes(b))continue;if(!s.includes(a)&&a.includes('.238'))continue;if(s.split(a).length!==2)throw Error('Unexpected cup bootstrap');s=s.replace(a,b);}return s;});if(result[0]!==result[1])throw Error('Pages differ');files.forEach((f,i)=>fs.writeFileSync(f,result[i]));
