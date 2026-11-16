/** Adapted from the archived Home goal shaders; provenance and pipeline differences
 * are documented in docs/research/home-goal-reconstruction.md. No archived bundle runs. */
export const blackVertex = `#define GLSLIFY 1
attribute float ao;attribute float areaRatio;attribute float cluster;attribute float height;attribute vec3 center;attribute vec3 instancePos;attribute vec3 instanceGridIds;attribute vec3 instanceAxis;attribute vec4 tangent;uniform float u_time;uniform float u_showRatio;uniform float u_offsetZ;varying vec3 v_worldPosition;varying vec4 v_worldTangent;varying vec3 v_worldNormal;varying float v_ao;varying float v_opacity;varying float v_emission;varying vec2 v_uv;varying vec4 v_rands;varying float v_depth;
#define PI 3.14159265359
vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}vec4 quaternion(vec3 axis,float angle){float halfAngle=angle*0.5;return vec4(axis*sin(halfAngle),cos(halfAngle));}float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec4 hash44(vec4 p4){p4=fract(p4*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}vec3 inverseTransformDirection(in vec3 dir,in mat4 matrix){return normalize((vec4(dir,0.0)*matrix).xyz);}
#define GLSLIFY 1
uniform float u_blackTunnelTransformRatio;vec3 goalBlackTunnelTransform(vec3 pos){float t=u_blackTunnelTransformRatio*6.2831853;float zWeight=pos.z*0.025;float angle=t*zWeight*zWeight*sign(zWeight);float sa=sin(angle);float ca=cos(angle);mat2 m2=mat2(ca,-sa,sa,ca);pos.xy=m2*pos.xy;pos.z+=t*1.;pos=pos.xzy;float rad=20.;pos/=rad;vec3 a=pos;vec2 pq=vec2(-1.,.5)*t;float ada=dot(a,a);vec4 b=vec4(2.*a,ada-1.)/(1.+ada);vec4 pq_cs=vec4(cos(pq),sin(pq)).xzyw;vec2 np1=vec2(-1.,1.);vec4 c=(b.xxyy*np1.yxyy*pq_cs+b.zzww*np1.yyxy*pq_cs.yxwz).xzyw;pos=c.xyz/(1.-c.w);pos=pos.xzy;return pos*rad;}
void main(){vec3 pos=position;vec3 nor=normal;vec3 tang=tangent.xyz;
#ifdef IS_HD
float blockId=floor(pos.x+0.5);
#else
float blockId=0.;
#endif
vec4 q;vec3 offsetInstanceGridIds=instanceGridIds;offsetInstanceGridIds.z-=floor(u_offsetZ/float(GRID_SIZE))*2.;vec4 instanceRand1s=hash44(floor(vec4(offsetInstanceGridIds+.5,blockId+cluster)));v_rands=hash44(floor(vec4(offsetInstanceGridIds+.5,100.0)));float showRatio=u_showRatio;showRatio*=1.-step(10.5,instanceGridIds.z)*mod(u_offsetZ/float(GRID_SIZE),1.);
#ifdef IS_HD
pos=mix(center,pos,showRatio);
#else
pos.xy*=showRatio*showRatio;pos.z*=showRatio;
#endif
#ifdef IS_HD
pos.x-=blockId;float blockOffset=sin(u_time*2.+cos(u_time*4.+0.2+offsetInstanceGridIds.z))*0.15*instanceRand1s.y;float heightRatio=1.;pos.y=pos.y*height*heightRatio+(0.025+blockOffset);float variation=floor(instanceRand1s.x*8.);q=quaternion(vec3(0.,0.,variation>3.5 ?-1. : 1.),(mod(blockId,4.)+mod(variation,4.))*PI*0.5);pos=qrotate(q,pos);nor=qrotate(q,nor);tang=qrotate(q,tang);
#endif
q=quaternion(instanceAxis,PI*0.5);pos=qrotate(q,pos)*float(GRID_SIZE)+instancePos;nor=qrotate(q,nor);tang=qrotate(q,tang);pos.z+=mod(u_offsetZ,float(GRID_SIZE));v_depth=-pos.z;pos=goalBlackTunnelTransform(pos);
#ifdef IS_HD
v_ao=ao;v_emission=areaRatio<0.25 ? sin(pos.z*0.25-u_time)*0.5+0.5 : 0.;
#else
v_ao=1.;v_emission=0.;
#endif
v_opacity=linearStep(57.,30.,length(pos.xy))*linearStep(5.+100.,5.+100.-20.,cameraPosition.z/0.208-pos.z);v_worldPosition=(modelMatrix*vec4(pos,1.0)).xyz;v_worldTangent=vec4(inverseTransformDirection(normalMatrix*tang,viewMatrix),tangent.w);v_worldNormal=inverseTransformDirection(normalMatrix*nor,viewMatrix);v_uv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);}`;

