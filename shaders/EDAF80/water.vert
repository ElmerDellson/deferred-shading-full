#version 410

layout (location = 0) in vec3 vertex;
layout (location = 2) in vec3 texcoord;

uniform mat4 vertex_model_to_world;
uniform mat4 normal_model_to_world;
uniform mat4 vertex_world_to_clip;
uniform float ellapsed_time;

out VS_OUT {
	vec3 vertex;
	vec3 tangent;
	vec3 binormal;
	vec3 normal;
	vec4 debug_color;
	vec2 texcoord;
} vs_out;

float wave(vec2 position, vec2 direction, float amplitude, float frequency, float phase, float sharpness, float time, out float wave_dx, out float wave_dz)
{
	wave_dx = (0.5 * sharpness * frequency * amplitude) * pow((sin((((direction.x * position.x) + (direction.y * position.y)) * frequency) + (time * phase))
			  * 0.5 + 0.5), (sharpness - 1)) * cos(((direction.x * position.x) + (direction.y * position.y)) * frequency + (time * phase)) * direction.x;

	wave_dz = (0.5 * sharpness * frequency * amplitude) * pow((sin((((direction.x * position.x) + (direction.y * position.y)) * frequency) + (time * phase)) 
			  * 0.5 + 0.5), (sharpness - 1)) * cos(((direction.x * position.x) + (direction.y * position.y)) * frequency + (time * phase)) * direction.y;

	return amplitude * pow(sin((position.x * direction.x + position.y * direction.y) * frequency + time * phase) * 0.5 + 0.5, sharpness);
}

void main()
{
	vs_out.texcoord = texcoord.xy;

	vec3 displaced_vertex = vertex;

	float wave_dx_1;
	float wave_dx_2;
	float wave_dz_1;
	float wave_dz_2;

	float wave_dx_3;
	float wave_dz_3;

	float wave_1 = wave(vertex.xz, vec2(-1.0, -0.7), 1.0, 0.1, 0.5, 2.0, ellapsed_time / 10, wave_dx_1, wave_dz_1);
	float wave_2 = wave(vertex.xz, vec2(-0.7, 0.7), 0.5, 0.4, 1.3, 2.0, ellapsed_time, wave_dx_2, wave_dz_2);
	float wave_3 = wave(vertex.xz, vec2(0.0, 1.0), 1, 0.1, 1.3, 2.0, ellapsed_time * 5, wave_dx_3, wave_dz_3);

	displaced_vertex.y = displaced_vertex.y + wave_1 + wave_3;

	float wave_dx = wave_dx_1 + wave_dx_3;
	float wave_dz = wave_dz_1 + wave_dz_3;

	vec3 tangent = normalize(vec3(1, wave_dx, 0));
	vec3 binormal = normalize(vec3(0, wave_dz, 1));
	vec3 normal = normalize(vec3(-wave_dx, 1, -wave_dz));

	vs_out.vertex = vec3(vertex_model_to_world * vec4(displaced_vertex, 1.0));
	vs_out.tangent = tangent;
	vs_out.binormal = binormal;
	vs_out.normal = normal;
	vs_out.debug_color = vec4(texcoord, 1);

	gl_Position = vertex_world_to_clip * vertex_model_to_world * vec4(displaced_vertex, 1.0);
}
