#version 410

uniform int ambient_light;
uniform int show_crosshair;

uniform vec2 inv_res;

uniform sampler2D diffuse_texture;
uniform sampler2D specular_texture;
uniform sampler2D SSAO_texture;
uniform sampler2D light_d_texture;
uniform sampler2D light_s_texture;

in VS_OUT {
	vec2 texcoord;
} fs_in;

out vec4 frag_color;

void main()
{
	vec2 crosshair = (1 / inv_res) / 2.0;

	vec3 diffuse  = texture(diffuse_texture,  fs_in.texcoord).rgb;
	vec3 specular = texture(specular_texture, fs_in.texcoord).rgb;
	
	vec3 light_d  = texture(light_d_texture,  fs_in.texcoord).rgb;
	vec3 light_s  = texture(light_s_texture,  fs_in.texcoord).rgb;
	vec3 ambient = vec3(ambient_light/100.0);

	if ((abs(length(gl_FragCoord.xy - crosshair)) < 10.0) && bool(show_crosshair)) {
		frag_color = vec4(0.9, 0.9, 0.9, 1.0);
	} else {
		frag_color = vec4((texture(SSAO_texture, fs_in.texcoord).r * ambient + light_d) * diffuse + light_s * specular, 1.0 );
	}
}
