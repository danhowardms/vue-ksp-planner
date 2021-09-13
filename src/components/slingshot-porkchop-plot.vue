<template>
  <div>
    <p v-if="working">Progress: {{ progress }}</p>
    <canvas width="540" height="360" ref="plotCanvas" @click="onClickPlot" style="cursor: crosshair"></canvas>
  </div>
</template>

<script>
import {slingshotPorkchopCalculate} from "../slingshot-porkchop-calculate";
import {findSlingshotRoute} from "../../../ts-ksp/lib/index.js";

const PLOT_WIDTH = 300;
const PLOT_HEIGHT = 300;
const PLOT_X_OFFSET = 70;
const TIC_LENGTH = 5;

const iteratePixels = (fn) => {
  let i = 0;
  for (let y = 0; y < PLOT_HEIGHT; y++) {
    for (let x = 0; x < PLOT_WIDTH; x++) {
      fn(i, y, x);
      i++;
    }
  }
};

// Populate our palette with colors starting blue and getting redder
const PALETTE = [];
for (let i = 64; i < 69; i++) {
  PALETTE.push([64, i, 255]);
}
for (let i = 133; i <= 255; i++) {
  PALETTE.push([128, i, 255]);
}
for (let i = 255; i >= 128; i--) {
  PALETTE.push([128, 255, i]);
}
for (let i = 128; i <= 255; i++) {
  PALETTE.push([i, 255, 128]);
}
for (let i = 255; i >= 128; i--) {
  PALETTE.push([255, i, 128]);
}

