<template>
  <div>
    <div class="row">
      <div class="col-6">
        <slingshot-porkchop-plot v-if="mission" :mission="mission" @selectedJourney="selectedJourney = $event" />
      </div>
      <div class="col-6">
        <template v-if="selectedJourney">
          <pre>{{
              {
                transfer1: selectedJourney.transfer1.deltaV,
                maneuver: selectedJourney.deltaVMan,
                insertion: selectedJourney.transfer2.insertionDeltaV,
                total: selectedJourney.totalDeltaV,
                startTime: selectedJourney.startTime,
                totalDuration: selectedJourney.totalDuration,
              }
          }}</pre>
          <orbit-map :orbits="slingshotOrbits" :t0="selectedJourney.slingshotSoiInTime"></orbit-map>
          <orbit-map :orbits="transferOrbits" :t0="selectedJourney.startTime"></orbit-map>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {CelestialBody, findSlingshotRoute} from "../../../ts-ksp/lib/index.js";
export default {
  data: function() {
    return {
      originBodyName: "Kerbin",
      slingshotBodyName: "Eve",
      destinationBodyName: "Moho",
      departAfterDays: 0,
      travelTimeDays: 100,
      selectedJourney: null,
    };
  },
  computed: {
    originBody: function() {
      return CelestialBody.getByName(this.originBodyName);
    },
    slingshotBody: function() {
      return CelestialBody.getByName(this.slingshotBodyName);
    },
    destinationBody: function() {
      return CelestialBody.getByName(this.destinationBodyName);
    },
    departAfter: function() {
      return this.departAfterDays * 6 * 60 * 60;
    },
    travelTime: function() {
      return this.travelTimeDays * 6 * 60 * 60;
    },
    slingshotOrbits: function() {
      const orbits = [];
      if (this.selectedJourney) {
        orbits.push({
          orbit: this.selectedJourney.slingshotApproachOrbit,
          interval: [this.selectedJourney.slingshotSoiInTime, this.selectedJourney.slingshotTime],
        });
        orbits.push({
          orbit: this.selectedJourney.slingshotExitOrbit,
          interval: [this.selectedJourney.slingshotTime, this.selectedJourney.slingshotSoiOutTime],
        });
      }
      return orbits;
    },
    transferOrbits: function() {
      const orbits = [];
      if (this.selectedJourney) {
        orbits.push({
          orbit: this.selectedJourney.transfer1.orbit,
          interval: [this.selectedJourney.startTime, this.selectedJourney.slingshotTime],
        });
        orbits.push({
          orbit: this.selectedJourney.transfer2.orbit,
          interval: [this.selectedJourney.slingshotTime, this.selectedJourney.endTime],
        });
        orbits.push({
          orbit: this.selectedJourney.originBody.orbit,
        });
        orbits.push({
          orbit: this.selectedJourney.slingshotBody.orbit,
        });
        orbits.push({
          orbit: this.selectedJourney.destinationBody.orbit,
        });
      }
      return orbits;
    },
    mission: function() {
      const originOrbitAltitudeKm = 100;
      const destinationOrbitAltitudeKm = 100;
      const originOrbitalSpeed = this.originBody.circularOrbitVelocity(originOrbitAltitudeKm * 1000);
      const destinationOrbitalSpeed = this.destinationBody.circularOrbitVelocity(destinationOrbitAltitudeKm * 1000);
      return {
        startTime: 0,
        originBody: this.originBody,
        slingshotBody: this.slingshotBody,
        destinationBody: this.destinationBody,
        initialOrbitalVelocity: originOrbitalSpeed,
        finalOrbitalVelocity: destinationOrbitalSpeed,
        earliestDeparture: this.departAfter,
        shortestTimeOfFlight: this.travelTime,
        xScale: 1600 * 6 * 60 * 60,
        yScale: 240 * 6 * 60 * 60,
      };
    }
  }
};
</script>
