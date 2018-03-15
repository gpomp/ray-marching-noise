const rayMarchShader = require('../shaders/ray-march.shader');


module.exports = function (app, opts = {}) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const rayCamera = new THREE.Object3D();
  rayCamera.position.set(0, 1, 1);
  const quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.RawShaderMaterial({
    vertexShader: rayMarchShader.vertex,
    fragmentShader: rayMarchShader.fragment,
    depthTest: false,
    depthWrite: false,
    uniforms: Object.assign({}, {
      iTime: { type: 'f', value: 1000 },
      eye: { type: 'v3', value: rayCamera.position.clone() },
      iResolution: { type: 'v2', value: new THREE.Vector2() },
    }, opts.uniforms || {})
  }));

  rayMarchShader.on('change', () => {
    quad.material.vertexShader = rayMarchShader.vertex;
    quad.material.fragmentShader = rayMarchShader.fragment;
    quad.material.needsUpdate = true;
  });

  const controls = app.controls;
  const target = new THREE.Vector3(0, 0, 0);
  controls.distanceBounds = [0.6, 2];
  controls.distance = 1;

  app.on('resize', resize);
  resize();

  return {
    object3d: quad,
    camera,
    update: (dt, state) => {
      quad.material.uniforms.iTime.value += dt;
      quad.material.uniforms.eye.value.copy(rayCamera.position);


      controls.update();
      quad.material.uniforms.eye.value.fromArray(controls.position);
      // target.fromArray(controls.direction).add(camera.position);
      camera.lookAt(target);
    }
  };

  function resize () {
    quad.material.uniforms.iResolution.value.x = app.width;
    quad.material.uniforms.iResolution.value.y = app.height;
  }
}
