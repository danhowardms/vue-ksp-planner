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

<script>
import {KerbolSystem, findSlingshotRoute, signedAngleInPlaneBetween, normSquaredV} from "../../../ts-ksp/lib/index.js";

export default {
  data: function() {
    return {
      journey: null,
    };
  },
  mounted: function() {
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
    this.journey = findSlingshotRoute(opts);
  },
  computed: {
    slingshotOrbits: function() {
      const orbits = [];
      if (this.journey) {
        orbits.push({
          orbit: this.journey.slingshotApproachOrbit,
          interval: [this.journey.slingshotSoiInTime, this.journey.slingshotTime],
        });
        orbits.push({
          orbit: this.journey.slingshotExitOrbit,
          interval: [this.journey.slingshotTime, this.journey.slingshotSoiOutTime],
        });
      }
      return orbits;
    },
    transferOrbits: function() {
      const orbits = [];
      if (this.journey) {
        orbits.push({
          orbit: this.journey.transfer1.orbit,
          interval: [this.journey.startTime, this.journey.slingshotTime],
        });
        orbits.push({
          orbit: this.journey.transfer2.orbit,
          interval: [this.journey.slingshotTime, this.journey.endTime],
        });
        orbits.push({
          orbit: this.journey.originBody.orbit,
        });
        orbits.push({
          orbit: this.journey.slingshotBody.orbit,
        });
        orbits.push({
          orbit: this.journey.destinationBody.orbit,
        });
      }
      return orbits;
    },
    vSsExit: function() {
      if (this.journey) {
        const orbit = this.journey.slingshotExitOrbit;
        const ta = orbit.trueAnomalyAtRadiusOutbound(this.journey.slingshotBody.sphereOfInfluence);
        return orbit.velocityAtTrueAnomaly(ta);
      }
    },
    sa: function() {
      if (this.journey) {
        return signedAngleInPlaneBetween(this.vSsExit, this.journey.vT2StartSs, this.journey.ssManeuverPlane);
      }
    }
  },
  methods: {
    specEng: function(t) {
      const orbit = this.journey.slingshotExitOrbit;
      const ta = orbit.trueAnomalyAt(t);
      const v = orbit.velocityAtTrueAnomaly(ta);
      const r = orbit.radiusAtTrueAnomaly(ta);
      return 0.5 * normSquaredV(v) - this.journey.slingshotBody.gravitationalParameter / r;
    }
  }
};
</script>