export const blackFragment = `#define GLSLIFY 1
uniform sampler2D u_feedbackTexture;uniform sampler2D u_greebleBaseTexture;uniform sampler2D u_greebleArmbTexture;uniform sampler2D u_greebleNormalTexture;uniform vec2 u_resolution;uniform float u_outRatio;uniform vec3 u_outBloomFromToStrength;uniform vec3 u_color1;uniform vec3 u_color2;varying vec3 v_worldPosition;varying vec4 v_worldTangent;varying vec3 v_worldNormal;varying vec4 v_rands;varying float v_ao;varying float v_opacity;varying float v_emission;varying float v_depth;varying vec2 v_uv;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}void main(){vec2 screenUv=gl_FragCoord.xy/u_resolution;float faceDirection=gl_FrontFacing ? 1.0 :-1.0;vec3 worldNormal=normalize(v_worldNormal)*faceDirection;vec3 worldTangent=normalize(v_worldTangent.xyz)*faceDirection;vec3 worldBinormal=normalize(cross(worldNormal,worldTangent))*-v_worldTangent.w;worldTangent=normalize(cross(worldBinormal,worldNormal));vec3 tangentSpaceNormal=normalize(texture2D(u_greebleNormalTexture,v_uv).xyz-.5);worldNormal=normalize(tangentSpaceNormal.x*worldTangent+tangentSpaceNormal.y*worldBinormal+tangentSpaceNormal.z*worldNormal);vec4 armb=texture2D(u_greebleArmbTexture,v_uv);float ao=v_ao*armb.r;float roughness=armb.g;float metalness=armb.b;float albedo=texture2D(u_greebleBaseTexture,v_uv).r;vec3 lightPos=vec3(0.0,-0.0,-20.8);vec3 toLight=normalize(lightPos-v_worldPosition);float diffuse=(dot(worldNormal,toLight)*0.5+0.5);
#ifdef IS_HD
float feedbackMultiplier=2.5;
#else
float feedbackMultiplier=2.0;
#endif
vec3 color1=u_color1;vec3 color2=u_color2;vec3 baseColor=0.5+mix(color1,color2,v_rands.x)*1.2;vec3 emissiveColor=mix(color1,color2,v_rands.y)*3.5;diffuse*=(0.5+texture2D(u_feedbackTexture,screenUv+worldNormal.xy*0.02).r*feedbackMultiplier);gl_FragColor.rgb=baseColor*vec3(ao*0.75*diffuse)+emissiveColor*v_emission;gl_FragColor.rgb*=v_opacity;float endBloomStrength=linearStep(u_outBloomFromToStrength.x,u_outBloomFromToStrength.y,v_depth)*u_outBloomFromToStrength.z;float bloomScale=linearStep(5.0,20.0,v_depth)*(1.0-linearStep(15.0,25.0,length(v_worldPosition.xy/0.208)));gl_FragColor.a=bloomScale*max(0.,dot(gl_FragColor.rgb,vec3(.299,.587,.114))*2.5-1.)+endBloomStrength*0.75;gl_FragColor.rgb+=endBloomStrength*(0.35+gl_FragColor.rgb*0.65);}`;

