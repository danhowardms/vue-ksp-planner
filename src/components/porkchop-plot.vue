<template>
  <canvas width="540" height="360" ref="plotCanvas" @click="onClickPlot" style="cursor: crosshair"></canvas>
</template>

<script lang="ts">
import {defineComponent, PropType, ref, toRefs, computed, watch, onMounted} from "vue";
import {Porkchop, PorkchopPalette} from "../porkchop";

const PLOT_WIDTH = 300;
const PLOT_HEIGHT = 300;
const PLOT_X_OFFSET = 70;
const TIC_LENGTH = 5;

// There are 3 coordinate systems:
// A) The coordinates of the quantities represented on the chart, float vals,
//    {xAxis.min to xAxis.max, yAxis.min to yAxis.max}
//    We'll call an xy pair in this system QtyPoint
// B) The coordinates of the plot area, integers,
//    {0 to PLOT_WIDTH, 0 to PLOT_HEIGHT}
//    We'll call an xy pair in this system PlotPoint
// C) The coordinates of the <canvas> element (where y=0 is at the top)
//    We'll call an xy pair in this system CanvasPoint

type QtyPoint = {
  x: number;
  y: number;
};

type PlotPoint = {
  x: number;
  y: number;
};

type CanvasPoint = {
  x: number;
  y: number;
};

type xYAxis = {
  title: string;
  unit: string;
  min: number;
  max: number;
};

type zAxis = {
  title: string;
  unit: string;
};

