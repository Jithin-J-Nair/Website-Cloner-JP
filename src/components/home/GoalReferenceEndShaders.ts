/** Adapted from the inspected GoalWhiteTunnelParticles/Stickers shaders.
 * Native display RGB; fragment alpha carries only the diffraction-bloom mask. */
export const endDiamondVertex = `#define GLSLIFY 1
attribute vec3 a_instancePosition;attribute vec3 a_instanceRotationAxis;attribute vec4 a_instanceRand;attribute float thickness;uniform float u_time;uniform float u_aspect;uniform float u_activeRatio;varying vec3 v_viewNormal;varying float v_thickness;varying vec3 v_cameraPositionLS;varying vec3 v_positionLS;varying vec3 v_normalLS;varying vec4 v_orient;varying float v_fadeOut;
#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif
float elasticOut(float t){return sin(-13.0*(t+1.0)*HALF_PI)*pow(2.0,-10.0*t)+1.0;}float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 qrotate(vec4 q,vec3 v){return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}vec4 quaternion(vec3 axis,float halfAngle){return vec4(axis*sin(halfAngle),cos(halfAngle));}vec3 rotate(vec3 v,vec3 axis,float angle){vec4 q=quaternion(axis,angle*.5);return qrotate(q,v);}void main(){float time=0.5*u_time+4.*a_instanceRand.x;float scale=0.75;vec3 pos=position;vec4 orient=quaternion(a_instanceRotationAxis,(0.5+a_instanceRand.y)*time);pos=qrotate(orient,pos);pos*=scale;vec3 nor=qrotate(orient,normal);vec3 instancePosition=a_instancePosition;instancePosition.y+=0.5*u_time*(1.+a_instanceRand.x);float yLimit=20.0/u_aspect;instancePosition.y=mod(instancePosition.y,yLimit)-0.5*yLimit;v_fadeOut=abs(instancePosition.y)/(yLimit*0.5);pos*=linearStep(a_instanceRand.w*0.5,a_instanceRand.w*0.5+0.5,u_activeRatio);pos+=instancePosition;vec4 orientInv=vec4(-orient.xyz,orient.w);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.);v_cameraPositionLS=qrotate(orientInv,(cameraPosition/0.208-instancePosition)/scale);v_positionLS=position*scale;v_normalLS=normal;v_orient=orient;v_viewNormal=normalMatrix*nor;v_thickness=thickness;}`;
export const endDiamondFragment = `#define GLSLIFY 1
uniform vec3 u_color;uniform vec3 u_bgColor;uniform vec4 u_planes[25];uniform mat3 normalMatrix;varying vec3 v_viewNormal;varying float v_thickness;varying vec3 v_cameraPositionLS;varying vec3 v_positionLS;varying vec3 v_normalLS;varying vec4 v_orient;varying float v_fadeOut;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}float plaIntersect(in vec3 ro,in vec3 rd,in vec4 p){return-(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);}vec4 getColorShade(vec3 dir,vec3 vn){float d=dot(dir,vn);float shade=(1.0-max(0.,vn.z))*v_thickness*5.;shade*=(pow(linearStep(2.,-1.,d),4.)*0.15+pow(linearStep(1.,-2.,d),5.)*7.);vec3 rgb=mix(vec3(0.8),clamp(abs(mod((d+vn.z)*12.+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0),1.-shade);return vec4((vec3(u_color)+rgb*1.2)*shade,0.035+(1.-v_thickness)*shade*shade)*(1.-abs(vn.z));}vec3 qrotate(vec4 q,vec3 v){return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}void main(){vec3 localDir=normalize(v_positionLS);vec3 viewNormal=normalize(v_viewNormal);float ior=2.418;vec3 norLS=normalize(v_normalLS);vec3 refrLS=refract(normalize(v_positionLS-v_cameraPositionLS),norLS,1./ior);float dist=100.;vec3 planeDir=vec3(0.);for(int i=0;i<25;i++){vec4 plane=u_planes[i];plane.xyz*=-1.;plane.w*=0.7501;float hitDist=plaIntersect(v_positionLS+refrLS*0.001,refrLS,plane);if(hitDist>0.&&hitDist<dist){dist=hitDist;planeDir=u_planes[i].xyz;}}vec3 refrPosLS=v_positionLS+refrLS*dist;refrLS=refract(refrLS,planeDir,ior);vec3 refrLocalDir=qrotate(v_orient,normalize(refrPosLS));vec3 viewPlaneNor=normalize(normalMatrix*qrotate(v_orient,planeDir));vec4 frontColorShade=getColorShade(localDir,viewNormal);vec4 backColorShade=getColorShade(refrLocalDir,viewPlaneNor);gl_FragColor=frontColorShade*1.5+vec4(backColorShade.rgb*0.75,backColorShade.a*.5);gl_FragColor.rgb=mix(u_bgColor,gl_FragColor.rgb,linearStep(0.0,0.1,1.0-v_fadeOut));}`;
export const endStickerVertex = `#define GLSLIFY 1
attribute float instanceId;attribute vec4 instanceUvInfo;attribute vec4 instanceRands;uniform float u_time;uniform float u_activeRatio;uniform float u_aspect;uniform vec2 u_textureSize;varying float v_fadeOut;varying vec2 v_uv;vec4 hash42(vec2 p){vec4 p4=fract(vec4(p.xyxy)*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}vec2 rotate(vec2 v,float a){float s=sin(a);float c=cos(a);mat2 m=mat2(c,s,-s,c);return m*v;}float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}void main(){vec3 pos=position;pos.xy*=instanceUvInfo.zw*u_textureSize*0.01;float t=u_time*mix(0.05,0.1,instanceRands.x)+instanceRands.y;float cycle=floor(t);float ratio=fract(t);vec4 cycleRands=hash42(vec2(cycle,instanceId));pos.xy=rotate(pos.xy,instanceRands.z*6.28+sign(cycleRands.z-.5)*u_time*mix(.5,1.,cycleRands.y))*linearStep(instanceRands.w*0.5,instanceRands.w*0.5+0.5,u_activeRatio)*0.35;float yLimit=7.0/u_aspect;vec3 instancePos=vec3(mix(-5.,5.,cycleRands.x),yLimit*mix(-1.0,1.0,ratio),20.+instanceId/float(COUNT));pos+=instancePos;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_uv=instanceUvInfo.xy+instanceUvInfo.zw*vec2(uv.x,1.-uv.y);v_uv.y=1.0-v_uv.y;v_fadeOut=2.0*abs(ratio-0.5);}`;
export const endStickerFragment = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec3 u_bgColor;varying vec2 v_uv;varying float v_fadeOut;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}void main(){gl_FragColor=texture2D(u_texture,v_uv);gl_FragColor.rgb=mix(u_bgColor,gl_FragColor.rgb,linearStep(0.0,0.1,1.0-v_fadeOut));}`;
export const GOAL_DIAMOND_PLANES = [
      -0.694747, 0.694747, 0.186157, -0.239229, -0.50859, 0.694747, 0.50859,
      -0.239229, -0.186157, 0.694747, 0.694747, -0.239229, 0.186157, 0.694747,
      0.694747, -0.239229, 0.50859, 0.694747, 0.50859, -0.239229, 0.694747,
      0.694747, 0.186157, -0.239229, 0.694747, 0.694747, -0.186157, -0.239229,
      0.50859, 0.694747, -0.50859, -0.239229, 0.186157, 0.694747, -0.694746,
      -0.239229, -0.186156, 0.694747, -0.694747, -0.239229, -0.508589, 0.694747,
      -0.50859, -0.239229, -0.694747, 0.694747, -0.186157, -0.239229, -0.694747,
      -0.694747, 0.186157, -0.455518, -0.50859, -0.694747, 0.50859, -0.455518,
      -0.186157, -0.694747, 0.694747, -0.455518, 0.186157, -0.694747, 0.694747,
      -0.455518, 0.50859, -0.694747, 0.50859, -0.455518, 0.694746, -0.694747,
      0.186157, -0.455518, 0.694746, -0.694747, -0.186157, -0.455518, 0.50859,
      -0.694747, -0.50859, -0.455518, 0.186157, -0.694747, -0.694746, -0.455518,
      -0.186156, -0.694747, -0.694747, -0.455518, -0.508589, -0.694747,
      -0.50859, -0.455518, -0.694747, -0.694747, -0.186157, -0.455518, -0, -1,
      -0, -0.34434,
    ] as const;
export const GOAL_STICKER_RECTS = [
    { x: 1132, y: 3, w: 195, h: 195 },
    { x: 744, y: 3, w: 195, h: 256 },
    { x: 525, y: 3, w: 213, h: 282 },
    { x: 242, y: 3, w: 277, h: 286 },
    { x: 1055, y: 633, w: 209, h: 209 },
    { x: 1076, y: 398, w: 209, h: 209 },
    { x: 3, y: 772, w: 298, h: 249 },
    { x: 945, y: 3, w: 181, h: 249 },
    { x: 1291, y: 389, w: 160, h: 197 },
    { x: 1055, y: 848, w: 83, h: 122 },
    { x: 1132, y: 204, w: 167, h: 179 },
    { x: 1270, y: 828, w: 192, h: 193 },
    { x: 780, y: 265, w: 182, h: 167 },
    { x: 564, y: 445, w: 294, h: 184 },
    { x: 307, y: 683, w: 205, h: 334 },
    { x: 864, y: 438, w: 206, h: 189 },
    { x: 968, y: 258, w: 149, h: 134 },
    { x: 734, y: 635, w: 165, h: 382 },
    { x: 605, y: 291, w: 169, h: 141 },
    { x: 302, y: 445, w: 256, h: 232 },
    { x: 518, y: 683, w: 210, h: 266 },
    { x: 242, y: 295, w: 357, h: 144 },
    { x: 3, y: 3, w: 233, h: 469 },
    { x: 905, y: 633, w: 144, h: 340 },
    { x: 1270, y: 613, w: 187, h: 209 },
    { x: 3, y: 478, w: 293, h: 288 },
  ] as const;
