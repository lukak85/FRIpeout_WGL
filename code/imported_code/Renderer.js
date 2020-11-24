import * as WebGL from './WebGL.js';
import shaders from './shaders.js';
import Light from './Light.js';
import SkyboxObject from '../src/SkyboxObject.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;
const quat = glMatrix.quat;

// This class prepares all assets for use with WebGL
// and takes care of rendering.

export default class Renderer {

    constructor(gl) {
        this.gl = gl;
        this.glObjects = new Map();
        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(0.552, 0.980, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.defaultTexture = WebGL.createTexture(gl, {
            data   : new Uint8Array([255, 255, 255, 255]),
            width  : 1,
            height : 1,
        });
    }

    prepareBufferView(bufferView) {
        if (this.glObjects.has(bufferView)) {
            return this.glObjects.get(bufferView);
        }

        const buffer = new DataView(
            bufferView.buffer,
            bufferView.byteOffset,
            bufferView.byteLength);
        const glBuffer = WebGL.createBuffer(this.gl, {
            target : bufferView.target,
            data   : buffer
        });
        this.glObjects.set(bufferView, glBuffer);
        return glBuffer;
    }

    prepareSampler(sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const glSampler = WebGL.createSampler(this.gl, sampler);
        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const glTexture = WebGL.createTexture(this.gl, { image });
        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    prepareTexture(texture) {
        const gl = this.gl;

        this.prepareSampler(texture.sampler);
        const glTexture = this.prepareImage(texture.image);

        const mipmapModes = [
            gl.NEAREST_MIPMAP_NEAREST,
            gl.NEAREST_MIPMAP_LINEAR,
            gl.LINEAR_MIPMAP_NEAREST,
            gl.LINEAR_MIPMAP_LINEAR,
        ];

        if (!texture.hasMipmaps && mipmapModes.includes(texture.sampler.min)) {
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.generateMipmap(gl.TEXTURE_2D);
            texture.hasMipmaps = true;
        }
    }

    prepareMaterial(material) {
        if (material.baseColorTexture) {
            this.prepareTexture(material.baseColorTexture);
        }
        if (material.metallicRoughnessTexture) {
            this.prepareTexture(material.metallicRoughnessTexture);
        }
        if (material.normalTexture) {
            this.prepareTexture(material.normalTexture);
        }
        if (material.occlusionTexture) {
            this.prepareTexture(material.occlusionTexture);
        }
        if (material.emissiveTexture) {
            this.prepareTexture(material.emissiveTexture);
        }
    }

    preparePrimitive(primitive) {
        if (this.glObjects.has(primitive)) {
            return this.glObjects.get(primitive);
        }

        this.prepareMaterial(primitive.material);

        const gl = this.gl;
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        if (primitive.indices) {
            const bufferView = primitive.indices.bufferView;
            bufferView.target = gl.ELEMENT_ARRAY_BUFFER;
            const buffer = this.prepareBufferView(bufferView);
            gl.bindBuffer(bufferView.target, buffer);
        }

        // this is an application-scoped convention, matching the shader
        const attributeNameToIndexMap = {
            POSITION   : 0,
            NORMAL     : 1,
            TEXCOORD_0 : 2,
        };

        for (const name in primitive.attributes) {
            const accessor = primitive.attributes[name];
            const bufferView = accessor.bufferView;
            const attributeIndex = attributeNameToIndexMap[name];

            if (attributeIndex !== undefined) {
                bufferView.target = gl.ARRAY_BUFFER;
                const buffer = this.prepareBufferView(bufferView);
                gl.bindBuffer(bufferView.target, buffer);
                gl.enableVertexAttribArray(attributeIndex);
                gl.vertexAttribPointer(
                    attributeIndex,
                    accessor.numComponents,
                    accessor.componentType,
                    accessor.normalized,
                    bufferView.byteStride,
                    accessor.byteOffset);
            }
        }

        this.glObjects.set(primitive, vao);
        return vao;
    }

    prepareMesh(mesh) {
        for (const primitive of mesh.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    prepareNode(node) {
        if (node.mesh) {
            this.prepareMesh(node.mesh);
        }
        for (const child of node.children) {
            this.prepareNode(child);
        }
    }

    prepareScene(scene) {
        for (const node of scene.nodes) {
            this.prepareNode(node);
        }
    }

    getViewProjectionMatrix(camera) {
        const mvpMatrix = mat4.clone(camera.matrix);
        let parent = camera.parent;
        while (parent) {
            mat4.mul(mvpMatrix, parent.matrix, mvpMatrix);
            parent = parent.parent;
        }
        mat4.invert(mvpMatrix, mvpMatrix);
        mat4.mul(mvpMatrix, camera.camera.matrix, mvpMatrix);
        return mvpMatrix;
    }

    getViewMatrix(camera) {
        const viewMatrix = mat4.clone(camera.matrix);
        let parent = camera.parent;
        while (parent) {
            mat4.mul(viewMatrix, parent.matrix, viewMatrix);
            parent = parent.parent;
        }
        /* mat4.invert(viewMatrix, viewMatrix); */
        return viewMatrix;
    }


    render(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);
        gl.uniform1i(program.uniforms.uTexture, 0);

        let matrix = mat4.create();
        let matrixStack = [];

        const viewMatrix = this.getViewMatrix(camera);
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.camera.matrix);

        let lightCounter = 0;

        let fogColour = vec3.create();
        /* fogColour = vec3.fromValues(0.552, 0.980, 1); */
        /* fogColour = vec3.fromValues(0.5, 0.5, 0.5); */
        fogColour = vec3.fromValues(0.35, 0.32, 0.23);


        gl.uniform3fv(program.uniforms.fogColour, fogColour);

        scene.traverse(
            (node) => {
                gl.uniform1i(program.uniforms.isSkybox, 1);
                if (node.parent != null && node.parent instanceof SkyboxObject) {
                    gl.uniform1i(program.uniforms.isSkybox, 0);
                }
                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.matrix);
                if(node.mesh && !(node instanceof Light)) {
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);

                    /* console.log(node.matrix); */
                    let rotated = quat.create();
                    mat4.getRotation(rotated, node.matrix);
                    /* let pos = mat4.getTranslation(node.matrix); */
                    let rotMatrix = mat4.create();
                    mat4.fromRotationTranslation(rotMatrix, rotated, [0,0,0]);

                    gl.uniformMatrix4fv(program.uniforms.uRotateNormals, false, rotMatrix);

                    for (const primitive of node.mesh.primitives) {
                        this.renderPrimitive(primitive);
                    }
                } else if (node instanceof Light) {
                    let color = vec3.clone(node.ambientColor);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms['uAmbientColor[' + lightCounter + ']'], color);
                    color = vec3.clone(node.diffuseColor);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms['uDiffuseColor[' + lightCounter + ']'], color);
                    color = vec3.clone(node.specularColor);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms['uSpecularColor[' + lightCounter + ']'], color);
                    
                    let position = [0,0,0];
                    mat4.getTranslation(position, node.matrix);

                    /* let tempMatrix = mat4.create();
                    tempMatrix = this.getViewMatrix(camera);
                    mat4.invert(tempMatrix, tempMatrix);

                    mat4.mul(tempMatrix, node.matrix, tempMatrix);

                    mat4.getTranslation(position, tempMatrix);

                    console.log(position); */


                    gl.uniform3fv(program.uniforms['uLightPosition[' + lightCounter + ']'], position);
                    gl.uniform1f(program.uniforms['uShininess[' + lightCounter + ']'], node.shininess);
                    gl.uniform3fv(program.uniforms['uLightAttenuation[' + lightCounter + ']'], node.attenuatuion);
                    lightCounter++;
                }
            },
            (node) => {
                matrix = matrixStack.pop();
            }
        );
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const vao = this.glObjects.get(primitive);
        const material = primitive.material;
        const texture = material.baseColorTexture;
        const glTexture = this.glObjects.get(texture.image);
        const glSampler = this.glObjects.get(texture.sampler);

        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        if (primitive.indices) {
            const mode = primitive.mode;
            const count = primitive.indices.count;
            const type = primitive.indices.componentType;
            gl.drawElements(mode, count, type, 0);
        } else {
            const mode = primitive.mode;
            const count = primitive.attributes.POSITION.count;
            gl.drawArrays(mode, 0, count);
        }
    }

}