export default defineComponent({
  props: {
    porkchop: {
      type: Porkchop,
      required: true,
    },
    xAxis: {
      type: Object as PropType<xYAxis>,
      required: true,
    },
    yAxis: {
      type: Object as PropType<xYAxis>,
      required: true,
    },
    zAxis: {
      type: Object as PropType<zAxis>,
      required: true,
    },
    selectedQtyPoint: {
      type: Object as PropType<QtyPoint>,
      required: false,
    },
    updateKey: {}
  },
  setup: function(props, context) {
    const { xAxis, yAxis, zAxis, selectedQtyPoint, updateKey } = toRefs(props);
    const porkchop = props.porkchop;
    const plotCanvas = ref<HTMLCanvasElement | null>(null);
    let ctx: CanvasRenderingContext2D | null = null;

    const qtyXScale = computed(() => {
      return (xAxis.value.max - xAxis.value.min) / porkchop.width;
    });
    const qtyYScale = computed(() => {
      return (yAxis.value.max - yAxis.value.min) / porkchop.height;
    });

    const plotPointToQtyPoint = (p: PlotPoint): QtyPoint => {
      return {
        x: xAxis.value.min + p.x * qtyXScale.value,
        y: yAxis.value.min + p.y * qtyYScale.value,
      };
    };

    const qtyPointToPlotPoint = (p: QtyPoint): PlotPoint => {
      return {
        x: (p.x - xAxis.value.min) / qtyXScale.value,
        y: (p.y - yAxis.value.min) / qtyYScale.value,
      };
    };

    const canvasXScale = computed(() => {
      return PLOT_WIDTH / porkchop.width;
    });
    const canvasYScale = computed(() => {
      return PLOT_HEIGHT / porkchop.height;
    });

    const plotPointToCanvasPoint = (p: PlotPoint): CanvasPoint => {
      return {
        x: PLOT_X_OFFSET + p.x * canvasXScale.value,
        y: PLOT_HEIGHT - 1 - p.y * canvasYScale.value,
      };
    };

    const canvasPointToPlotPoint = (p: CanvasPoint): PlotPoint => {
      return {
        x: (p.x - PLOT_X_OFFSET) / canvasXScale.value,
        y: (PLOT_HEIGHT - 1 - p.y) / canvasYScale.value,
      };
    };

    onMounted(() => {
      ctx = plotCanvas.value ? plotCanvas.value.getContext('2d') : null;
      if (ctx) {
        drawXYAxes(ctx);
        drawXYAxisScale(ctx);
        drawZAxisKey(ctx);
        redrawPlot(ctx);
      }
    });

    watch(updateKey, () => {
      if (ctx) {
        redrawPlot(ctx);
      }
    });

    watch(selectedQtyPoint, () => {
      if (ctx) {
        redrawPlot(ctx);
      }
    });

    const drawXYAxes = (ctx: CanvasRenderingContext2D): void => {
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
      ctx.fillText(xAxis.value.title, PLOT_X_OFFSET + PLOT_WIDTH / 2, PLOT_HEIGHT + 40);
      ctx.save();
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'top';
      ctx.fillText(yAxis.value.title, -PLOT_HEIGHT / 2, 0);
      ctx.restore();
      ctx.restore();
    };

    const drawXYAxisScale = (ctx: CanvasRenderingContext2D): void => {
      ctx.save();
      ctx.clearRect(20, 0, PLOT_X_OFFSET - TIC_LENGTH - 21, PLOT_HEIGHT + TIC_LENGTH);
      ctx.clearRect(PLOT_X_OFFSET - 40, PLOT_HEIGHT + TIC_LENGTH, PLOT_WIDTH + 80, 20);
      ctx.font = '10pt "Helvetic Neue",Helvetica,Arial,sans serif';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i ++) {
        ctx.textBaseline = (i === 4 ? 'top' : 'middle');
        const pp: PlotPoint = {x: 0, y: PLOT_HEIGHT * i / 4};
        const qp: QtyPoint = plotPointToQtyPoint(pp);
        ctx.fillText(Math.trunc(qp.y).toString(), PLOT_X_OFFSET - TIC_LENGTH - 3, PLOT_HEIGHT - pp.y);
      }
      ctx.textAlign = 'center';
      for (let i = 0; i <= 4; i ++) {
        const pp: PlotPoint = {x: PLOT_WIDTH * i / 4, y: 0};
        const qp: QtyPoint = plotPointToQtyPoint(pp);
        ctx.fillText(Math.trunc(qp.x).toString(), PLOT_X_OFFSET + pp.x, PLOT_HEIGHT + TIC_LENGTH + 3);
      }
      return ctx.restore();
    };

    const drawZAxisKey = (ctx: CanvasRenderingContext2D): void => {
      ctx.save();
      const paletteKey = ctx.createImageData(20, PLOT_HEIGHT);
      let i = 0;
      for (let y = 0; y < PLOT_HEIGHT; y++) {
        const j = Math.trunc((PLOT_HEIGHT - y - 1) * PorkchopPalette.length / PLOT_HEIGHT);
        for (let x = 0; x < 20; x++) {
          paletteKey.data[i++] = PorkchopPalette[j][0];
          paletteKey.data[i++] = PorkchopPalette[j][1];
          paletteKey.data[i++] = PorkchopPalette[j][2];
          paletteKey.data[i++] = 255;
        }
      }
      ctx.putImageData(paletteKey, PLOT_X_OFFSET + PLOT_WIDTH + 60, 0);
      ctx.fillText(zAxis.value.title, PLOT_X_OFFSET + PLOT_WIDTH + 45, PLOT_HEIGHT / 2);
      ctx.restore();
    }

    const drawZAxisScale = (ctx: CanvasRenderingContext2D): void => {
      const logMinVal = porkchop.logStats.minVal;
      const logMaxVal = porkchop.logStats.maxVal;
      ctx.save();
      ctx.clearRect(PLOT_X_OFFSET + PLOT_WIDTH + 80, 0, 100, 360);
      ctx.font = '10pt "Helvetic Neue",Helvetica,Arial,sans serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = 'black';
      ctx.textBaseline = 'alphabetic';
      for (let i = 0; i <= 4; i ++) {
        let value = Math.exp((i / 4) * (logMaxVal - logMinVal) + logMinVal);
        let valueStr: string;
        if (value.toFixed().length > 6) {
          valueStr = value.toExponential(3);
        } else {
          valueStr = value.toFixed();
        }
        ctx.textBaseline = (i == 0 ? 'alphabetic' : (i == 4 ? 'top' : 'middle'));
        ctx.fillText(valueStr + ' ' + zAxis.value.unit, PLOT_X_OFFSET + PLOT_WIDTH + 85, (1.0 - (i / 4)) * PLOT_HEIGHT);
      }
      ctx.restore();
    };

    const redrawPlot = (ctx: CanvasRenderingContext2D): void => {
      // Draw the actual plot data pixels into the plot square
      ctx.drawImage(porkchop.canvas, PLOT_X_OFFSET, 0, PLOT_WIDTH, PLOT_HEIGHT);

      // Update the palette key values
      drawZAxisScale(ctx);

      // Draw crosshairs at the selected point
      if (selectedQtyPoint.value) {
        drawCrosshairs(ctx, selectedQtyPoint.value);
      }
    };

    const drawCrosshairs = (ctx: CanvasRenderingContext2D, qp: QtyPoint): void => {
      const pp: PlotPoint = qtyPointToPlotPoint(qp);
      const cp: CanvasPoint = plotPointToCanvasPoint(pp);
      ctx.save();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cp.x, 0);
      ctx.lineTo(cp.x, PLOT_HEIGHT);
      ctx.moveTo(PLOT_X_OFFSET, cp.y);
      ctx.lineTo(PLOT_X_OFFSET + PLOT_WIDTH, cp.y);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();
      ctx.restore();
    };

    const onClickPlot = (event: PointerEvent) => {
      if (plotCanvas.value && ctx) {
        const rect = plotCanvas.value.getBoundingClientRect();
        const cp: CanvasPoint = {x: event.clientX - rect.left, y: event.clientY - rect.top};
        const pp: PlotPoint = canvasPointToPlotPoint(cp);
        const qp: QtyPoint = plotPointToQtyPoint(pp);
        const value = porkchop.getValue(pp.x, pp.y);
        if (isFinite(value)) {
          context.emit('selected', {pp, qp, value});
        }
      }
    };

    return { plotCanvas, onClickPlot };
  }
});
</script>