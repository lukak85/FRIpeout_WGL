const vertex = `#version 300 es
precision mediump float;
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;

uniform mat4 uViewModel;
uniform mat4 uProjection;
uniform mat4 uRotateNormals;

out vec3 vVertexPosition;
out vec3 vNormal;
out vec2 vTexCoord;

out float fogVisibility;

const float fogDensity = 0.0037;
const float fogGradient = 1.5;

void main() {
    vVertexPosition = (uViewModel * vec4(aPosition)).xyz;
    vNormal = mat3(uRotateNormals) * aNormal;
    vTexCoord = aTexCoord;
    gl_Position = uProjection * vec4(vVertexPosition, 1);

    // For the fog:
    float distance = length(vVertexPosition.xyz) * 0.5;
    fogVisibility = exp(-pow((distance * fogDensity), fogGradient));
    fogVisibility = clamp(fogVisibility, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mat4 uViewModel;

uniform mediump sampler2D uTexture;

const int NUMBER_OF_LIGHTS = 1;

uniform vec3 uAmbientColor[NUMBER_OF_LIGHTS];
uniform vec3 uDiffuseColor[NUMBER_OF_LIGHTS];
uniform vec3 uSpecularColor[NUMBER_OF_LIGHTS];

uniform float uShininess[NUMBER_OF_LIGHTS];
uniform vec3 uLightPosition[NUMBER_OF_LIGHTS];
uniform vec3 uLightAttenuation[NUMBER_OF_LIGHTS];

const int NUMBER_OF_HEADLIGHTS = 1;

uniform vec3 uhDirection[NUMBER_OF_HEADLIGHTS];
uniform float cutoff;

uniform vec3 uhAmbientColor[NUMBER_OF_HEADLIGHTS];
uniform vec3 uhDiffuseColor[NUMBER_OF_HEADLIGHTS];
uniform vec3 uhSpecularColor[NUMBER_OF_HEADLIGHTS];

uniform float uhShininess[NUMBER_OF_HEADLIGHTS];
uniform vec3 uhLightPosition[NUMBER_OF_HEADLIGHTS];
uniform vec3 uhLightAttenuation[NUMBER_OF_HEADLIGHTS];

uniform vec3 fogColour;

uniform int isSkybox;

in vec3 vVertexPosition;
in vec3 vNormal;
in vec2 vTexCoord;

in float fogVisibility;

out vec4 oColor;

void main() {
    oColor = vec4(0.0);
    
    for (int i = 0; i < NUMBER_OF_LIGHTS; i++) {
        vec3 lightPosition = (uViewModel * vec4(uLightPosition[i], 1)).xyz;
        float d = distance(vVertexPosition, lightPosition);
        float attenuation = 1.0 / dot(uLightAttenuation[i] * vec3(1, d, d * d), vec3(1, 1, 1));

        vec3 N = (uViewModel * vec4(vNormal, 0)).xyz;
        vec3 L = normalize(lightPosition - vVertexPosition);
        vec3 E = normalize(-vVertexPosition);
        vec3 R = normalize(reflect(-L, N));

        float lambert = max(0.0, dot(L, N));
        float phong = pow(max(0.0, dot(E, R)), uShininess[i]);

        vec3 ambient = uAmbientColor[i];
        vec3 diffuse = uDiffuseColor[i] * lambert;
        vec3 specular = uSpecularColor[i] * phong;

        vec3 light = (ambient + diffuse + specular) * attenuation;


        oColor += texture(uTexture, vTexCoord) * vec4(light, 1);
    }

    for (int i = 0; i < NUMBER_OF_LIGHTS; i++) {
        vec3 lightPosition = (uViewModel * vec4(uhLightPosition[i], 1)).xyz;
        vec3 lightDirection = normalize(lightPosition - vVertexPosition);
        float theta = dot(lightDirection, normalize(-uhDirection[i]));
        if(theta > cutoff) {
            float d = distance(vVertexPosition, lightPosition);
            float attenuation = 1.0 / dot(uhLightAttenuation[i] * vec3(1, d, d * d), vec3(1, 1, 1));

            vec3 N = (uViewModel * vec4(vNormal, 0)).xyz;
            vec3 L = normalize(lightPosition - vVertexPosition);
            vec3 E = normalize(-vVertexPosition);
            vec3 R = normalize(reflect(-L, N));

            float lambert = max(0.0, dot(L, N));
            float phong = pow(max(0.0, dot(E, R)), uhShininess[i]);

            vec3 ambient = uhAmbientColor[i];
            vec3 diffuse = uhDiffuseColor[i] * lambert;
            vec3 specular = uhSpecularColor[i] * phong;

            vec3 light = (ambient + diffuse + specular) * attenuation;

            oColor += vec4(light, 1);
        }
    }
    // oColor = vec4(light, 1.0);
    // oColor = texture(uTexture, vTexCoord);
    // oColor = vec4(0.0, 0.0, 0.0, 1.0);

    if(isSkybox == 0) {
        oColor = mix(vec4(fogColour, 1.0), oColor, fogVisibility);
    }
    else if(isSkybox == 1) {
        oColor = mix(vec4(fogColour, 1.0), oColor, 0.5);
    }
}
`;

export default {
    simple: { vertex, fragment }
};