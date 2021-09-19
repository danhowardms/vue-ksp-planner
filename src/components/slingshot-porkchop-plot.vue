<template>
  <div>
    <p v-if="working">Progress: {{ progress }}</p>
    <porkchop-plot :porkchop="porkchop" :xAxis="xAxis" :yAxis="yAxis" :zAxis="zAxis" :selectedQtyPoint="selectedQtyPoint" :updateKey="updateKey" @selected="onPointSelected" />
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType, ref, toRefs, computed, watch, onMounted, onBeforeUnmount} from "vue";
import {SlingshotMissionParams, slingshotPorkchopCalculate} from "../slingshot-porkchop-calculate";
import {
  SlingshotOptions,
  findSlingshotRoute,
  serializeOrbitingCelestialBody
} from "../../../ts-ksp";
import {Porkchop} from "../porkchop";

const WIDTH = 300;
const HEIGHT = 300;

export default defineComponent({
  props: {
    mission: {
      type: Object as PropType<SlingshotMissionParams>,
      required: true,
    },
    useWorker: {
      type: Boolean,
      default: true,
    }
  },
  setup: function(props, context) {
    const { mission } = toRefs(props);
    const working = ref(false);
    const progress = ref<number | null>(null);
    const updateKey = ref(0);

    const selectedQtyPoint = ref<{x: number, y: number} | null>(null);

    const porkchop = new Porkchop(WIDTH, HEIGHT);
    let worker: Worker | null = null;

    onMounted(() => {
      if (props.useWorker) {
        worker = new Worker("js/slingshot-porkchop-worker.js");
        worker.onmessage = (event) => {
          workerMessage(event);
        };
      }
      calculate();
    });

    onBeforeUnmount(() => {
      if (worker) {
        worker.terminate();
      }
    });

    const xAxis = computed(() => {
      return {
        title: 'Departure Date (days from epoch)',
        min: Math.trunc(props.mission.departureRangeDays[0]),
        max: Math.trunc(props.mission.departureRangeDays[1]),
      };
    });

    const yAxis = computed(() => {
      return {
        title: 'Time of Flight (days)',
        min: Math.trunc(props.mission.durationRangeDays[0]),
        max: Math.trunc(props.mission.durationRangeDays[1]),
      };
    });

    const zAxis = computed(() => {
      return {
        title: '∆v',
        unit: 'm/s',
      };
    });

    const selectedJourney = computed(() => {
      if (! selectedQtyPoint.value) {
        return null;
      }
      const opts: SlingshotOptions = {
        originBody: props.mission.originBody,
        slingshotBody: props.mission.slingshotBody,
        destinationBody: props.mission.destinationBody,
        startTime: selectedQtyPoint.value.x * (6 * 60 * 60),
        totalDuration: selectedQtyPoint.value.y * (6 * 60 * 60),
        originOrbitalSpeed: props.mission.initialOrbitalVelocity,
        destinationOrbitalSpeed: props.mission.finalOrbitalVelocity,
      };
      return findSlingshotRoute(opts);
    });

    const calculate = (erase?: boolean): void => {
      selectedQtyPoint.value = null;
      if (worker) {
        // @todo this is fucking shit, there must be a better way than this
        worker.postMessage(JSON.parse(JSON.stringify({
          originBody: serializeOrbitingCelestialBody(props.mission.originBody),
          slingshotBody: serializeOrbitingCelestialBody(props.mission.slingshotBody),
          destinationBody: serializeOrbitingCelestialBody(props.mission.destinationBody),
          initialOrbitalVelocity: props.mission.initialOrbitalVelocity,
          finalOrbitalVelocity: props.mission.finalOrbitalVelocity,
          departureRangeDays: props.mission.departureRangeDays,
          durationRangeDays: props.mission.durationRangeDays,
          width: WIDTH,
          height: HEIGHT,
        })));
      } else {
        window.setTimeout(() => {
          slingshotPorkchopCalculate(props.mission, updateProgress, updateDeltaV);
        }, 100);
      }
      working.value = true;
    };

    const updateProgress = (newProgress: number): void => {
      progress.value = newProgress;
    };

    const updateDeltaV = (data: [number, number, number][]) => {
      progress.value = null;
      for (let [x, y, deltaV] of data) {
        porkchop.setValue(x, y, deltaV);
      }
      porkchop.recolor();
      if (isFinite(porkchop.logStats.minIndex)) {
        const minPlotPoint = porkchop.getPoint(porkchop.logStats.minIndex);
        selectedQtyPoint.value = {
          x: props.mission.departureRangeDays[0] + minPlotPoint.x * (props.mission.departureRangeDays[1] - props.mission.departureRangeDays[0]) / WIDTH,
          y: props.mission.durationRangeDays[0] + minPlotPoint.y * (props.mission.durationRangeDays[1] - props.mission.durationRangeDays[0]) / HEIGHT,
        };
      }
      updateKey.value++;
      progress.value = null;
    };

    // @todo any
    const workerMessage = (event: any) => {
      if ('log' in event.data) {
        console.log(event.data.log);
      }
      if ('progress' in event.data) {
        updateProgress(event.data.progress);
      }
      if ('values' in event.data) {
        updateDeltaV(event.data.values);
      }
    };

    watch(mission, () => {
      calculate(true);
    });

    watch(selectedJourney, () => {
      context.emit('selectedJourney', selectedJourney.value);
    });

    const onPointSelected = (event: {qp: {x: number, y: number}}) => {
      selectedQtyPoint.value = event.qp;
    };

    return { porkchop, xAxis, yAxis, zAxis, selectedQtyPoint, updateKey, working, progress, onPointSelected };
  }
});
</script>
