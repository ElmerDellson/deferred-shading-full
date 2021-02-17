#version 410
out vec4 FragColor;

uniform int aperture;

uniform mat4 WorldToViewMatrix;
uniform mat4 ViewToClipMatrix;
uniform mat4 view_projection_inverse;

uniform vec2 inv_res;

uniform sampler2D resolve_texture;
uniform sampler2D depth_texture;

in VS_OUT {
	vec2 texcoord;
} fs_in;


void main() {

	vec2 crosshair = (1 / inv_res) / 2.0;

	float A = aperture;

	float I = 100.0;

	float P_depth = (((texture(depth_texture, crosshair * inv_res).r) * 2) - 1);
	vec2 P_NDC = (((crosshair * inv_res) * 2) - 1);
	vec4 P_world_space_temp = (view_projection_inverse * (vec4(P_NDC, P_depth, 1.0)));
	vec3 P_world_space_pos = P_world_space_temp.xyz / P_world_space_temp.w;
	float P = (WorldToViewMatrix * vec4(P_world_space_pos, 1.0)).z;

	float F = 1 / (1/P + 1/I);

	float depth = (((texture(depth_texture, gl_FragCoord.xy * inv_res).r) * 2) - 1); //Depth in NDC
	vec2 NDC = (((gl_FragCoord.xy * inv_res) * 2) - 1); //x and y coordinates in NDC
	vec4 world_space_temp = (view_projection_inverse * (vec4(NDC, depth, 1.0))); //Almost world space
	vec3 world_space_pos = world_space_temp.xyz / world_space_temp.w; //World space
	vec3 view_space_pos = (WorldToViewMatrix * vec4(world_space_pos, 1.0)).xyz; //View space
	float D = view_space_pos.z;

	float CoC = abs(A * (F * (P - D)) / (D * (P - F)));

	//Blurring
	vec4 final = vec4(1.0, 1.0, 1.0, 1.0);

	if (CoC >= 2) {
		int samples = 2 * clamp(int(CoC), 2, 20);

		vec2 texelSize = 1.0 / vec2(textureSize(resolve_texture, 0));

		vec4 result = vec4(0.0);
		float samples_taken = 0.0;
		for (int x = -(samples/2); x < (samples/2); ++x)
		{
			for (int y = -(samples/2); y < (samples/2); ++y)
			{
				vec2 offset = vec2(float(x), float(y));// * texelSize;
				vec2 sample_pos = gl_FragCoord.xy + offset; //Screen space

				float sample_depth = (((texture(depth_texture, sample_pos * inv_res).r) * 2) - 1); //Depth in NDC
				vec2 sample_NDC = (((sample_pos * inv_res) * 2) - 1); //x and y in NDC
				vec4 sample_world_space_temp = (view_projection_inverse * (vec4(sample_NDC, sample_depth, 1.0))); //Almost world space
				vec3 sample_world_space_pos = sample_world_space_temp.xyz / sample_world_space_temp.w; //World space
				vec3 sample_view_space_pos = (WorldToViewMatrix * vec4(sample_world_space_pos, 1.0)).xyz; //View space

				float DOF_range = 20.0;

				if (DOF_range < length(P - sample_view_space_pos.z)) {
					result += texture(resolve_texture, sample_pos * inv_res);
				} else {
					result += texture(resolve_texture, (gl_FragCoord.xy + (offset * (-1.0))) * inv_res);
				}
			}
		}

		final = result / pow(samples, 2);
	} else {
		final = texture(resolve_texture, fs_in.texcoord);
	}

	FragColor = final;
}
