#version 410

in VS_OUT {
	vec3 normal;
} fs_in;

uniform samplerCube my_cube_map;

out vec4 frag_color;

void main()
{
	frag_color = texture(my_cube_map, fs_in.normal);
}
