#version 410

uniform sampler2D my_normal_map;
uniform sampler2D my_2D_texture;
uniform mat4 normal_model_to_world;
uniform int use_normal_mapping;
uniform vec3 light_position;
uniform vec3 camera_position;
uniform vec3 ambient;
uniform vec3 diffuse;
uniform vec3 specular;
uniform float shininess;

in VS_OUT {
	vec3 vertex;
	vec3 normal;
	vec3 binormal;
	vec3 tangent;
	vec2 texcoord;
} fs_in;

out vec3 frag_color;

void main()
{
	vec3 L = normalize(light_position - fs_in.vertex);
	vec3 V = normalize(camera_position - fs_in.vertex);

	vec3 tangent_space_normal = (2 * texture(my_normal_map, fs_in.texcoord).xyz) - vec3(1.0);
	vec3 object_space_normal = mat3(fs_in.tangent, fs_in.binormal, fs_in.normal) * tangent_space_normal;
	vec3 world_space_normal = vec3(normal_model_to_world * vec4(object_space_normal, 0.0));

	frag_color = ambient + texture(my_2D_texture, fs_in.texcoord).xyz * clamp(dot(world_space_normal, L), 0.0, 1.0) +
				 specular * pow(clamp(dot(reflect(-L, world_space_normal), V), 0.0, 1.0), shininess);
}