export const whiteVertex = `#define GLSLIFY 1
attribute float a_instanceId;uniform float u_time;uniform float u_ratio;uniform float u_ratioInverse;varying vec3 v_worldPosition;varying vec3 v_worldNormal;varying vec3 v_localPosition;varying vec2 v_uv;varying vec3 v_viewPosition;varying float v_lengthRatio;varying float v_fog;vec3 deform(in vec3 pos){float origZ=pos.z;float blockCount=float(BLOCK_COUNT);float ratio=mix(.1,1.,u_ratioInverse);float lengthRatio=-pos.z/blockCount;float scalar=mix(0.25,ratio,lengthRatio);pos.x*=1.0+scalar*0.5*sin(lengthRatio*6.283184);pos.y*=1.0+scalar*0.5*cos(lengthRatio*6.283184+3.1415926);float angleRatio=smoothstep(0.25,1.,u_ratioInverse);float angle=(angleRatio+angleRatio*lengthRatio*lengthRatio*1.)*-6.283184;float s=sin(angle);float c=cos(angle);mat2 m=mat2(c,-s,s,c);pos.xy=m*pos.xy;pos.y+=ratio*sin(ratio*lengthRatio*3.141592*4.)*0.25;pos.z-=(cos(ratio*1.5+(1.0-ratio)*lengthRatio*3.141592*0.5)*0.5+0.5-1.0)*blockCount;pos.z*=1.0+16.0*(ratio*lengthRatio*lengthRatio)+2.0*ratio*(sin(8.0*lengthRatio)*0.5+0.5);pos.z*=(1.-ratio*ratio*ratio)*0.9+0.1;pos.z+=blockCount/4.;return pos*15.;}vec3 inverseTransformDirection(in vec3 dir,in mat4 matrix){return normalize((vec4(dir,0.0)*matrix).xyz);}void main(){float blockCount=float(BLOCK_COUNT);vec3 pos=position;pos.z-=a_instanceId;pos.z/=blockCount;float lengthRatio=-pos.z;pos.z*=blockCount;v_localPosition=pos;v_lengthRatio=lengthRatio;vec3 nor=deform(pos+normal*0.01);pos=deform(pos);nor=normalize(nor-pos);vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);v_viewPosition=mvPosition.xyz;v_fog=-0.005*mvPosition.z/mvPosition.w;gl_Position=projectionMatrix*mvPosition;v_worldPosition=(modelMatrix*vec4(pos,1.0)).xyz;v_worldNormal=inverseTransformDirection(normalMatrix*nor,viewMatrix);v_uv=uv;}`;

