// Filtro xBR para sprites ampliados (Fase 28¾): redondea bordes y diagonales sin emborronar.
// Se calcula en la tarjeta gráfica para cada punto de la pantalla a partir de los píxeles originales de la textura,
// así que vale para cualquier zoom y no cambia el tamaño de los fotogramas ni sus pivotes.
//
// Shader adapted from xBR-lv2 by Hyllian (libretro glsl-shaders, "xbr-lv2", corner C), MIT license:
//   Copyright (C) 2011-2016 Hyllian - sergiogdb@gmail.com
//   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
//   documentation files (the "Software"), to deal in the Software without restriction, including without limitation
//   the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
//   to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//   The above copyright notice and this permission notice shall be included in all copies or substantial portions
//   of the Software.
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//   THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
//   CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
//   IN THE SOFTWARE.
//
// Cambios respecto al original: lee la transparencia (un píxel transparente cuenta como un color muy distinto de
// cualquier opaco, así también se suaviza la silueta), mezcla RGBA y aplica después los tintes de Phaser
// (setTint, setTintFill del destello de golpe) igual que su shader normal.

import Phaser from 'phaser';
import { DEBUG_START } from '../config/debugStart';
import { SETTINGS_CHANGED, settings } from '../systems/Settings';

/** Key the pipeline is registered with (game config `pipeline`) and that `setPipeline` uses. */
export const XBR_PIPELINE = 'Xbr';

/**
 * Width of the soft edge, as in the original's XBR_SCALE: the size on screen of one texture pixel it is tuned for.
 * Sprites are shown at about 2–4 screen pixels per texture pixel (RENDER_SCALE and the camera zoom).
 */
const XBR_EDGE_SCALE = 3.0;

