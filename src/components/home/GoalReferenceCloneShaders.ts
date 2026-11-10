/** Adapted from GoalTunnelAstronauts (archived blob 0c57277a2102a61f761357ce2cd432d035cd0a13).
 * Black-only clones never use the later linear exit-animation branch. Keep the
 * captured two-influence, transformed-point blend, including its from-frame
 * normal/tangent ordering; the approved primary astronaut is not changed.
 * No packed ARMB render target is needed: clones only consume ARM.b, not albedo.
 */
export const goalCloneVertex = `#define GLSLIFY 1
uniform float u_time;uniform sampler2D u_animationPositionTexture;uniform sampler2D u_animationOrientTexture;uniform vec2 u_animationTextureSize;attribute vec2 boneIndices;attribute vec2 boneWeights;attribute vec4 tangent;attribute float ao;attribute vec3 instancePos;attribute vec4 instanceOrient;attribute vec3 instanceAnimationFrameFromToBlend1;varying vec3 v_worldPosition;varying vec4 v_worldTangent;varying vec3 v_worldNormal;varying vec3 v_viewPosition;varying vec2 v_uv;varying float v_ao;
#define PI 3.14159265359
vec3 inverseTransformDirection(in vec3 dir,in mat4 matrix){return normalize((vec4(dir,0.0)*matrix).xyz);}vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}void computeTransform(inout vec3 pos,inout vec3 nor,inout vec3 tang,vec4 uvBone12){vec3 bonePos1=texture2D(u_animationPositionTexture,uvBone12.xy).xyz;vec3 bonePos2=texture2D(u_animationPositionTexture,uvBone12.zw).xyz;vec4 boneOrient1=texture2D(u_animationOrientTexture,uvBone12.xy);vec4 boneOrient2=texture2D(u_animationOrientTexture,uvBone12.zw);pos=(qrotate(boneOrient1,pos)+bonePos1)*boneWeights.x+(qrotate(boneOrient2,pos)+bonePos2)*boneWeights.y;nor=normalize(qrotate(boneOrient1,nor)*boneWeights.x+qrotate(boneOrient2,nor)*boneWeights.y);tang=normalize(qrotate(boneOrient1,tang)*boneWeights.x+qrotate(boneOrient2,tang)*boneWeights.y);}void computeFrameTransform(inout vec3 pos,inout vec3 nor,inout vec3 tang,vec3 instanceAnimationFrameFromToBlend){vec4 dataOffset=boneIndices.xyxy+instanceAnimationFrameFromToBlend.xxyy*float(BONE_COUNT)+0.5;vec4 fromUvsBone12=vec4(floor(mod(dataOffset.xy,u_animationTextureSize.x))+.5,floor(dataOffset.xy/u_animationTextureSize.x)+.5).xzyw/u_animationTextureSize.xyxy;vec4 toUvsBone12=vec4(floor(mod(dataOffset.zw,u_animationTextureSize.x))+.5,floor(dataOffset.zw/u_animationTextureSize.x)+.5).xzyw/u_animationTextureSize.xyxy;vec3 fromPos=pos;vec3 fromNor=nor;vec3 fromTang=tang.xyz;computeTransform(fromPos,fromTang,fromNor,fromUvsBone12);vec3 toPos=pos;vec3 toNor=nor;vec3 toTang=tang.xyz;computeTransform(toPos,toNor,toTang,toUvsBone12);pos=mix(fromPos,toPos,instanceAnimationFrameFromToBlend.z);nor=mix(fromNor,toNor,instanceAnimationFrameFromToBlend.z);tang=mix(fromTang,toTang,instanceAnimationFrameFromToBlend.z);}void main(){v_ao=ao;vec3 posLoop=position;vec3 norLoop=normal;vec3 tangLoop=tangent.xyz;computeFrameTransform(posLoop,norLoop,tangLoop,instanceAnimationFrameFromToBlend1);vec3 pos=posLoop;vec3 nor=norLoop;vec3 tang=tangLoop;pos=qrotate(instanceOrient,pos)+instancePos.xyz;nor=normalize(qrotate(instanceOrient,nor));tang=normalize(qrotate(instanceOrient,tang));vec4 mvPos=modelViewMatrix*vec4(pos,1.0);v_worldPosition=(modelMatrix*vec4(pos,1.0)).xyz;v_worldTangent=vec4(inverseTransformDirection(normalMatrix*tang,viewMatrix),tangent.w);v_worldNormal=inverseTransformDirection(normalMatrix*nor,viewMatrix);v_uv=uv;v_viewPosition=-mvPos.xyz;gl_Position=projectionMatrix*mvPos;}`;

export const goalCloneFragment = `uniform sampler2D u_feedbackTexture,u_armTexture,u_normalTexture;
uniform float u_alpha,u_endRatio;
varying vec3 v_worldPosition,v_worldNormal;
varying vec4 v_worldTangent;
varying vec2 v_uv;
varying float v_ao;
vec2 cartesianToPolar(vec3 n){return vec2(atan(n.z,n.x)*0.15915494+0.5,asin(n.y)*0.31830988618+0.5);}
void main(){
  vec3 worldNormal=normalize(v_worldNormal);
  vec3 worldTangent=normalize(v_worldTangent.xyz);
  vec3 worldBinormal=normalize(cross(worldNormal,worldTangent))*-v_worldTangent.w;
  worldTangent=normalize(cross(worldBinormal,worldNormal));
  vec3 tangentSpaceNormal=normalize(texture2D(u_normalTexture,v_uv).xyz-.5);
  worldNormal=normalize(tangentSpaceNormal.x*worldTangent+tangentSpaceNormal.y*worldBinormal+tangentSpaceNormal.z*worldNormal);
  float metalness=texture2D(u_armTexture,v_uv).b;
  vec3 V=normalize(cameraPosition-v_worldPosition);
  vec3 reflection=normalize(reflect(-V,worldNormal));
  float NdV=clamp(abs(dot(worldNormal,V)),0.001,1.0);
  float fresnel=pow(1.0-NdV,5.0);
  vec3 blackTunnelEnvDiff=texture2D(u_feedbackTexture,0.25*cartesianToPolar(worldNormal)).rgb;
  vec3 blackTunnelEnvSpec=texture2D(u_feedbackTexture,0.25*cartesianToPolar(reflection)).rgb*(0.2+metalness*0.7)*2.;
  gl_FragColor.rgb=(blackTunnelEnvDiff*3.5*blackTunnelEnvDiff+blackTunnelEnvSpec*3.5)*v_ao*u_alpha*(0.5+fresnel*0.9);
  gl_FragColor.a=mix(max(gl_FragColor.r,max(gl_FragColor.g,gl_FragColor.b))*u_alpha,0.,u_endRatio);
}`;