export const whiteFragment = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform float u_ratioInverse;uniform vec3 u_fbm;varying vec3 v_localPosition;varying vec2 v_uv;varying vec3 v_worldPosition;varying vec3 v_worldNormal;varying vec3 v_viewPosition;varying float v_lengthRatio;varying float v_fog;uniform float u_time;float sphOcclusion(in vec3 pos,in vec3 nor,in vec4 sph){vec3 di=sph.xyz-pos;float l=length(di);float nl=dot(nor,di/l);float h=l/sph.w;float h2=h*h;float k2=1.0-h2*nl*nl;return max(0.0,nl)/h2;}float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec4 hash(vec4 p4){p4=fract(p4*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}vec3 voronoi(const in vec4 x){vec4 p=floor(x);vec4 f=fract(x);float id=0.0;vec2 res=vec2(100.0);for(int l=-1;l<=1;l++){for(int k=-1;k<=1;k++){for(int j=-1;j<=1;j++){for(int i=-1;i<=1;i++){vec4 b=vec4(float(i),float(j),float(k),float(l));vec4 r=vec4(b)-f+hash(p+b);float d=dot(r,r);float cond=max(sign(res.x-d),0.0);float nCond=1.0-cond;float cond2=nCond*max(sign(res.y-d),0.0);float nCond2=1.0-cond2;id=(dot(p+b,vec4(1.0,57.0,113.0,421.))*cond)+(id*nCond);res=vec2(d,res.x)*cond+res*nCond;res.y=cond2*d+nCond2*res.y;}}}}return vec3(sqrt(res),abs(id));}vec4 hash(float p){vec4 p4=fract(vec4(p)*vec4(.1031,.1030,.0973,.1099));p4+=dot(p4,p4.wzxy+33.33);return fract((p4.xxyz+p4.yzzw)*p4.zywx);}void main(){vec4 sph=vec4(u_fbm.x*2.,u_fbm.y*2.+1.,0.,2.5);vec3 worldNormal=normalize(v_worldNormal);float ao=1.-sphOcclusion(v_worldPosition/0.208,worldNormal,sph)*2.*smoothstep(0.8,0.5,u_ratioInverse);float shade=texture2D(u_texture,v_uv).r;float brightness=pow(v_lengthRatio,5.);float t=u_ratioInverse*-2.+u_time*0.2;vec3 vn=voronoi(vec4(v_localPosition*2.+vec3(0.,0.,-t*0.5),t*0.25));vec4 rnd=hash(vn.z);float threshold=0.05+rnd.x*0.1;float r=abs(vn.x-.5)*(1.75+rnd.y*0.5);float pattern=max(0.,1.-smoothstep(threshold-fwidth(r),threshold,r));vec3 color=mix(vec3(0.102,0.184,0.984),vec3(1.),pattern);color*=(.35+shade)*ao;color+=brightness;gl_FragColor=vec4(color,shade+brightness);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(1.0),smoothstep(0.8,1.0,u_ratioInverse)*0.5);gl_FragColor.a*=ao*mix(1.,0.15,pattern);gl_FragColor+=linearStep(-10.,-11.,v_localPosition.z);}`;

export const glassFragment = `#define GLSLIFY 1
uniform sampler2D u_backgroundTexture;uniform vec2 u_resolution;varying vec3 v_viewPosition;varying vec3 v_localDir;vec3 hue2RGBSmooth(in float hue){vec3 rgb=clamp(abs(mod(hue*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);return rgb*rgb*(3.0-2.0*rgb);}void main(){vec3 fdx=dFdx(v_viewPosition);vec3 fdy=dFdy(v_viewPosition);vec3 viewNormal=normalize(cross(fdx,fdy));float alpha=abs(1.-viewNormal.z);vec3 localDir=normalize(v_localDir);vec2 uv=gl_FragCoord.xy/u_resolution.xy;vec3 bgColor=texture2D(u_backgroundTexture,uv).rgb;vec2 refl=reflect(normalize(v_viewPosition),viewNormal).xy;vec2 uvOffset=refl.xy*0.2*vec2(u_resolution.x/u_resolution.y,1.);vec3 color=texture2D(u_backgroundTexture,uv+uvOffset).rgb;color+=clamp(abs(mod((alpha)*8.+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0)*(1.-alpha)*(1.-bgColor);gl_FragColor=vec4(color,alpha);}`;

export const glassVertex = `#define GLSLIFY 1
attribute float piece;uniform sampler2D u_positionTexture;uniform sampler2D u_orientTexture;uniform vec2 u_textureSize;uniform float u_frameFrom;uniform float u_frameTo;uniform float u_frameRatio;uniform float u_fragmentScale;varying vec3 v_viewPosition;varying vec3 v_localDir;vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}void main(){vec4 animationUvs=(vec4(piece,u_frameFrom,piece,u_frameTo)+.5)/u_textureSize.xyxy;vec3 piecePosFrom=texture2D(u_positionTexture,animationUvs.xy).xyz;vec4 pieceOrientFrom=texture2D(u_orientTexture,animationUvs.xy);vec3 piecePosTo=texture2D(u_positionTexture,animationUvs.zw).xyz;vec4 pieceOrientTo=texture2D(u_orientTexture,animationUvs.zw);float radius=length(position)*u_fragmentScale;vec3 dir=position/max(length(position),0.000001);vec3 posFrom=qrotate(pieceOrientFrom,dir);vec3 posTo=qrotate(pieceOrientTo,dir);v_localDir=normalize(mix(posFrom,posTo,u_frameRatio));vec3 pos=v_localDir*radius+mix(piecePosFrom,piecePosTo,u_frameRatio);vec4 mvPosition=modelViewMatrix*vec4(pos,1.0);v_viewPosition=mvPosition.xyz;gl_Position=projectionMatrix*mvPosition;}`;

export const bloomHighPass = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform float u_luminosityThreshold;uniform float u_smoothWidth;uniform float u_amount;
#ifdef USE_HALO
uniform vec2 u_texelSize;uniform vec2 u_aspect;uniform float u_haloWidth;uniform float u_haloRGBShift;uniform float u_haloStrength;uniform float u_haloMaskInner;uniform float u_haloMaskOuter;
#ifdef USE_LENS_DIRT
uniform sampler2D u_dirtTexture;uniform vec2 u_dirtAspect;
#endif
#endif
#ifdef USE_CONVOLUTION
uniform float u_convolutionBuffer;
#endif
varying vec2 v_uv;void main(){vec2 uv=v_uv;
#ifdef USE_CONVOLUTION
uv=(uv-0.5)*(1.0+u_convolutionBuffer)+0.5;
#endif
vec4 texel=texture2D(u_texture,uv);vec3 luma=vec3(0.299,0.587,0.114);float v=dot(texel.xyz,luma);float alpha=texel.a*u_amount;gl_FragColor=vec4(texel.rgb*alpha,1.0);
#ifdef USE_HALO
vec2 toCenter=(uv-0.5)*u_aspect;vec2 ghostUv=1.0-(toCenter+0.5);vec2 ghostVec=(vec2(0.5)-ghostUv);vec2 direction=normalize(ghostVec);vec2 haloVec=direction*u_haloWidth;float weight=length(vec2(0.5)-fract(ghostUv+haloVec));weight=pow(1.0-weight,3.0);vec3 distortion=vec3(-u_texelSize.x,0.0,u_texelSize.x)*u_haloRGBShift;float zoomBlurRatio=fract(atan(toCenter.y,toCenter.x)*40.0)*0.05+0.95;ghostUv*=zoomBlurRatio;vec2 haloUv=ghostUv+haloVec;vec3 halo=vec3(texture2D(u_texture,haloUv+direction*distortion.r).r,texture2D(u_texture,haloUv+direction*distortion.g).g,texture2D(u_texture,haloUv+direction*distortion.b).b)*u_haloStrength*smoothstep(u_haloMaskInner,u_haloMaskOuter,length(toCenter));
#ifdef USE_LENS_DIRT
vec2 dirtUv=(uv-0.5)*u_dirtAspect+0.5;vec3 dirt=texture2D(u_dirtTexture,dirtUv).rgb;gl_FragColor.rgb+=(halo+alpha+0.05*dirt)*dirt;
#else
gl_FragColor.rgb+=halo;
#endif
#endif
#ifdef USE_CONVOLUTION
gl_FragColor.rgb*=max(abs(uv.x-0.5),abs(uv.y-0.5))>0.5 ? 0. : 1.;
#endif
}`;

export const bloomFft = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec2 u_texelSize;uniform float u_subtransformSize;uniform float u_normalization;uniform bool u_isForward;const float TWOPI=6.283185307179586;void main(){
#ifdef HORIZTONAL
float index=gl_FragCoord.x-.5;
#else
float index=gl_FragCoord.y-.5;
#endif
float evenIndex=floor(index/u_subtransformSize)*(u_subtransformSize*0.5)+mod(index,u_subtransformSize*0.5);
#ifdef HORIZTONAL
vec2 evenPos=vec2(evenIndex,gl_FragCoord.y)*u_texelSize;vec2 oddPos=evenPos+vec2(.5,0.);
#else
vec2 evenPos=vec2(gl_FragCoord.x,evenIndex)*u_texelSize;vec2 oddPos=evenPos+vec2(0.,.5);
#endif
vec4 even=texture2D(u_texture,evenPos);vec4 odd=texture2D(u_texture,oddPos);float twiddleArgument=(u_isForward ? TWOPI :-TWOPI)*(index/u_subtransformSize);vec2 twiddle=vec2(cos(twiddleArgument),sin(twiddleArgument));gl_FragColor=(even+vec4(twiddle.x*odd.xy-twiddle.y*odd.zw,twiddle.y*odd.xy+twiddle.x*odd.zw))*u_normalization;}`;

export const bloomKernel = `#define GLSLIFY 1
uniform vec2 u_aspect;uniform sampler2D u_texture;varying vec2 v_uv;void main(){vec2 toCenter=(fract(v_uv+0.5)-0.5)*u_aspect;vec2 rotToCenter=mat2(0.7071067811865476,-0.7071067811865476,0.7071067811865476,0.7071067811865476)*toCenter;float res=exp(-length(toCenter)*1.0)*0.05+exp(-length(toCenter)*7.5)*0.5+exp(-length(toCenter)*25.0)*1.+exp(-length(toCenter*vec2(1.0,10.0))*30.0)*20.+exp(-length(toCenter*vec2(1.0,20.0))*60.0)*300.+exp(-length(toCenter*vec2(10.0,1.0))*30.0)*20.+exp(-length(toCenter*vec2(20.0,1.0))*60.0)*300.+exp(-length(rotToCenter*vec2(1.0,8.0))*37.5)*12.+exp(-length(rotToCenter*vec2(1.0,20.0))*75.0)*300.+exp(-length(rotToCenter*vec2(20.0,1.0))*75.0)*300.;gl_FragColor=vec4(res,res,0.,0.);}`;

export const bloomMultiply = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform sampler2D u_kernelTexture;void main(){vec4 a=texture2D(u_texture,v_uv);vec4 b=texture2D(u_kernelTexture,v_uv);gl_FragColor=vec4(a.xy*b.xy-a.zw*b.zw,a.xy*b.zw+a.zw*b.xy);}`;
