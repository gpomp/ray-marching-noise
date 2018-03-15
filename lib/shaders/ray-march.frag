precision highp float;

#pragma glslify: PI = require('glsl-pi')

uniform float iTime;
uniform float paletteX;
uniform vec2 iResolution;
uniform vec2 mouse;
uniform vec3 eye;
uniform sampler2D noiseMap;
uniform sampler2D heightMap;
uniform sampler2D colorPalette;
varying vec2 vUv;

const int MAX_MARCHING_STEPS = 100;
const float MIN_DIST = 0.0;
const float MAX_DIST = 10.0;
const float EPSILON = 0.001;

#pragma glslify: cubeSDF = require(./util/ray-marching/cubeSDF.glsl)
#pragma glslify: translateMat4 = require(./util/ray-marching/translateMat4.glsl)
#pragma glslify: inverse = require(glsl-inverse)

float getTex(vec3 p) {
    vec2 pNormalize = (p.xy + vec2(1.5, 1.5)) / vec2(3.0, 3.0) + vec2(0.0, 0.0);
    vec3 noise = texture2D(noiseMap, mod((pNormalize * 4.0 + vec2(0.0, (sin(iTime * 0.001) + 1.0) * iTime * 0.008)), vec2(1.0, 1.0))).rgb;
    // vec2 pNormScale = (pNormalize - vec2(0.5, 0.5)) * (1.0 + mod(noise.b * noise.g, 1.0)) + vec2(0.5, 0.5);
    // vec2 pNormScale = pNormalize + vec2(cos((iTime) * 0.1 + noise.g), sin((iTime) * 0.1 + noise.b)) * (noise.g * 0.1);
    return texture2D(heightMap, mod(pNormalize, vec2(1.0, 1.0))).r * ((noise.r * noise.g * noise.b));
}

float customSDF(vec3 p) {
    // smoothstep(0.2, 1.0, abs(pNormalize.x * 2.0 - 1.0)) * 
    // return cubeSDF(p, vec3(1.5, 1.5, 0.05 + tex * 0.3 + strip * 6.0 + (sin((pNormalize.x * strip1 + ((strip1 * iTime))) * 4.0) * 0.3) + 1.0) * 0.75);
    return cubeSDF(p, vec3(1.5, 1.5, 0.05 + pow(floor(getTex(p) * 200.0) / 200.0 * 0.4, 0.85)));
}

/* float customSDF(vec3 p) {
    vec2 pNormalize = (p.xy + vec2(1.5, 1.5)) / vec2(3.0, 3.0);
    vec3 noise = texture2D(noiseMap, mod((pNormalize * 0.1 + vec2(iTime * 0.005, 0.0)), vec2(1.0, 1.0))).rgb;
    float tex = texture2D(heightMap, pNormalize).r;
    vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(0.3, 1.0);
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
} */
 
/**
 * Signed distance function describing the scene.
 * 
 * Absolute value of the return value indicates the distance to the surface.
 * Sign indicates whether the point is inside or outside the surface,
 * negative indicating inside.
 */
float sceneSDF(vec3 samplePoint) {
    return customSDF(samplePoint);
}

#pragma glslify: shortestDistanceToSurface = require(./util/ray-marching/shortestDistanceToSurface.glsl, iTime=iTime, MAX_MARCHING_STEPS=MAX_MARCHING_STEPS, sceneSDF=sceneSDF, EPSILON=EPSILON)

#pragma glslify: rayDirection = require(./util/ray-marching/rayDirection.glsl, iTime=iTime)

#pragma glslify: estimateNormal = require(./util/ray-marching/estimateNormal.glsl, iTime=iTime, sceneSDF=sceneSDF, EPSILON=EPSILON)

#pragma glslify: phongIllumination = require(./util/ray-marching/phongIllumination.glsl, iTime=iTime,estimateNormal=estimateNormal)

#pragma glslify: viewMatrix = require(./util/ray-marching/viewMatrix.glsl)

void main()
{
    float t = iTime * 0.1;
    vec3 viewDir = rayDirection(60.0, iResolution.xy, gl_FragCoord.xy);
    float radius = 8.0;
    
    mat4 viewToWorld = viewMatrix(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
    
    vec3 worldDir = (viewToWorld * vec4(viewDir, 0.0)).xyz;
    
    float dist = shortestDistanceToSurface(eye, worldDir, MIN_DIST, MAX_DIST);
    // vec4 mouseVal = vec4(vec3(0.0, 0.0, step(distance(mouse, gl_FragCoord.xy / iResolution.xy), 0.1)), 1.0);
    
    if (dist > MAX_DIST - EPSILON) {
        // Didn't hit anything
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
    }
    
    // The closest point on the surface to the eyepoint along the view ray
    vec3 p = eye + dist * worldDir;

    
    // smoothstep(0.2, 1.0, abs(pNormalize.x * 2.0 - 1.0)) * 
    // return cubeSDF(p, vec3(1.5, 1.5, 0.05 + tex * 0.3 + strip * 6.0 + (sin((pNormalize.x * strip1 + ((strip1 * iTime))) * 4.0) * 0.3) + 1.0) * 0.75);
    float z = mod(floor(getTex(p) * 200.0) / 200.0 * 50.0, 1.0);

    
    vec3 K_a = texture2D(colorPalette, vec2(paletteX, z)).rgb;
    vec3 K_d = vec3(1.0, 1.0, 1.0);
    vec3 K_s = vec3(0.1, 0.1, 0.1);
    float shininess = 100.0;
    
    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);

    gl_FragColor = vec4(color, 1.0);
    // gl_FragColor = vec4(vec3((gl_FragCoord.xy / iResolution.xy), 1.0), 1.0);
    // gl_FragColor += mouseVal;
}
