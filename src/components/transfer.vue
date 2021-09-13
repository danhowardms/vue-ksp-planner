<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-6">
          <div class="mb-3">
            <label class="form-label">Origin Body</label>
            <select class="form-select" v-model="originBodyName" >
              <option value="Kerbin">Kerbin</option>
              <option value="Moho">Moho</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Destination Body</label>
            <select class="form-select" v-model="destinationBodyName" >
              <option value="Kerbin">Kerbin</option>
              <option value="Moho">Moho</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Depart After Days</label>
            <input type="number" class="form-control" :min="0" v-model.number="departAfterDays" />
          </div>
          <div class="mb-3">
            <label class="form-label">Travel Time Days</label>
            <input type="number" class="form-control" :min="1" v-model.number="travelTimeDays" />
          </div>
          <div class="mb-3">
            <button class="btn btn-primary" @click="calculate">Calculate</button>
          </div>
        </div>
        <div class="col-6">
          <porkchop-plot v-if="mission" :mission="mission" @selectedTransfer="transfer = $event" />
        </div>
        <div class="col-6">
          <p v-if="transfer">Ejection {{ transfer.ejectionDeltaV }} + Insertion {{ transfer.insertionDeltaV }} = {{ transfer.deltaV }}.</p>
          <orbit-map :orbits="orbits" :t0="mapStartTime"></orbit-map>
          <pre>{{ orbits }}</pre>
          <pre>{{ transferOpts }}</pre>
          <pre>{{ transfer }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import {CelestialBody, TransferOptions, TransferType, findTransfer} from "../../../ts-ksp/lib/index.js";

export default {
  data: function() {
    return {
      originBodyName: "Kerbin",
      destinationBodyName: "Moho",
      departAfterDays: 0,
      travelTimeDays: 106,
      transferOpts: null,
      transfer: null,
      mission: null,
    };
  },
  computed: {
    originBody: function() {
      return CelestialBody.getByName(this.originBodyName);
    },
    destinationBody: function() {
      return CelestialBody.getByName(this.destinationBodyName);
    },
    orbits: function() {
      const orbits = [];
      if (this.originBody && this.originBody.orbit) {
        orbits.push(this.originBody.orbit);
      }
      if (this.destinationBody && this.destinationBody.orbit) {
        orbits.push(this.destinationBody.orbit);
      }
      if (this.transfer && this.transfer.orbit) {
        orbits.push(this.transfer.orbit);
      }
      return orbits;
    },
    departAfter: function() {
      return this.departAfterDays * 6 * 60 * 60;
    },
    travelTime: function() {
      return this.travelTimeDays * 6 * 60 * 60;
    },
    mapStartTime: function() {
      return this.transfer ? this.transfer.t0 : this.departAfter;
    }
  },
  methods: {
    calculate: function() {
      if (this.originBodyName === this.destinationBodyName) {
        return;
      }
      const originOrbitAltitudeKm = 100;
      const destinationOrbitAltitudeKm = 100;
      const originOrbitalVelocity = this.originBody.circularOrbitVelocity(originOrbitAltitudeKm * 1000);
      const destinationOrbitalVelocity = this.destinationBody.circularOrbitVelocity(destinationOrbitAltitudeKm * 1000);
      this.transferOpts = new TransferOptions(this.originBody, this.destinationBody, this.departAfter, this.travelTime, originOrbitalVelocity, destinationOrbitalVelocity);

      this.mission = Object.assign({
        transferType: TransferType.OPTIMAL,
        xScale: 270 * 6 * 60 * 60,
        yScale: (185 - 62) * 6 * 60 * 60,
        earliestDeparture: this.departAfter,
        shortestTimeOfFlight: 62 * 6 * 60 * 60,
      }, this.transferOpts);
    }
  }
};
</script>