<template>
  <g>
    <path :d="path" stroke="blue" stroke-width="0.5" fill="none" />
    <circle v-if="showBody" :cx="svgPos[0]" :cy="svgPos[1]" r="2"/>
  </g>
</template>

<script>
import {mulVS, Orbit, rotate, addVV} from "../../../ts-ksp/lib/index.js";
export default {
  props: {
    orbit: {
      type: Orbit,
      required: true
    },
    t: {
      type: Number,
      default: 0
    },
    cameraRotation: {
      type: Array,
      default: [0, 0, 1, 0]
    },
    scale: {
      type: Number,
      default: 1
    },
    interval: {
      type: Array,
      required: false,
    }
  },
  computed: {
    svgPos: function() {
      const p = this.orbit.positionAt(this.t);
      const p1 = rotate(this.cameraRotation, p);
      return mulVS(p1, this.scale);
    },
    orbitU: function() {
      return rotate(this.orbit.rotationToReferenceFrame(), [this.orbit.semiMajorAxis, 0, 0]);
    },
    orbitV: function() {
      return rotate(this.orbit.rotationToReferenceFrame(), [0, this.orbit.semiMinorAxis(), 0]);
    },
    orbitP: function() {
      return rotate(this.orbit.rotationToReferenceFrame(), [-this.orbit.semiMajorAxis * this.orbit.eccentricity, 0, 0]);
    },
    path: function() {
      if (this.interval) {
        return this.pathInterval;
      } else {
        return this.orbit.isHyperbolic() ? this.pathHyperbolic : this.pathElliptic;
      }
    },
    showBody: function() {
      return this.interval ? (this.t >= this.interval[0] && this.t <= this.interval[1]) : true;
    },
    pathInterval: function() {
      if (! this.interval) {
        return null;
      }
      const ta0 = this.orbit.trueAnomalyAt(this.interval[0]);
      let ta1 = this.orbit.trueAnomalyAt(this.interval[1]);
      if (ta1 < ta0) {
        ta1 += 2 * Math.PI;
      }
      let path = "";
      const N = 200;
      const dta = (ta1 - ta0) / N;
      for (let i = 0; i < N; i++) {
        const ta = ta0 + i * dta;
        const p = this.orbit.positionAtTrueAnomaly(ta);
        const p1 = rotate(this.cameraRotation, p);
        const p2 = mulVS(p1, this.scale);
        path += (i === 0 ? 'M' : 'L') + p2[0] + ',' + p2[1];
      }
      return path;
    },
    pathHyperbolic: function() {

      const N = 200;
      let path = '';
      for (let i = -N; i < N; i++) {
        const p = this.orbit.positionAt(this.t + (50 * i)); // @todo shit
        const p1 = rotate(this.cameraRotation, p);
        const p2 = mulVS(p1, this.scale);
        path += (i === -N ? 'M' : 'L') + p2[0] + ',' + p2[1];
      }
      return path;
    },
    pathElliptic: function() {
      const N = 50;
      let path = '';
      for (let i = 0; i < N; i++) {
        const theta = i * Math.PI * 2 / N;
        const p = addVV(this.orbitP, addVV(mulVS(this.orbitU, Math.cos(theta)), mulVS(this.orbitV, Math.sin(theta))));
        const p1 = rotate(this.cameraRotation, p);
        const p2 = mulVS(p1, this.scale);
        path += (i === 0 ? 'M' : 'L') + p2[0] + ',' + p2[1];
      }
      path += 'Z';
      return path;
    },
  }
}
</script>