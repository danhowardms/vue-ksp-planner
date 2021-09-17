<template>
  <div>
    <div class="row">
      <div class="col-6">
          <div class="row g-3 mb-4">
            <div class="col-4">
              <label class="form-label">Origin Body</label>
              <select class="form-select" v-model="originBodyName" >
                <option v-for="planetName in planetNames" :value="planetName">{{ planetName }}</option>
              </select>
            </div>
            <div class="col-4">
              <label class="form-label">Slingshot Body</label>
              <select class="form-select" v-model="slingshotBodyName" >
                  <option v-for="planetName in planetNames" :value="planetName">{{ planetName }}</option>
              </select>
            </div>
            <div class="col-4">
              <label class="form-label">Destination Body</label>
              <select class="form-select" v-model="destinationBodyName" >
                  <option v-for="planetName in planetNames" :value="planetName">{{ planetName }}</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">Depart After</label>
              <input type="number" class="form-control" :min="0" v-model.number="departMinDays" />
            </div>
            <div class="col-6">
              <label class="form-label">Depart Before</label>
              <input type="number" class="form-control" :min="departMinDays + 1" v-model.number="departMaxDays" />
            </div>
            <div class="col-6">
              <label class="form-label">Travel Time Min</label>
              <input type="number" class="form-control" :min="1" v-model.number="travelTimeMinDays" />
            </div>
            <div class="col-6">
              <label class="form-label">Travel Time Max</label>
              <input type="number" class="form-control" :min="travelTimeMinDays + 1" v-model.number="travelTimeMaxDays" />
            </div>
            <div class="col-12">
              <button class="btn btn-primary" @click="calculate">Calculate</button>
            </div>
          </div>
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
      departMinDays: 0,
      departMaxDays: 1600,
      travelTimeMinDays: 450,
      travelTimeMaxDays: 700,
      mission: null,
      selectedJourney: null,
    };
  },
  computed: {
    planetNames: function() {
        return ['Moho', 'Eve', 'Kerbin', 'Duna', 'Dres', 'Jool', 'Eeloo'];
    },
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
  },
  methods: {
    calculate: function() {
      const originOrbitAltitudeKm = 100;
      const destinationOrbitAltitudeKm = 100;
      const originOrbitalSpeed = this.originBody.circularOrbitVelocity(originOrbitAltitudeKm * 1000);
      const destinationOrbitalSpeed = this.destinationBody.circularOrbitVelocity(destinationOrbitAltitudeKm * 1000);
      this.mission = {
        startTime: 0,
        originBody: this.originBody,
        slingshotBody: this.slingshotBody,
        destinationBody: this.destinationBody,
        initialOrbitalVelocity: originOrbitalSpeed,
        finalOrbitalVelocity: destinationOrbitalSpeed,
        departureRange: [this.departMinDays * 6 * 60 * 60, this.departMaxDays * 6 * 60 * 60],
        durationRange: [this.travelTimeMinDays * 6 * 60 * 60, this.travelTimeMaxDays * 6 * 60 * 60],
      };
    }
  }
};
</script>
