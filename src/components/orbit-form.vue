<template>
  <div>
    <div class="row g-2">
      <div class="col-6">
        <label class="form-label">Semi Major Axis</label>
        <input class="form-control" type="range" min="18" max="28" step="0.01" v-model.number="logSemiMajorAxis" />
      </div>
      <div class="col-6">
        <label class="form-label">Eccentricity</label>
        <input class="form-control" type="range" min="0" max="0.99" step="0.01" v-model.number="eccentricity" />
      </div>
      <div class="col-4">
        <label class="form-label">Inclination</label>
        <input class="form-control" type="range" min="0" max="180" v-model.number="inclinationDegs" />
      </div>
      <div class="col-4">
        <label class="form-label">Longitude Of Ascending Node</label>
        <input class="form-control" type="range" min="0" max="360" v-model.number="longitudeOfAscendingNodeDegs" />
      </div>
      <div class="col-4">
        <label class="form-label">Argument of Periapsis</label>
        <input class="form-control" type="range" min="0" max="360" v-model.number="argumentOfPeriapsisDegs" />
      </div>
    </div>
  </div>
</template>

<script>
import {KerbolSystem, Orbit} from "../../../ts-ksp/lib/index.js";

export default {
  props: {
    orbit: {
      type: Orbit,
      required: true,
    }
  },
  data: function() {
    return {
      semiMajorAxis: this.orbit.semiMajorAxis,
      eccentricity: this.orbit.eccentricity,
      inclinationDegs: this.orbit.inclinationDegs(),
      longitudeOfAscendingNodeDegs: this.orbit.longitudeOfAscendingNodeDegs(),
      argumentOfPeriapsisDegs: this.orbit.argumentOfPeriapsisDegs(),
    }
  },
  computed: {
    logSemiMajorAxis: {
      get: function() {
        return Math.log(this.semiMajorAxis);
      },
      set: function(newVal) {
        this.semiMajorAxis = Math.exp(newVal);
      }
    },
    newOrbit: function() {
      return new Orbit(KerbolSystem.kerbol, this.semiMajorAxis, this.eccentricity, this.inclinationDegs, this.longitudeOfAscendingNodeDegs, this.argumentOfPeriapsisDegs);
    }
  },
  watch: {
    newOrbit: function() {
      this.$emit('change', this.newOrbit);
    }
  }
};
</script>