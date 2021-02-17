#version 410

uniform vec3 light_position;
uniform vec3 camera_position;
uniform samplerCube my_cube_map;
uniform float ellapsed_time;
uniform mat4 normal_model_to_world;
uniform sampler2D normal_map;

in VS_OUT {
	vec3 vertex;
	vec3 tangent;
	vec3 binormal;
	vec3 normal;
	vec4 debug_color;
	vec2 texcoord;
} fs_in;

out vec4 frag_color;

void main()
{
	vec2 texScale = vec2(8, 4);
	float normalTime= mod(ellapsed_time, 100.0);
	vec2 normalSpeed = vec2(0.5, 0);

	vec3 normalCoord0;
	vec3 normalCoord1;
	vec3 normalCoord2;

	normalCoord0.xy = fs_in.texcoord * texScale		+ normalTime * normalSpeed;
	normalCoord1.xy = fs_in.texcoord * texScale * 2	+ normalTime * normalSpeed * 4;
	normalCoord2.xy = fs_in.texcoord * texScale * 4	+ normalTime * normalSpeed * 8;

	vec4 n_0 = 2 * texture(normal_map, normalCoord0.xy) - vec4(1);
	vec4 n_1 = 2 * texture(normal_map, normalCoord1.xy) - vec4(1);
	vec4 n_2 = 2 * texture(normal_map, normalCoord2.xy) - vec4(1);

	vec3 n_bump = normalize(n_0.xyz + n_1.xyz + n_2.xyz);

	vec3 object_space_normal = mat3(normalize(fs_in.tangent), normalize(fs_in.binormal), normalize(fs_in.normal)) * n_bump;

	vec3 world_space_normal = normalize(vec3(normal_model_to_world * vec4(object_space_normal, 0.0)));

	vec4 color_deep = vec4(0.0, 0.0, 0.1, 1.0);
	vec4 color_shallow = vec4(0.0, 0.5, 0.5, 1.0);

	vec3 L = normalize(light_position - fs_in.vertex);
	vec3 V = normalize(camera_position - fs_in.vertex);
	vec3 R = reflect(-V, world_space_normal);

	float facing = 1 - max(dot(V, world_space_normal ), 0);

	vec4 water_color = mix(color_deep, color_shallow, facing);

	float fastFresnel = 0.02037 + (1 - 0.02037) * pow((1-dot(V, world_space_normal)), 5);

	frag_color = (water_color) + texture(my_cube_map, R) * fastFresnel + (texture(my_cube_map, refract(-V, world_space_normal, 1/1.33)) * (1-fastFresnel));
}
