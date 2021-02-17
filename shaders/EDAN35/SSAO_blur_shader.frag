#version 410
out vec4 FragColor;

in VS_OUT {
	vec2 texcoord;
} fs_in;

uniform sampler2D ssaoInput;

void main() {
	vec2 texelSize = 1.0/vec2(textureSize(ssaoInput, 0));
	float result = 0.0;
	for (int x = -2; x< 2; ++x)
	{
		for (int y = -2; y < 2; ++y)
		{
			vec2 offset = vec2(float(x), float(y)) * texelSize;
			result += texture(ssaoInput, fs_in.texcoord + offset).r;
		}
	}
	float final = result / (4.0 * 4.0);

	FragColor = vec4(final, final, final, 1.0);
}