const FRAG_SHADER = `
#define SHADER_NAME HB_XBR_FS
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uMainSampler;
uniform vec2 uTextureSize;
uniform float uEdgeScale;

varying vec2 outTexCoord;
varying float outTintEffect;
varying vec4 outTint;

const vec3 Y = vec3(0.299, 0.587, 0.114);
const float EQ_THRESHOLD = 15.0;
const float LV2_COEFFICIENT = 2.0;

// Brightness used to compare pixels (x48 like the original); transparent pixels are far from every opaque one.
float lum(vec4 c) { return mix(-64.0, 48.0 * dot(c.rgb, Y), step(0.5, c.a)); }
vec4 df(vec4 a, vec4 b) { return abs(a - b); }
float cdf(vec4 a, vec4 b) { vec4 d = abs(a - b); return d.r + d.g + d.b + d.a; }
vec4 eq(vec4 a, vec4 b) { return vec4(lessThan(df(a, b), vec4(EQ_THRESHOLD))); }
vec4 neq(vec4 a, vec4 b) { return vec4(notEqual(a, b)); }
vec4 wdist(vec4 a, vec4 b, vec4 c, vec4 d, vec4 e, vec4 f, vec4 g, vec4 h) {
    return df(a, b) + df(a, c) + df(d, c) + df(d, e) + 4.0 * df(g, h);
}
vec4 px(vec2 base, vec2 ps, float x, float y) { return texture2D(uMainSampler, base + vec2(x, y) * ps); }

void main ()
{
    vec2 ps = 1.0 / uTextureSize;
    vec2 pos = outTexCoord * uTextureSize;
    vec2 fp = fract(pos);
    vec2 base = (floor(pos) + 0.5) * ps;

    //    A1 B1 C1
    // A0  A  B  C C4
    // D0  D  E  F F4
    // G0  G  H  I I4
    //    G5 H5 I5
    vec4 A1 = px(base, ps, -1.0, -2.0), B1 = px(base, ps, 0.0, -2.0), C1 = px(base, ps, 1.0, -2.0);
    vec4 A0 = px(base, ps, -2.0, -1.0), A = px(base, ps, -1.0, -1.0), B = px(base, ps, 0.0, -1.0), C = px(base, ps, 1.0, -1.0), C4 = px(base, ps, 2.0, -1.0);
    vec4 D0 = px(base, ps, -2.0, 0.0), D = px(base, ps, -1.0, 0.0), E = px(base, ps, 0.0, 0.0), F = px(base, ps, 1.0, 0.0), F4 = px(base, ps, 2.0, 0.0);
    vec4 G0 = px(base, ps, -2.0, 1.0), G = px(base, ps, -1.0, 1.0), H = px(base, ps, 0.0, 1.0), I = px(base, ps, 1.0, 1.0), I4 = px(base, ps, 2.0, 1.0);
    vec4 G5 = px(base, ps, -1.0, 2.0), H5 = px(base, ps, 0.0, 2.0), I5 = px(base, ps, 1.0, 2.0);

    vec4 b = vec4(lum(B), lum(D), lum(H), lum(F));
    vec4 c = vec4(lum(C), lum(A), lum(G), lum(I));
    vec4 e = vec4(lum(E));
    vec4 d = b.yzwx;
    vec4 f = b.wxyz;
    vec4 g = c.zwxy;
    vec4 h = b.zwxy;
    vec4 i = c.wxyz;
    vec4 i4 = vec4(lum(I4), lum(C1), lum(A0), lum(G5));
    vec4 i5 = vec4(lum(I5), lum(C4), lum(A1), lum(G0));
    vec4 h5 = vec4(lum(H5), lum(F4), lum(B1), lum(D0));
    vec4 f4 = h5.yzwx;

    const vec4 Ao = vec4(1.0, -1.0, -1.0, 1.0);
    const vec4 Bo = vec4(1.0, 1.0, -1.0, -1.0);
    const vec4 Co = vec4(1.5, 0.5, -0.5, 0.5);
    const vec4 Ax = vec4(1.0, -1.0, -1.0, 1.0);
    const vec4 Bx = vec4(0.5, 2.0, -0.5, -2.0);
    const vec4 Cx = vec4(1.0, 1.0, -0.5, 0.0);
    const vec4 Ay = vec4(1.0, -1.0, -1.0, 1.0);
    const vec4 By = vec4(2.0, 0.5, -2.0, -0.5);
    const vec4 Cy = vec4(2.0, 0.0, -1.0, 0.5);
    const vec4 Ci = vec4(0.25);

    vec4 delta = vec4(1.0 / uEdgeScale);
    vec4 deltaL = vec4(0.5, 1.0, 0.5, 1.0) / uEdgeScale;
    vec4 deltaU = deltaL.yxwz;

    vec4 fx = Ao * fp.y + Bo * fp.x;
    vec4 fxLeft = Ax * fp.y + Bx * fp.x;
    vec4 fxUp = Ay * fp.y + By * fp.x;

    // Booleans as 0.0 / 1.0: "and" = *, "or" = max, "not" = 1 - x.
    vec4 lv0 = neq(e, f) * neq(e, h);
    vec4 cornerC = max(max(
        (1.0 - eq(f, b)) * (1.0 - eq(f, c)),
        (1.0 - eq(h, d)) * (1.0 - eq(h, g))),
        max(eq(e, i) * max((1.0 - eq(f, f4)) * (1.0 - eq(f, i4)), (1.0 - eq(h, h5)) * (1.0 - eq(h, i5))),
            max(eq(e, g), eq(e, c))));
    vec4 lv1 = lv0 * cornerC;
    vec4 lv2Left = neq(e, g) * neq(d, g);
    vec4 lv2Up = neq(e, c) * neq(b, c);

    vec4 fx45i = clamp((fx + delta - Co - Ci) / (2.0 * delta), 0.0, 1.0);
    vec4 fx45 = clamp((fx + delta - Co) / (2.0 * delta), 0.0, 1.0);
    vec4 fx30 = clamp((fxLeft + deltaL - Cx) / (2.0 * deltaL), 0.0, 1.0);
    vec4 fx60 = clamp((fxUp + deltaU - Cy) / (2.0 * deltaU), 0.0, 1.0);

    vec4 wd1 = wdist(e, c, g, i, h5, f4, h, f);
    vec4 wd2 = wdist(h, d, i5, f, i4, b, e, i);

    vec4 edri = vec4(lessThanEqual(wd1, wd2)) * lv0;
    vec4 edr = vec4(lessThan(wd1, wd2)) * lv1;
    vec4 edrLeft = vec4(lessThanEqual(LV2_COEFFICIENT * df(f, g), df(h, c))) * lv2Left * edr;
    vec4 edrUp = vec4(greaterThanEqual(df(f, g), LV2_COEFFICIENT * df(h, c))) * lv2Up * edr;

    fx45 = edr * fx45;
    fx30 = edrLeft * fx30;
    fx60 = edrUp * fx60;
    fx45i = edri * fx45i;

    vec4 pick = vec4(lessThanEqual(df(e, f), df(e, h)));
    vec4 amount = max(max(fx30, fx60), max(fx45, fx45i));

    vec4 res1 = mix(E, mix(H, F, pick.x), amount.x);
    res1 = mix(res1, mix(B, D, pick.z), amount.z);
    vec4 res2 = mix(E, mix(F, B, pick.y), amount.y);
    res2 = mix(res2, mix(D, H, pick.w), amount.w);
    vec4 texture = mix(res1, res2, step(cdf(E, res1), cdf(E, res2)));

    // Phaser's tint, as in its own Single shader.
    vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);
    vec4 color = texture * texel;
    if (outTintEffect == 1.0)
    {
        color.rgb = mix(texture.rgb, outTint.bgr * outTint.a, texture.a);
    }
    else if (outTintEffect == 2.0)
    {
        color = texel;
    }
    gl_FragColor = color;
}
`;

