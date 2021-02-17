#version 410

layout (location = 0) out vec4 frag_color;

uniform int ssao_radius;
uniform int ssao_power;
uniform bool ssao_range_check;

uniform float far;
uniform float near;

uniform vec2 inv_res;
uniform vec3 samples[64];

uniform mat4 NormalWorldToViewMatrix;
uniform mat4 WorldToViewMatrix;
uniform mat4 ViewToClipMatrix;
uniform mat4 view_projection_inverse;

uniform sampler2D depth_texture; //screen space, as usual
uniform sampler2D normal_texture; //world space
uniform sampler2D tex_noise;

in VS_OUT {
	vec2 texcoord;
} fs_in;

//tile noise texture over screen, based on screen dimensions divided by noise size
vec2 noiseScale = vec2((1.0/inv_res.x)/4.0, (1.0/inv_res.y)/4.0);

void main()
{
	vec3 randomVec = (texture(tex_noise, fs_in.texcoord * noiseScale).xyz);
	
	vec3 normal = (NormalWorldToViewMatrix * ((texture(normal_texture, gl_FragCoord.xy * inv_res) * 2.0) - vec4(1.0))).xyz; //normal in view space
	vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
	vec3 bitangent = cross(normal, tangent);
	mat3 TBN = mat3(tangent, bitangent, normal); //In view space

	float depth = (((texture(depth_texture, gl_FragCoord.xy * inv_res).r) * 2) - 1); //Normalized screen space
	vec2 NDC = (((gl_FragCoord.xy * inv_res) * 2) - 1); //NDC, but only x and y
	vec4 world_space_temp = (view_projection_inverse * (vec4(NDC, depth, 1.0))); //Almost world space
	vec3 world_space_pos = world_space_temp.xyz / world_space_temp.w; //World space
	vec3 view_space_pos = (WorldToViewMatrix * vec4(world_space_pos, 1.0)).xyz; //View space

	int kernelSize = 64;
	float radius = ssao_radius;
	float bias = 0.0;

	float occlusion = 0.0;
	for(int i = 0; i < kernelSize; ++i)
	{
		vec3 sample_pos = TBN * samples[i];
		sample_pos = view_space_pos + sample_pos * radius; //In view space

		vec4 offset = vec4(sample_pos, 1.0);
		offset = ViewToClipMatrix * offset; //From view to clip space
		offset.xyz /= offset.w; //Perspective divide to NDC
		offset.xyz = offset.xyz * 0.5 + 0.5; //Normalized screen space
		float depth_at_sample = texture(depth_texture, offset.xy).r; //Normalized screen space
		vec3 stored_depth_pos = (vec3(offset.xy, depth_at_sample) * 2.0) - vec3(1.0); //NDC
		vec4 stored_world_space_depth_pos_temp = view_projection_inverse * vec4(stored_depth_pos, 1.0); //Almost world space
		vec3 stored_world_space_depth_pos = stored_world_space_depth_pos_temp.xyz / stored_world_space_depth_pos_temp.w; //World space
		vec4 stored_view_space_depth_pos = WorldToViewMatrix * vec4(stored_world_space_depth_pos, 1.0); //View space

		if (ssao_range_check) {
			float rangeCheck = smoothstep(0.0, 1.0, radius / abs(stored_view_space_depth_pos.z - sample_pos.z));
			occlusion += (stored_view_space_depth_pos.z >= sample_pos.z + bias ? 1.0 : 0.0) * rangeCheck;
		} else {
			occlusion += (stored_view_space_depth_pos.z >= sample_pos.z + bias ? 1.0 : 0.0);
		}
	}

	occlusion = pow(1.0 - (occlusion / kernelSize), ssao_power/10.0);
	frag_color = vec4(occlusion, occlusion, occlusion, 1.0);
}

