export const MACHINE_STYLES=[
 {id:'studio',model:'C—82',name:'STUDIO SILVER',detail:'BRUSHED ALLOY / 1982',scale:[1,1,1],antenna:.98,handle:1,colors:{silver:'#b6bcb8',edge:'#d1d4cf',dark:'#303735',cream:'#e4e0d2',orange:'#bc582c',metal:'#8c9590'},roughness:.42,metalness:.35},
 {id:'field',model:'F—86',name:'FIELD EDITION',detail:'WARM IVORY / 1986',scale:[1.055,.965,1.06],antenna:.77,handle:.85,colors:{silver:'#c9bfa8',edge:'#e1d4b8',dark:'#4e574e',cream:'#f2e7cd',orange:'#a84725',metal:'#a6a394'},roughness:.64,metalness:.14},
 {id:'night',model:'N—90',name:'NIGHT SESSION',detail:'GRAPHITE / 1990',scale:[.975,1.035,.99],antenna:.86,handle:1.08,colors:{silver:'#48504e',edge:'#6b7470',dark:'#1a2325',cream:'#afb7ad',orange:'#bf8146',metal:'#89948e'},roughness:.35,metalness:.48},
 {id:'coral',model:'P—84',name:'SUNSET POP',detail:'CORAL / ENAMEL / 1984',scale:[1.035,.965,1.02],antenna:.75,handle:.91,colors:{silver:'#bd6958',edge:'#f0bf98',dark:'#493c39',cream:'#f5ddbb',orange:'#eaa958',metal:'#9e7e6b'},roughness:.46,metalness:.18},
 {id:'lagoon',model:'B—87',name:'LAGOON BLUE',detail:'OCEAN BLUE / 1987',scale:[.975,1.025,1],antenna:.94,handle:1.04,stripes:1,colors:{silver:'#547f90',edge:'#a6c4c9',dark:'#273d49',cream:'#d9e6d9',orange:'#d5a467',metal:'#91a6aa'},roughness:.38,metalness:.34},
 {id:'olive',model:'F—88',name:'TRAIL RADIO',detail:'OLIVE / UTILITY / 1988',scale:[1.06,.95,1.075],antenna:.67,handle:.86,colors:{silver:'#707a50',edge:'#b4b18a',dark:'#303b30',cream:'#d7cfaa',orange:'#d19952',metal:'#8f9780'},roughness:.82,metalness:.08},
 {id:'walnut',model:'W—79',name:'WALNUT CLUB',detail:'TIMBER / CHAMPAGNE / 1979',scale:[1.045,.985,1.06],antenna:.78,handle:.93,wood:1,colors:{silver:'#b5a387',edge:'#dac39a',dark:'#382e29',cream:'#eee0bf',orange:'#b27543',metal:'#b7a483'},roughness:.55,metalness:.37},
 {id:'metro',model:'M—91',name:'METRO CHROME',detail:'INK / CHROME / 1991',scale:[1.075,.925,.97],antenna:.66,handle:.88,stripes:1,colors:{silver:'#343d46',edge:'#b9c6cb',dark:'#151e29',cream:'#d1dadd',orange:'#be594a',metal:'#aabcc3'},roughness:.23,metalness:.67},
 {id:'polar',model:'A—93',name:'POLAR STUDIO',detail:'PORCELAIN / MINIMAL / 1993',scale:[.965,1.045,.975],antenna:.90,handle:1.03,stripes:.7,colors:{silver:'#e2e1d6',edge:'#f1efe4',dark:'#677778',cream:'#f1e9d5',orange:'#709b93',metal:'#bac6c3'},roughness:.66,metalness:.12},
 {id:'timber',model:'T—76',name:'TIMBER HOUSE',detail:'FULL WOOD CABINET / 1976',scale:[1.055,.975,1.06],antenna:.80,handle:.93,wood:1,caseWood:1,colors:{silver:'#9b704a',edge:'#d3b88b',dark:'#382b24',cream:'#e9d3a9',orange:'#ad6a37',metal:'#b59a76'},roughness:.8,metalness:.08},
 {id:'orbit',model:'R—01',name:'ORBIT TOMORROW',detail:'RETRO FUTURE / CHROME + CYAN',scale:[1.075,.955,1.035],antenna:.67,handle:.89,future:1,stripes:.45,colors:{silver:'#c7d9d6',edge:'#e5e8d9',dark:'#293d48',cream:'#f0e8cf',orange:'#d67749',metal:'#abc8cc'},roughness:.26,metalness:.5},
 {id:'mono',model:'B—02',name:'BLACK / WHITE',detail:'MONOCHROME / SATIN ENAMEL',scale:[1,.98,1.015],antenna:.88,handle:1,stripes:1,colors:{silver:'#eceeea',edge:'#fafaf5',dark:'#141719',cream:'#e7e9e5',orange:'#2b3032',metal:'#969e9e'},roughness:.48,metalness:.19}


];
export const AD_COLLECTIONS=[{title:'THE ORIGINALS',year:'1982—1990',styles:['studio','field','night']},{title:'COLOUR STUDIES',year:'1984—1988',styles:['coral','lagoon','olive']},{title:'MATERIAL CULTURE',year:'1979—1993',styles:['walnut','metro','polar']},{title:'FORM & FANTASY',year:'SPECIAL EDITIONS',styles:['timber','orbit','mono']}];
export function getMachineStyle(id){const style=MACHINE_STYLES.find(s=>s.id===id);if(!style)throw Error('Unknown machine style');return style;}
export const FOCUS_AREAS={
 left:{target:[-4.65,4.5,1.3],offset:[-3.2,2.0,10.7],width:7.4},
 center:{target:[0,4.05,1.35],offset:[.7,1.1,10.7],width:6.5},
 right:{target:[4.65,4.8,1.3],offset:[3.2,2.2,10.7],width:7.3},
 top:{target:[0,7.25,.15],offset:[4.5,9.7,10.9],width:15.6},
 back:{target:[0,4,-1.4],offset:[-4,3.1,-16.6],width:15.2},
 vu:{target:[0,6.2,1.45],offset:[.6,1.05,8.5],width:5.6},
 tape:{target:[0,3.65,1.25],offset:[.6,1.0,9.3],width:5.9},
 eq:{target:[4.63,6.25,1.42],offset:[2.0,2.1,8.6],width:5.5}
};
export function fitFocusDistance(width,fov,aspect,minimum){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(aspect)||aspect<=0)throw Error('Invalid focus geometry');
 return Math.max(minimum,width/(2*Math.tan(fov*Math.PI/360)*aspect)*1.12);
}