/**
 * Sprite pipeline with the xBR filter. One texture per draw (SinglePipeline): the shader needs the size of the
 * texture it reads, so each time the texture changes the batch is drawn and the size updated.
 */
export class XbrPipeline extends Phaser.Renderer.WebGL.Pipelines.SinglePipeline {
    constructor(game: Phaser.Game) {
        super({ game, fragShader: FRAG_SHADER });
    }

    override boot(): void {
        super.boot();
        this.set1f('uEdgeScale', XBR_EDGE_SCALE);
    }

    // Every sprite's texture goes through pushBatch (setGameObject and setTexture2D both call it).
    override pushBatch(texture: Phaser.Renderer.WebGL.Wrappers.WebGLTextureWrapper): number {
        if (texture !== this.currentTexture && this.vertexCount > 0) this.flush();
        const unit = super.pushBatch(texture);
        this.set2f('uTextureSize', texture.width, texture.height);
        return unit;
    }
}

/** Adds the pipeline to the game (WebGL only: without it sprites keep the normal look, as setPipeline is ignored). */
export function registerXbrPipeline(game: Phaser.Game): void {
    const renderer = game.renderer;
    if (renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer && !renderer.pipelines.has(XBR_PIPELINE)) {
        renderer.pipelines.add(XBR_PIPELINE, new XbrPipeline(game));
    }
}

/** Anything that can wear a WebGL pipeline (sprites and images). */
type PipelineObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Pipeline;

/**
 * Whether sprites that move (character, monsters, NPCs, effects, ground items) wear the xBR filter (Fase 28¾).
 * Settings → Smooth Sprites, on by default (owner, 25-oct-2026); `?debug=nosmooth` turns it off to compare.
 */
export function smoothSpritesOn(): boolean {
    return settings.current.smoothSprites && !DEBUG_START.actions.includes('nosmooth');
}

/** Every sprite that went through smoothSprite and is still alive, to switch the filter on or off at once. */
const smoothable = new Set<PipelineObject>();
let appliedOn = smoothSpritesOn();

/**
 * The single place that decides whether a sprite is drawn smooth: every moving sprite goes through here when it
 * is made. The map, HUD, menus, icons and texts never do, so they stay sharp.
 */
export function smoothSprite<T extends PipelineObject>(object: T): T {
    if (!smoothable.has(object)) {
        smoothable.add(object);
        object.once(Phaser.GameObjects.Events.DESTROY, () => smoothable.delete(object));
    }
    if (smoothSpritesOn()) object.setPipeline(XBR_PIPELINE);
    return object;
}

/** Sprites that wear the filter right now (for `check`: `g.debugSetSmooth(false)` should give 0). */
export function smoothSpriteCount(): number {
    let count = 0;
    for (const object of smoothable) if (object.pipeline?.name === XBR_PIPELINE) count += 1;
    return count;
}

// Changing the option applies at once, even in the middle of a run (Settings from the pause menu).
settings.on(SETTINGS_CHANGED, () => {
    const on = smoothSpritesOn();
    if (on === appliedOn) return;
    appliedOn = on;
    for (const object of smoothable) {
        if (on) object.setPipeline(XBR_PIPELINE);
        else object.resetPipeline();
    }
});
