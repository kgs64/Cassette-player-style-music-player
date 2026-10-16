// Shared uniforms tint reflected light without repainting a skin's base color.
export function createTimeMaterials(scene,Color){
 const uniforms={timeReflectionTint:{value:new Color(1,1,1)},timeInkTint:{value:new Color('#d5d9dd')},timeInkAmount:{value:0},timeSunsetAmount:{value:0}};
 const patched=new Map();
 function scan(){
  scene.traverse(o=>{
   const materials=Array.isArray(o.material)?o.material:[o.material];
   let lyric=false;for(let n=o;n;n=n.parent)if(n.name==='Lyrics printed in backdrop space')lyric=true;
   for(const m of materials){if(!m||patched.has(m)||(!m.isMeshStandardMaterial&&!(lyric&&m.isMeshBasicMaterial)))continue;
    const compile=m.onBeforeCompile,key=m.customProgramCacheKey;
    const onDispose=()=>{patched.delete(m);m.removeEventListener('dispose',onDispose);};m.addEventListener('dispose',onDispose);patched.set(m,{compile,key,onDispose});
    m.onBeforeCompile=function(shader,renderer){compile.call(this,shader,renderer);Object.assign(shader.uniforms,uniforms);
     shader.fragmentShader='uniform float timeSunsetAmount;uniform vec3 timeReflectionTint;uniform vec3 timeInkTint;uniform float timeInkAmount;\n'+shader.fragmentShader;
     if(m.isMeshStandardMaterial)shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
      #if defined( RE_IndirectDiffuse )
       vec3 sunsetNormal=inverseTransformDirection(normal,viewMatrix);
       float sunsetFacing=smoothstep(-.25,.6,dot(sunsetNormal,normalize(vec3(-25.0,10.0,-8.0))));
       vec3 sunsetBounce=mix(vec3(.83,.90,1.07),vec3(1.12,1.01,.83),sunsetFacing);
       iblIrradiance*=timeReflectionTint*mix(vec3(1.0),sunsetBounce,timeSunsetAmount);
      #endif
      #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
       radiance*=timeReflectionTint;
       #ifdef USE_CLEARCOAT
        clearcoatRadiance*=timeReflectionTint;
       #endif
      #endif`);
     else shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,timeInkTint,timeInkAmount);');
    };
    m.customProgramCacheKey=function(){return key.call(this)+'|time-reflection-ink-v2';};m.needsUpdate=true;
   }
  });
 }
 scan();return {uniforms,scan,dispose(){for(const [m,p] of patched){m.removeEventListener('dispose',p.onDispose);m.onBeforeCompile=p.compile;m.customProgramCacheKey=p.key;m.needsUpdate=true;}patched.clear();}};
}
