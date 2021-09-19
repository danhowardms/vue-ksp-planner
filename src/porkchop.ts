type Color = [number, number, number];

// Populate our palette with colors starting blue and getting redder
const PorkchopPalette: Color[] = [];
for (let i = 64; i < 69; i++) {
    PorkchopPalette.push([64, i, 255]);
}
for (let i = 133; i <= 255; i++) {
    PorkchopPalette.push([128, i, 255]);
}
for (let i = 255; i >= 128; i--) {
    PorkchopPalette.push([128, 255, i]);
}
for (let i = 128; i <= 255; i++) {
    PorkchopPalette.push([i, 255, 128]);
}
for (let i = 255; i >= 128; i--) {
    PorkchopPalette.push([255, i, 128]);
}

type Stats = {
    minVal: number;
    maxVal: number;
    minIndex: number;
    maxIndex: number;
    count: number;
    mean: number;
    stdDev: number;
};

const blankStats = (): Stats => {
    return {minVal: NaN, maxVal: NaN, minIndex: NaN, maxIndex: NaN, count: 0, mean: NaN, stdDev: NaN};
};

const getStats = (vals: Float64Array): Stats => {
    let minVal = Infinity;
    let minIndex = NaN;
    let maxVal = -Infinity;
    let maxIndex = NaN;
    let sumVals = 0;
    let sumSqVals = 0;
    let count = 0;
    for (let i = 0; i < vals.length; i++) {
        const value = vals[i];
        if (isFinite(value)) {
            if (value < minVal) {
                minVal = value;
                minIndex = i;
            }
            if (value > maxVal) {
                maxVal = value;
                maxIndex = i;
            }
            sumVals += value;
            sumSqVals += (value * value);
            count++;
        }
    }
    if (count == 0) {
        return blankStats();
    }
    const mean = sumVals / count;
    const stdDev = Math.sqrt(sumSqVals / count - mean * mean);
    return { minVal, maxVal, minIndex, maxIndex, count, mean, stdDev };
};

class Porkchop {
    width: number;
    height: number;
    size: number;
    values: Float64Array;
    logValues: Float64Array;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    pixels: ImageData;
    logStats: Stats;

    constructor(width: number, height: number) {
        this.width = Math.max(Math.trunc(width), 1);
        this.height = Math.max(Math.trunc(height), 1);
        this.size = this.width * this.height;
        this.values = new Float64Array(this.size);
        this.logValues = new Float64Array(this.size);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        const ctx = this.canvas.getContext('2d');
        if (! ctx) {
            throw new Error("Failed to create canvas context");
        }
        this.ctx = ctx;
        this.pixels = new ImageData(this.width, this.height);
        this.logStats = blankStats();
        this.reset();
    }

    reset() {
        this.values.fill(NaN);
        this.logValues.fill(NaN);
        this.pixels.data.fill(0);
        this.logStats = blankStats();
    }

    clampX(x: number): number {
        return Math.min(Math.max(Math.round(x), 0), this.width - 1);
    }

    clampY(y: number): number {
        return Math.min(Math.max(Math.round(y), 0), this.height - 1);
    }

    clampIndex(i: number): number {
        return Math.min(Math.max(Math.trunc(i), 0), this.size - 1);
    }

    getIndex(x: number, y: number): number {
        return ((this.height - 1 - this.clampY(y)) * this.width) + this.clampX(x);
    }

    getPoint(i: number): {x: number, y: number} {
        i = this.clampIndex(i);
        const y = this.height - 1 - Math.trunc(i / this.width);
        const x = i - (y * this.width);
        return {x, y};
    }

    setValue(x: number, y: number, value: number) {
        const i = this.getIndex(x, y);
        this.values[i] = value;
        this.logValues[i] = Math.log(value);
    }

    getValue(x: number, y: number): number {
        return this.values[this.getIndex(x, y)];
    }

    recount() {
        this.logStats = getStats(this.logValues);
    }

    recolor() {
        this.recount();
        const logRange = Math.min(this.logStats.maxVal, this.logStats.mean + 2 * this.logStats.stdDev) - this.logStats.minVal;
        for (let i = 0; i < this.size; i++) {
            const logVal = this.logValues[i];
            let color: Color;
            if (isFinite(logVal)) {
                const relativeVal = (logVal - this.logStats.minVal) / logRange;
                const colorIndex = Math.min(Math.max(Math.round(relativeVal * PorkchopPalette.length), 0), PorkchopPalette.length - 1);
                color = PorkchopPalette[colorIndex];
            } else {
                color = [255, 255, 255];
            }
            const rgbaIndex = i * 4;
            this.pixels.data[rgbaIndex] = color[0];
            this.pixels.data[rgbaIndex + 1] = color[1];
            this.pixels.data[rgbaIndex + 2] = color[2];
            this.pixels.data[rgbaIndex + 3] = 255;
        }
        this.ctx.putImageData(this.pixels, 0, 0);
    };
}

export {PorkchopPalette, Porkchop};