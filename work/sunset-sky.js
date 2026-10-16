// Shared world-space sunset palette for sky, distant ground and water.
export const sunsetPalette=`
 vec3 sunsetSky(vec3 ray){
  // World elevation and azimuth only: orbiting never moves the sunset.
  float elevation=ray.y+.40;
  vec3 c=mix(vec3(0.323143,0.242281,0.300544),vec3(0.473531,0.258183,0.283149),smoothstep(-.08,.24,elevation));
  c=mix(c,vec3(0.097587,0.116971,0.187821),smoothstep(.26,.60,elevation));
  vec2 horizontal=normalize(ray.xz+vec2(.00001));
  float facing=pow(max(dot(horizontal,normalize(vec2(-25.0,-8.0))),0.0),2.0);
  float glow=exp(-pow((elevation-.16)/.37,2.0))*facing;
  c=mix(c,vec3(0.822786,0.428690,0.226966),glow*.88);
  // Shift only the gold core about 8 degrees right; keep the broad orange glow.
  float goldFacing=pow(max(dot(horizontal,normalize(vec2(-23.0,-11.0))),0.0),5.0);
  float gold=exp(-pow((elevation-.045)/.19,2.0))*goldFacing;
  c=mix(c,vec3(1.000000,0.752942,0.417885)*1.10,gold*.55);
  return c;
 }`;
