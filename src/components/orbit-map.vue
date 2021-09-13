<template>
  <div>
    <div class="row">
      <div class="col-4">
        <label class="form-label">Animation Speed</label>
        <input class="form-control" type="range" min="-4" max="10" step="0.01" v-model.number="logSpeed" />
      </div>
      <div class="col-4">
        <label class="form-label">Drawing Scale</label>
        <input class="form-control" type="range" min="-25" max="-6" step="0.01" v-model.number="logScale" />
      </div>
      <div class="col-4">
        <label class="form-label">Tilt</label>
        <input class="form-control" type="range" min="-90" max="90" step="0.01" v-model.number="tiltDegs" />
      </div>
    </div>
    <div>
      <button v-if="! playing" class="btn btn-primary" @click="play">Play</button>
      <button v-if="playing" class="btn btn-secondary" @click="pause">Pause</button>
      <button class="btn btn-secondary" @click="reset">Reset</button>
    </div>
    <svg viewBox="-100 -100 200 200">
      <svg-orbit-path v-for="item, i in orbits" :key="i" :orbit="item.orbit" :interval="item.interval" :t="t" :cameraRotation="cameraRotation" :scale="scale" />
      <circle :cx="0" :cy="0" r="5"/>
    </svg>
  </div>
</template>

<script>
import {quaternionFromAngleAndAxis} from "../../../ts-ksp/lib/index.js";

export default {
  props: {
    orbits: {
      type: Array,
      default: [],
    },
    t0: {
      type: Number,
      default: 0,
    }
  },
  data: function() {
    return {
      scale: 0.000000005,
      speed: 600,
      tiltDegs: 0,
      t: this.t0,
      intervalId: null,
    };
  },
  watch: {
    t0: function() {
      this.reset();
    }
  },
  computed: {
    cameraRotation: function() {
      const tiltRads = this.tiltDegs * Math.PI / 180;
      return quaternionFromAngleAndAxis(tiltRads, [1, 0, 0]);
    },
    logSpeed: {
      get: function() {
        return Math.log(this.speed);
      },
      set: function(newVal) {
        this.speed = Math.exp(newVal);
      }
    },
    logScale: {
      get: function() {
        return Math.log(this.scale);
      },
      set: function(newVal) {
        this.scale = Math.exp(newVal);
      }
    },
    playing: function() {
      return this.intervalId != null;
    }
  },
  methods: {
    play: function() {
      this.prevJsTime = (new Date()).getTime();
      this.intervalId = window.setInterval(() => {
        this.nextFrame();
      }, 10);
    },
    pause: function() {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    },
    reset: function() {
      this.pause();
      this.t = this.t0;
    },
    nextFrame: function() {
      const currJsTime = (new Date()).getTime();
      const dt = (currJsTime - this.prevJsTime) * this.speed;
      this.t += dt;
      this.prevJsTime = currJsTime;
    }
  }
}
</script>