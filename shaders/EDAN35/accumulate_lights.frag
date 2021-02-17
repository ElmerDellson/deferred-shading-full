#version 410

uniform sampler2D depth_texture;
uniform sampler2D normal_texture;
uniform sampler2DShadow shadow_texture;

uniform vec2 inv_res;

uniform mat4 view_projection_inverse;
uniform vec3 camera_position;
uniform mat4 shadow_view_projection;

uniform vec3 light_color;
uniform vec3 light_position;
uniform vec3 light_direction;
uniform float light_intensity;
uniform float light_angle_falloff;

uniform vec2 shadowmap_texel_size;

layout (location = 0) out vec4 light_diffuse_contribution;
layout (location = 1) out vec4 light_specular_contribution;

void main()
{
	vec3 normal = ((texture(normal_texture, gl_FragCoord.xy * inv_res).rgb) * 2) - 1;

	float depth = (((texture(depth_texture, gl_FragCoord.xy * inv_res).r) * 2) - 1);

	vec2 NDC = (((gl_FragCoord.xy * inv_res) * 2) - 1);
	vec4 world_space_temp = (view_projection_inverse * (vec4(NDC, depth, 1.0)));
	vec3 world_space_pos = world_space_temp.xyz / world_space_temp.w;

	vec3 L = normalize(light_position - world_space_pos);
	vec3 V = normalize(camera_position - world_space_pos);

	float max_light_dist = 2500;

	float distance_falloff = 1 - clamp((pow(length(light_position - world_space_pos), 2) / pow(max_light_dist, 2)), 0.0, 1.0);
	float angular_falloff = light_angle_falloff - smoothstep(0.0, light_angle_falloff, acos(dot(normalize(light_direction), -L)));

	vec3 diffuse_light = vec3(1.0, 1.0, 1.0); //light_color;
	vec3 specular_light = vec3(1.0, 1.0, 1.0); //light_color;
	int shininess = 10;

	//SHADOWS
	vec4 shadow_temp = shadow_view_projection * vec4(world_space_pos, 1.0);
	vec3 light_space_pos = shadow_temp.xyz / shadow_temp.w; //NDC
	light_space_pos.xyz = light_space_pos.xyz * 0.5 + 0.5; //Normalized Screen Space

	float[9] shadow_samples;

	for (int i = 0; i < 3; i++) {
		for (int j = 0; j < 3; j++) {
			 shadow_samples[(3 * i) + j] = texture(shadow_texture, vec3((light_space_pos.x + (i - 1) * shadowmap_texel_size.x), (light_space_pos.y + (j - 1) * shadowmap_texel_size.y), light_space_pos.z));
		}
	}

	float temp = 0;

	for (int i = 0; i < 9; i++) {
		temp = temp + shadow_samples[i];
	}

	float in_shadow = temp / 9;

	light_diffuse_contribution = in_shadow * vec4(angular_falloff * distance_falloff * (diffuse_light * clamp(dot(normal, L), 0.0, 1.0)), 1.0);

	light_specular_contribution = in_shadow * vec4(angular_falloff * distance_falloff * (specular_light * pow(clamp(dot(reflect(-L, normal), V), 0.0, 1.0), shininess)), 1.0); 
}
