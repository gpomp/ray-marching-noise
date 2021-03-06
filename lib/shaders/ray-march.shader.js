const glslify = require('glslify');
const path = require('path');

module.exports = require('shader-reload')({
  vertex: glslify(path.resolve(__dirname, `../shaders/ray-march.vert`)),
  fragment: glslify(path.resolve(__dirname, `../shaders/ray-march.frag`))
});
