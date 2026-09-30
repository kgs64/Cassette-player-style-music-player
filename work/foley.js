// Procedural mechanical sounds. A separate branch of the existing AudioContext;
// no microphone, audio downloads, or signal sent through the music analyser.
export function createFoley(context) {
  const bus=context.createGain();bus.gain.value=.15;bus.connect(context.destination);
  const history=[];
  const noise=context.createBuffer(1,Math.ceil(context.sampleRate*.6),context.sampleRate);
  const data=noise.getChannelData(0);let seed=0x82cafe;
  for(let i=0;i<data.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;data[i]=((seed>>>0)/4294967295)*2-1;}
  function burst(at,duration,level,frequency=1800,q=.7){
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=q;
    gain.gain.setValueAtTime(.00001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.001,level),at+.003);
    gain.gain.exponentialRampToValueAtTime(.00001,at+duration);
    source.connect(filter).connect(gain).connect(bus);source.start(at);source.stop(at+duration+.01);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  function knock(at,frequency,level,duration=.055){
    const osc=context.createOscillator(),gain=context.createGain();osc.type='triangle';osc.frequency.setValueAtTime(frequency,at);osc.frequency.exponentialRampToValueAtTime(frequency*.44,at+duration);
    gain.gain.setValueAtTime(level,at);gain.gain.exponentialRampToValueAtTime(.00001,at+duration);
    osc.connect(gain).connect(bus);osc.start(at);osc.stop(at+duration+.01);osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function click(at,level=1){burst(at,.026,.46*level,2300,1.2);knock(at+.003,230,.32*level,.045);}
  return {
    setVolume(value){bus.gain.setTargetAtTime(Math.min(.22,Math.max(0,value)*.2),context.currentTime,.02);},
    play(kind){if(context.state!=='running')return;const at=context.currentTime+.006;
      history.push({kind,at});if(history.length>32)history.shift();
      if(kind==='paper'){burst(at,.37,.20,2400,.4);burst(at+.13,.25,.09,4100,.3);}
      else if(kind==='key')click(at,.42);
      else if(kind==='detent')burst(at,.012,.065,3000,1.4);
      else if(kind==='door-open'){click(at,.75);knock(at+.04,155,.2,.17);burst(at+.06,.36,.1,800,.6);}
      else if(kind==='door-close'){burst(at,.24,.085,650,.7);click(at+.3,.8);knock(at+.305,115,.25,.08);}
      else if(kind==='tape-in'){burst(at,.29,.18,1100,.6);click(at+.28,.6);click(at+.34,.25);}
      else if(kind==='tape-out'){click(at,.55);burst(at+.05,.27,.13,1200,.8);knock(at+.24,340,.1,.05);}
      else if(kind==='service-open'){for(let i=0;i<4;i++)burst(at+i*.055,.03,.1,1600+i*150,1);knock(at+.25,120,.14,.08);}
      else if(kind==='service-close'){click(at,.35);click(at+.09,.45);knock(at+.15,140,.18,.07);}
    },
    get events(){return history.map(e=>({...e}));}
  };
}
