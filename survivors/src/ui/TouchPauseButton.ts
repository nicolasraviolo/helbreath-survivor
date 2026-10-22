// Botón redondo "II" de pausa para los dedos (solo pantallas táctiles), arriba a la derecha. Lo usan la partida
// (HudScene) y la ciudad (TownScene, Fase 23). Fijo en pantalla aunque la cámara se mueva.
import Phaser from 'phaser';
import { TOUCH_PAUSE_BUTTON } from '../config/touch';
import { ScreenLayer } from './renderScale';

export function addTouchPauseButton(scene: Phaser.Scene, depth: number, onPress: () => void): void {
    const b = TOUCH_PAUSE_BUTTON;
    const button = scene.add.graphics({ x: b.x, y: b.y })
        .fillStyle(b.color, b.alpha).fillCircle(0, 0, b.radius)
        .lineStyle(2, b.ringColor, 0.6).strokeCircle(0, 0, b.radius)
        .fillStyle(b.barColor, 1)
        .fillRect(-b.barGap / 2 - b.barWidth, -b.barHeight / 2, b.barWidth, b.barHeight)
        .fillRect(b.barGap / 2, -b.barHeight / 2, b.barWidth, b.barHeight)
    const zone = scene.add.zone(b.x, b.y, b.hitRadius * 2, b.hitRadius * 2)
        .setInteractive(new Phaser.Geom.Circle(b.hitRadius, b.hitRadius, b.hitRadius), Phaser.Geom.Circle.Contains);
    new ScreenLayer(scene, depth).addFixed(button, zone);
    zone.on(Phaser.Input.Events.POINTER_DOWN, onPress);
}
