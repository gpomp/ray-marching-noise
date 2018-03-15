vec3 opTx( vec3 p, mat4 m )
{
    return inverse(m) * p;
}

#pragma glslify: export(opTx)

