declare type Color = [number, number, number];
declare const PorkchopPalette: Color[];
declare type Stats = {
    minVal: number;
    maxVal: number;
    minIndex: number;
    maxIndex: number;
    count: number;
    mean: number;
    stdDev: number;
};
declare class Porkchop {
    width: number;
    height: number;
    size: number;
    values: Float64Array;
    logValues: Float64Array;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    pixels: ImageData;
    logStats: Stats;
    constructor(width: number, height: number);
    reset(): void;
    clampX(x: number): number;
    clampY(y: number): number;
    clampIndex(i: number): number;
    getIndex(x: number, y: number): number;
    getPoint(i: number): {
        x: number;
        y: number;
    };
    setValue(x: number, y: number, value: number): void;
    getValue(x: number, y: number): number;
    recount(): void;
    recolor(): void;
}
export { PorkchopPalette, Porkchop };
