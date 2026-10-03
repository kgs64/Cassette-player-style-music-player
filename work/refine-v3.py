from pathlib import Path
p=Path(__file__).with_name('app.js');s=p.read_text()
# Retain label content when changing ink for the dark edition.
s=s.replace("const ctx=c.getContext('2d');function paint(value)", "const ctx=c.getContext('2d');let currentText=text;function paint(value)")
s=s.replace("mesh.userData.setText=t=>{paint(t);texture.needsUpdate=true;};", "mesh.userData.setText=t=>{currentText=t;paint(t);texture.needsUpdate=true;};mesh.userData.setInk=color=>{opt.color=color;paint(currentText);texture.needsUpdate=true;};")
s=s.replace("let cableTick=0;", "const adaptiveInk=[];for(const root of [shell,top,...Object.values(knobs).map(k=>k.part)])root.traverse(o=>{if(o.userData.setInk&&o!==serviceText&&o!==serviceHint)adaptiveInk.push(o);});let inkColor=new THREE.Color('#26312e');\nlet cableTick=0;")
s=s.replace("const roughness=M.silver.roughness,metalness=M.silver.metalness;", "const roughness=M.silver.roughness,metalness=M.silver.metalness,fromInk=inkColor.clone(),toInk=new THREE.Color(id==='night'?'#d9dfd1':'#26312e');")
s=s.replace("if(performance.now()-cableTick>80){updateHeadphoneCable();", "if(performance.now()-cableTick>80){inkColor.copy(fromInk).lerp(toInk,u);for(const label of adaptiveInk)label.userData.setInk('#'+inkColor.getHexString());updateHeadphoneCable();")
s=s.replace("currentStyle=id;modelBadge.userData.setText", "inkColor.copy(toInk);for(const label of adaptiveInk)label.userData.setInk('#'+inkColor.getHexString());currentStyle=id;modelBadge.userData.setText")
# Limit unexpected loud peaks when EQ bands are boosted together.
s=s.replace("let foley;let context,source,filters", "let foley;let transportRequest=0;let context,source,filters,limiter")
s=s.replace("foley=createFoley(context);const nodes=[source,...filters,bassFilter,trebleFilter,monoGain,gain,analyser]", "foley=createFoley(context);limiter=context.createDynamicsCompressor();limiter.threshold.value=-1;limiter.knee.value=0;limiter.ratio.value=12;limiter.attack.value=.004;limiter.release.value=.09;const nodes=[source,...filters,bassFilter,trebleFilter,monoGain,gain,limiter,analyser]")
s=s.replace("async function play(){if(busy)return;", "async function play(){if(busy)return;const intent=++transportRequest;")
s=s.replace("if(!loaded||busy)return;try{await audio.play();", "if(!loaded||busy||intent!==transportRequest)return;try{await audio.play();")
s=s.replace("function pause(){audio.pause();", "function pause(){transportRequest++;audio.pause();")
s=s.replace("function eject(){if(busy)return;audio.pause();", "function eject(){if(busy)return;transportRequest++;audio.pause();")
s=s.replace("function stop(){if(busy)return;", "function stop(){transportRequest++;if(busy){audio.pause();seek(0);playerState.paused=false;transportState='STOPPED';pulse('stop');return;}")
s=s.replace("async function unloadTape(){if(busy||!loaded)return;busy=true;", "async function unloadTape(){if(busy||!loaded)return;transportRequest++;busy=true;")
s=s.replace("busy=true;audio.pause();playerState.paused=false;transportState='TRANSITION';sceneState=exploded?", "const intent=++transportRequest;busy=true;audio.pause();playerState.paused=false;transportState='TRANSITION';sceneState=exploded?")
s=s.replace("busy=false;transportState='TAPE_LOADED';sceneState=exploded?'DISASSEMBLY':'FOCUS';if(autoplay)play();", "busy=false;sceneState=exploded?'DISASSEMBLY':'FOCUS';if(errorText){transportState='EJECTED';setDoorTarget(true);return;}transportState='TAPE_LOADED';if(autoplay&&intent===transportRequest)play();")
s=s.replace("setDoorTarget(true);transportState='EJECTED';busy=false;});", "setDoorTarget(true);transportState='EJECTED';});")
# Imported songs may have unequal names; the selector remains physically stable.
s=s.replace("FIELD GUIDE\\nDRAG · ORBIT\\nE · OPEN TAPE\\nSPACE · PLAY\\nDOUBLE TAP + · SERVICE", "FIELD GUIDE\\nTAP L / C / R / TOP\\nSHIFT + SPEAKER · OPEN\\nSPACE · PLAY / PAUSE\\nDOUBLE TAP + · SERVICE")
s=s.replace("volumeGain:gain?.gain.value", "volumeGain:gain?.gain.value,peakReduction:limiter?.reduction")
# Style-accurate front ink in the advertising miniatures. Drawn from actual
# canvas label alpha, without altering the model's original texture.
s=s.replace("function duplicate(source){", "function duplicate(source,lightInk=false){\n  lightInk=lightInk||(style.id==='night'&&[shell,top,...Object.values(knobs).map(k=>k.part)].includes(source));")
s=s.replace("copy.position.copy(source.position);copy.quaternion.copy", "if(lightInk&&source.userData.setInk&&source!==serviceText&&source.material?.map){const c=document.createElement('canvas'),image=source.material.map.image;c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#d9dfd1';ctx.fillRect(0,0,c.width,c.height);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;copy.material=copy.material.clone();copy.material.map=texture;}\n  copy.position.copy(source.position);copy.quaternion.copy")
s=s.replace("const c=duplicate(child);if(c)", "const c=duplicate(child,lightInk);if(c)")
p.write_text(s)
