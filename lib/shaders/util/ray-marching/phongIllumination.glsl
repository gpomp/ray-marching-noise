/**
 * Lighting contribution of a single point light source via Phong illumination.
 * 
 * The vec3 returned is the RGB color of the light's contribution.
 *
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 * lightPos: the position of the light
 * lightIntensity: color/intensity of the light
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));
    
    float dotLN = dot(L, N);
    float dotRV = dot(R, V);
    
    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    } 
    
    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

/* vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
	vec3 normal = estimateNormal(p);
	// gLightDirection is normalized
	vec3 lightVec = -lightPos; 

	// normal is the bumbed normal
	float diffuseFac = dot(lightVec, normal.xyz); 

	// check if light is coming from behind
    if (diffuseFac <= 0.0) {
        return vec3(0.0, 0.0, 0.0);
    }


	// use reflect function from hlsl, toEye is normalize(camPos - pixelWorldPos);
	vec3 v = reflect(-lightVec, normal.xyz); 
	float specFac = pow(max(dot(v, eye), 0.0), alpha);

	//matD is my diffuse material, isLight is a bool, if it is false, diffuse will be evaluated to 0
	vec3 diffuse = k_d * diffuseFac; 

	// matS is my specular material
	vec3 spec = specFac * k_s; 

	// final color, diffuse and specular are in color of the light, but maybe reduces by some shadows
	return ((diffuse + spec) * lightIntensity);
} */

/**
 * Lighting via Phong illumination.
 * 
 * The vec3 returned is the RGB color of that point after lighting is applied.
 * k_a: Ambient color
 * k_d: Diffuse color
 * k_s: Specular color
 * alpha: Shininess coefficient
 * p: position of point being lit
 * eye: the position of the camera
 *
 * See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
 */
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    
    vec3 light1Pos = vec3(0.0,
                          1.0,
                          2.0);
    vec3 light1Intensity = vec3(0.75, 0.75, 0.75);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);
    
    /* vec3 light2Pos = vec3(-2.0,
                          -3.0,
                          1.0);
    vec3 light2Intensity = vec3(0.5, 0.5, 0.5);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);  */
    return color;
}

#pragma glslify: export(phongIllumination)
