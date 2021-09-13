<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-6">
          <h4>Orbit 1</h4>
          <orbit-form :orbit="orbit1" @change="orbit1 = $event" />
          <h4>Orbit 2</h4>
          <orbit-form :orbit="orbit2" @change="orbit2 = $event" />
          <h4>Orbit 3</h4>
          <orbit-form :orbit="orbit3" @change="orbit3 = $event" />
        </div>
        <div class="col-6">
          <orbit-map :orbits="[orbit1, orbit2, orbit3]"></orbit-map>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import {
  Orbit,
  KerbolSystem
} from "../../../ts-ksp/lib/index.js";

export default {
  data: function() {
    return {
      orbit1: new Orbit(KerbolSystem.kerbol, 5000000000, 0.6, 20, 0, 40),
      orbit2: KerbolSystem.kerbin.orbit,
      orbit3: KerbolSystem.moho.orbit,
    };
  },
  methods: {
  }
};
</script>