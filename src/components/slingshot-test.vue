<template>
  <div>
    <div class="row">
      <div v-if="journey" class="col-6">
        <orbit-map :orbits="slingshotOrbits" :t0="journey.slingshotSoiInTime"></orbit-map>
        <orbit-map :orbits="transferOrbits" :t0="journey.startTime"></orbit-map>
      </div>
      <div v-if="journey" class="col-6">
        <pre>{{ journey.vT2StartSs }}</pre>
        <pre>{{ vSsExit }}</pre>
        <pre>{{ sa }}</pre>
        <pre>{{ {totalDv: journey.totalDeltaV} }}</pre>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, computed, onMounted} from "vue";
import {KerbolSystem, findSlingshotRoute, signedAngleInPlaneBetween, SlingshotPlanner} from "../../../ts-ksp/lib";

export default defineComponent({
  setup: function(props, context) {

    const journey = ref<SlingshotPlanner | undefined>(undefined);

    onMounted(() => {
      const originOrbitAltitudeKm = 100;
      const destinationOrbitAltitudeKm = 100;
      const originOrbitalSpeed = KerbolSystem.kerbin.circularOrbitVelocity(originOrbitAltitudeKm * 1000);
      const destinationOrbitalSpeed = KerbolSystem.eve.circularOrbitVelocity(destinationOrbitAltitudeKm * 1000);
      const opts = {
        startTime: 26956800,
        originBody: KerbolSystem.kerbin,
        slingshotBody: KerbolSystem.eve,
        destinationBody: KerbolSystem.moho,
        totalDuration: 7015680,
        originOrbitalSpeed: originOrbitalSpeed,
        destinationOrbitalSpeed: destinationOrbitalSpeed,
      };
      journey.value = findSlingshotRoute(opts);
    });

    const slingshotOrbits = computed(() => {
      const orbits = [];
      if (journey.value) {
        orbits.push({
          orbit: journey.value.slingshotApproachOrbit,
          interval: [journey.value.slingshotSoiInTime, journey.value.slingshotTime],
        });
        orbits.push({
          orbit: journey.value.slingshotExitOrbit,
          interval: [journey.value.slingshotTime, journey.value.slingshotSoiOutTime],
        });
      }
      return orbits;
    });

    const transferOrbits = computed(() => {
      const orbits = [];
      if (journey.value) {
        orbits.push({
          orbit: journey.value.transfer1.orbit,
          interval: [journey.value.startTime, journey.value.slingshotTime],
        });
        orbits.push({
          orbit: journey.value.transfer2.orbit,
          interval: [journey.value.slingshotTime, journey.value.endTime],
        });
        orbits.push({
          orbit: journey.value.originBody.orbit,
        });
        orbits.push({
          orbit: journey.value.slingshotBody.orbit,
        });
        orbits.push({
          orbit: journey.value.destinationBody.orbit,
        });
      }
      return orbits;
    });

    const vSsExit = computed(() => {
      if (journey.value) {
        const orbit = journey.value.slingshotExitOrbit;
        const ta = orbit.trueAnomalyAtRadiusOutbound(journey.value.slingshotBody.sphereOfInfluence);
        return orbit.velocityAtTrueAnomaly(ta);
      }
    });

    const sa = computed(() => {
      if (journey.value && vSsExit.value) {
        return signedAngleInPlaneBetween(vSsExit.value, journey.value.vT2StartSs, journey.value.ssManeuverPlane);
      }
    });

    return { journey, slingshotOrbits, transferOrbits, vSsExit, sa };
  }
});
</script>