export default {
  props: {
    mission: {
      type: Object,
      required: true,
    },
    useWorker: {
      type: Boolean,
      default: false,
    }
  },
  data: function () {
    return {
      working: false,
      progress: null,
      selectedPoint: null,
    }
  },
  mounted: function() {
    this.canvas = this.$refs.plotCanvas;
    this.ctx = this.canvas.getContext('2d');
    this.plotImageData = this.ctx.createImageData(PLOT_WIDTH, PLOT_HEIGHT);
    if (this.useWorker) {
      this.worker = new Worker("js/porkchop-worker.js");
      this.worker.onmessage = (event) => {
        this.workerMessage(event);
      };
    }
    this.prepareCanvas();
    this.calculate();
  },
  beforeDestroy: function() {
    this.worker.terminate();
  },
  watch: {
    mission: function() {
      this.calculate(true);
    },
    selectedJourney: function() {
      this.$emit('selectedJourney', this.selectedJourney);
    }
  },
  computed: {
    selectedJourney: function() {
      if (! this.selectedPoint) {
        return null;
      }
      const xResolution = this.mission.xScale / PLOT_WIDTH;
      const yResolution = this.mission.yScale / PLOT_HEIGHT;
      const departureTime = this.mission.earliestDeparture + this.selectedPoint.x * xResolution;
      const totalDuration = this.mission.shortestTimeOfFlight + this.selectedPoint.y * yResolution;
      const opts = {
        startTime: departureTime,
        originBody: this.mission.originBody,
        slingshotBody: this.mission.slingshotBody,
        destinationBody: this.mission.destinationBody,
        totalDuration: totalDuration,
        originOrbitalSpeed: this.mission.initialOrbitalVelocity,
        destinationOrbitalSpeed: this.mission.finalOrbitalVelocity,
      };
      return findSlingshotRoute(opts);
    }
  },
  methods: {
    calculate: function (erase) {
      if (erase == null) {
        erase = false;
      }
      if (erase) {
        this.ctx.clearRect(PLOT_X_OFFSET, 0, PLOT_WIDTH, PLOT_HEIGHT);
      }
      this.ctx.clearRect(PLOT_X_OFFSET + PLOT_WIDTH + 85, 0, 95, PLOT_HEIGHT + 10);
      this.drawAxisLabels();
      this.deltaVs = null;
      this.selectedPoint = null;
      if (this.useWorker) {
        this.worker.postMessage(this.mission);
      } else {
        window.setTimeout(() => {
          slingshotPorkchopCalculate(this.mission, this.updateProgress, this.updateDeltaV);
        }, 100);
      }
      this.working = true;
    },
    prepareCanvas: function () {
      const ctx = this.ctx;
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(PLOT_X_OFFSET - 1, 0);
      ctx.lineTo(PLOT_X_OFFSET - 1, PLOT_HEIGHT + 1);
      ctx.lineTo(PLOT_X_OFFSET + PLOT_WIDTH, PLOT_HEIGHT + 1);
      ctx.stroke();
      ctx.beginPath();

      // draw major tick marks
      for (let i = 0; i <= 1.0; i += 0.25) {
        const y = PLOT_HEIGHT * i + 1;
        ctx.moveTo(PLOT_X_OFFSET - 1, y);
        ctx.lineTo(PLOT_X_OFFSET - 1 - TIC_LENGTH, y);
        const x = PLOT_X_OFFSET - 1 + PLOT_WIDTH * i;
        ctx.moveTo(x, PLOT_HEIGHT + 1);
        ctx.lineTo(x, PLOT_HEIGHT + 1 + TIC_LENGTH);
      }
      ctx.stroke();

      // draw minor tick marks
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= 1.0; i += 0.05) {
        if (i % 0.25 === 0) {
          continue;
        }
        const y = PLOT_HEIGHT * i + 1;
        ctx.moveTo(PLOT_X_OFFSET - 1, y);
        ctx.lineTo(PLOT_X_OFFSET - 1 - TIC_LENGTH, y);
        const x = PLOT_X_OFFSET - 1 + PLOT_WIDTH * i;
        ctx.moveTo(x, PLOT_HEIGHT + 1);
        ctx.lineTo(x, PLOT_HEIGHT + 1 + TIC_LENGTH);
      }
      ctx.stroke();

      // Write axis labels
      ctx.font = 'italic 12pt "Helvetic Neue",Helvetica,Arial,sans serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'black';
      ctx.fillText("Departure Date (days from epoch)", PLOT_X_OFFSET + PLOT_WIDTH / 2, PLOT_HEIGHT + 40);
      ctx.save();
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'top';
      ctx.fillText("Time of Flight (days)", -PLOT_HEIGHT / 2, 0);
      ctx.restore();

      // Draw palette key
      const paletteKey = ctx.createImageData(20, PLOT_HEIGHT);
      let i = 0;
      for (let y = 0; y < PLOT_HEIGHT; y++) {
        const j = Math.trunc((PLOT_HEIGHT - y - 1) * PALETTE.length / PLOT_HEIGHT);
        for (let x = 0; x < 20; x++) {
          paletteKey.data[i++] = PALETTE[j][0];
          paletteKey.data[i++] = PALETTE[j][1];
          paletteKey.data[i++] = PALETTE[j][2];
          paletteKey.data[i++] = 255;
        }
      }
      ctx.putImageData(paletteKey, PLOT_X_OFFSET + PLOT_WIDTH + 60, 0);
      ctx.fillText("∆v", PLOT_X_OFFSET + PLOT_WIDTH + 45, PLOT_HEIGHT / 2);
      return ctx.restore();
    },
    drawDeltaVScale: function (logMinDeltaV, logMaxDeltaV) {
      //var ctx, deltaV, _n;
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '10pt "Helvetic Neue",Helvetica,Arial,sans serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'black';
      ctx.textBaseline = 'alphabetic';
      for (let i = 0; i < 1.0; i += 0.25) {
        let deltaV = Math.exp(i * (logMaxDeltaV - logMinDeltaV) + logMinDeltaV);
        if (deltaV.toFixed().length > 6) {
          deltaV = deltaV.toExponential(3);
        } else {
          deltaV = deltaV.toFixed();
        }
        ctx.fillText(deltaV + " m/s", PLOT_X_OFFSET + PLOT_WIDTH + 85, (1.0 - i) * PLOT_HEIGHT);
        ctx.textBaseline = 'middle';
      }
      ctx.textBaseline = 'top';
      let deltaV = Math.exp(logMaxDeltaV);
      if (deltaV.toFixed().length > 6) {
        deltaV = deltaV.toExponential(3);
      } else {
        deltaV = deltaV.toFixed();
      }
      ctx.fillText(deltaV + " m/s", PLOT_X_OFFSET + PLOT_WIDTH + 85, 0);
      return ctx.restore();
    },
    drawAxisLabels: function() {
      const ctx = this.ctx;
      ctx.save();
      ctx.clearRect(20, 0, PLOT_X_OFFSET - TIC_LENGTH - 21, PLOT_HEIGHT + TIC_LENGTH);
      ctx.clearRect(PLOT_X_OFFSET - 40, PLOT_HEIGHT + TIC_LENGTH, PLOT_WIDTH + 80, 20);
      ctx.font = '10pt "Helvetic Neue",Helvetica,Arial,sans serif';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 1.0; i += 0.25) {
        if (i === 1.0) {
          ctx.textBaseline = 'top';
        }
        ctx.fillText(Math.trunc((this.mission.shortestTimeOfFlight + i * this.mission.yScale) / (6 * 60 * 60)), PLOT_X_OFFSET - TIC_LENGTH - 3, (1.0 - i) * PLOT_HEIGHT);
      }
      ctx.textAlign = 'center';
      for (let i = 0; i <= 1.0; i += 0.25) {
        ctx.fillText(Math.trunc((this.mission.earliestDeparture + i * this.mission.xScale) / (6 * 60 * 60)), PLOT_X_OFFSET + i * PLOT_WIDTH, PLOT_HEIGHT + TIC_LENGTH + 3);
      }
      return ctx.restore();
    },
    drawPlot: function (pointer) {
      if (this.deltaVs == null) {
        return;
      }
      const ctx = this.ctx;
      ctx.save();
      // Draw the actual plot data pixels into the plot square
      ctx.putImageData(this.plotImageData, PLOT_X_OFFSET, 0);

      // draw crosshairs over selected point
      ctx.lineWidth = 1;
      if (this.selectedPoint != null) {
        const x = this.selectedPoint.x;
        const y = this.selectedPoint.y;
        ctx.beginPath();
        if ((pointer != null ? pointer.x : void 0) !== x) {
          ctx.moveTo(PLOT_X_OFFSET + x, 0);
          ctx.lineTo(PLOT_X_OFFSET + x, PLOT_HEIGHT);
        }
        if ((pointer != null ? pointer.y : void 0) !== y) {
          ctx.moveTo(PLOT_X_OFFSET, (PLOT_HEIGHT - 1) - y);
          ctx.lineTo(PLOT_X_OFFSET + PLOT_WIDTH, (PLOT_HEIGHT - 1) - y);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }

      // label the cursor with the deltaV for that point
      if (pointer != null) {
        const x = pointer.x;
        const y = pointer.y;
        ctx.beginPath();
        ctx.moveTo(PLOT_X_OFFSET + x, 0);
        ctx.lineTo(PLOT_X_OFFSET + x, PLOT_HEIGHT);
        ctx.moveTo(PLOT_X_OFFSET, (PLOT_HEIGHT - 1) - y);
        ctx.lineTo(PLOT_X_OFFSET + PLOT_WIDTH, (PLOT_HEIGHT - 1) - y);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.stroke();
        const deltaV = this.deltaVs[Math.trunc(((PLOT_HEIGHT - 1) - y) * PLOT_WIDTH + x)];
        if (!isNaN(deltaV)) {
          const tip = " " + String.fromCharCode(0x2206) + "v = " + deltaV.toFixed() + " m/s ";
          ctx.font = '10pt "Helvetic Neue",Helvetica,Arial,sans serif';
          ctx.fillStyle = 'black';
          ctx.textAlign = x < PLOT_WIDTH / 2 ? 'left' : 'right';
          ctx.textBaseline = y < PLOT_HEIGHT - 16 ? 'bottom' : 'top';
          ctx.fillText(tip, x + PLOT_X_OFFSET, (PLOT_HEIGHT - 1) - y);
        }
      }
      return ctx.restore();
    },
    updateProgress: function(progress) {
      this.progress = progress;
    },
    updateDeltaV: function(result) {
      this.progress = null;
      this.deltaVs = (result.deltaVs instanceof ArrayBuffer) ? (new Float64Array(result.deltaVs)) : result.deltaVs;
      const logMinDeltaV = Math.log(result.minDeltaV);
      const mean = result.sumLogDeltaV / result.deltaVCount;
      const stddev = Math.sqrt(result.sumSqLogDeltaV / result.deltaVCount - mean * mean);
      const logMaxDeltaV = Math.min(Math.log(result.maxDeltaV), mean + 2 * stddev);

      iteratePixels((i) => {
        const logDeltaV = Math.log(this.deltaVs[i]);
        let color;
        if (isNaN(logDeltaV)) {
          color = [255, 255, 255];
        } else {
          const relativeDeltaV = (logDeltaV - logMinDeltaV) / (logMaxDeltaV - logMinDeltaV);
          const colorIndex = Math.min(Math.trunc(relativeDeltaV * PALETTE.length), PALETTE.length - 1);
          color = PALETTE[colorIndex];
        }
        const rgbaIndex = i * 4;
        this.plotImageData.data[rgbaIndex] = color[0];
        this.plotImageData.data[rgbaIndex + 1] = color[1];
        this.plotImageData.data[rgbaIndex + 2] = color[2];
        this.plotImageData.data[rgbaIndex + 3] = 255;
      });

      this.drawDeltaVScale(logMinDeltaV, logMaxDeltaV);
      this.selectedPoint = result.minDeltaVPoint;
      this.drawPlot();
      this.progress = null;
      this.working = false;
    },
    workerMessage: function(event) {
      if ('log' in event.data) {
        console.log(event.data.log);
      }
      if ('progress' in event.data) {
        this.updateProgress(event.data.progress);
      }
      if ('deltaVs' in event.data) {
        this.updateDeltaV(event.data);
      }
    },
    onClickPlot: function(event) {
      // Click, select new journey
      const rect = this.canvas.getBoundingClientRect();
      const x = Math.trunc(event.clientX - rect.left) - PLOT_X_OFFSET;
      const y = PLOT_HEIGHT - Math.trunc(event.clientY - rect.top);
      if (x >= 0 && x < PLOT_WIDTH && y >= 0 && y < PLOT_HEIGHT) {
        const i = (y * PLOT_WIDTH + x);
        if (isFinite(this.deltaVs[i])) {
          this.selectedPoint = {x, y};
          this.drawPlot();
        }
      }
    },
  }
};
</script>
