#version 410

uniform sampler2D depth_texture;
uniform bool has_diffuse_texture;
uniform bool has_specular_texture;
uniform bool has_normals_texture;
uniform bool has_opacity_texture;
uniform sampler2D diffuse_texture;
uniform sampler2D specular_texture;
uniform sampler2D normals_texture;
uniform sampler2D opacity_texture;
uniform mat4 normal_model_to_world;

uniform float near;
uniform float far;

in VS_OUT {
	vec3 normal;
	vec2 texcoord;
	vec3 tangent;
	vec3 binormal;
} fs_in;

layout (location = 0) out vec4 geometry_diffuse;
layout (location = 1) out vec4 geometry_specular;
layout (location = 2) out vec4 geometry_normal;

float lineariseDepth(float value)
{
	return (2.0 * near) / (far + near - value * (far - near));
}

void main()
{
	if (has_opacity_texture && texture(opacity_texture, fs_in.texcoord).r < 1.0)
		discard;

	// Diffuse color
	geometry_diffuse = vec4(0.0f);
	if (has_diffuse_texture)
		geometry_diffuse = texture(diffuse_texture, fs_in.texcoord);

	// Specular color
	geometry_specular = vec4(0.0f);
	if (has_specular_texture)
		geometry_specular = texture(specular_texture, fs_in.texcoord);
	//float lin_depth = lineariseDepth(texture(depth_texture, fs_in.texcoord).r); This does not work :(
	//geometry_specular = vec4(lin_depth, lin_depth, lin_depth, 1.0);

	// World space normal
	if (has_normals_texture) {
		vec3 tangent_space_normal = (2 * texture(normals_texture, fs_in.texcoord).xyz) - vec3(1.0);
		vec3 object_space_normal = mat3(fs_in.tangent, fs_in.binormal, fs_in.normal) * tangent_space_normal;
		vec3 world_space_normal = normalize(vec3(normal_model_to_world * vec4(object_space_normal, 0.0)));

		geometry_normal.xyz = (world_space_normal + 1) / 2;
	} else {
		geometry_normal.xyz = (fs_in.normal + 1) / 2;
	}

}
