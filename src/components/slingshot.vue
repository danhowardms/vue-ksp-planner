<template>
  <div>
    <div class="row">
      <div class="col-6">
          <div class="row g-3 mb-4">
            <div class="col-4">
              <label class="form-label">Origin Body</label>
              <select class="form-select" v-model="localVals.originBodyName" >
                <option v-for="planetName in planetNames" :value="planetName">{{ planetName }}</option>
              </select>
            </div>
            <div class="col-4">
              <label class="form-label">Slingshot Body</label>
              <select class="form-select" v-model="localVals.slingshotBodyName" >
                  <option v-for="planetName in planetNames" :value="planetName">{{ planetName }}</option>
              </select>
            </div>
            <div class="col-4">
              <label class="form-label">Destination Body</label>
              <select class="form-select" v-model="localVals.destinationBodyName" >
                  <option v-for="planetName in planetNames" :value="planetName">{{ planetName }}</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label">Depart After</label>
              <input type="number" class="form-control" :min="0" v-model.number="localVals.departMinDays" />
            </div>
            <div class="col-6">
              <label class="form-label">Depart Before</label>
              <input type="number" class="form-control" :min="localVals.departMinDays + 1" v-model.number="localVals.departMaxDays" />
            </div>
            <div class="col-6">
              <label class="form-label">Travel Time Min</label>
              <input type="number" class="form-control" :min="1" v-model.number="localVals.travelTimeMinDays" />
            </div>
            <div class="col-6">
              <label class="form-label">Travel Time Max</label>
              <input type="number" class="form-control" :min="localVals.travelTimeMinDays + 1" v-model.number="localVals.travelTimeMaxDays" />
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

<script lang="ts">
import {CelestialBody, Orbit, OrbitingCelestialBody, SlingshotPlanner} from "../../../ts-ksp";
import {RouteParamsRaw, useRoute, useRouter} from "vue-router";
import {defineComponent, computed, ref} from "vue";

export default defineComponent({
  setup: function(props, context) {
    const route = useRoute();
    const router = useRouter();

    const planetNames = ['Moho', 'Eve', 'Kerbin', 'Duna', 'Dres', 'Jool', 'Eeloo'];
    
    const selectedJourney = ref<SlingshotPlanner | null>(null);

    const originBody = computed(() => {
      return CelestialBody.getByName(route.query.originBodyName as string);
    });

    const slingshotBody = computed(() => {
      return CelestialBody.getByName(route.query.slingshotBodyName as string);
    });

    const destinationBody = computed(() => {
      return CelestialBody.getByName(route.query.destinationBodyName as string);
    });

    const departureRangeDays = computed(() => {
      return [parseInt(route.query.departMinDays as string, 10), parseInt(route.query.departMaxDays as string)];
    });

    const durationRangeDays = computed(() => {
      return [parseInt(route.query.travelTimeMinDays as string, 10), parseInt(route.query.travelTimeMaxDays as string)];
    });

    const originOrbitAltitudeKm = 100;
    const destinationOrbitAltitudeKm = 100;

    const originOrbitalSpeed = computed(() => {
      if (originBody.value instanceof OrbitingCelestialBody) {
        return originBody.value.circularOrbitVelocity(originOrbitAltitudeKm * 1000);
      } else {
        return NaN;
      }
    });

    const destinationOrbitalSpeed = computed(() => {
      if (destinationBody.value instanceof OrbitingCelestialBody) {
        return destinationBody.value.circularOrbitVelocity(destinationOrbitAltitudeKm * 1000);
      } else {
        return NaN;
      }
    });

    const localVals = ref({
      originBodyName: route.query.originBodyName as string,
      slingshotBodyName: route.query.slingshotBodyName as string,
      destinationBodyName: route.query.destinationBodyName as string,
      departMinDays: route.query.departMinDays || 0,
      departMaxDays: route.query.departMaxDays || 600,
      travelTimeMinDays: route.query.travelTimeMinDays || 100,
      travelTimeMaxDays: route.query.travelTimeMaxDays || 500,
    });

    const mission = computed(() => {
      if (
          (originBody.value instanceof OrbitingCelestialBody)
          && (slingshotBody.value instanceof OrbitingCelestialBody)
          && (destinationBody.value instanceof OrbitingCelestialBody)
          && isFinite(departureRangeDays.value[0])
          && isFinite(departureRangeDays.value[1])
          && isFinite(durationRangeDays.value[0])
          && isFinite(durationRangeDays.value[1])
          && isFinite(originOrbitalSpeed.value)
          && isFinite(destinationOrbitalSpeed.value)
      ) {
        return {
          originBody: originBody.value,
          slingshotBody: slingshotBody.value,
          destinationBody: destinationBody.value,
          initialOrbitalVelocity: originOrbitalSpeed.value,
          finalOrbitalVelocity: destinationOrbitalSpeed.value,
          departureRangeDays: departureRangeDays.value,
          durationRangeDays: durationRangeDays.value,
        }
      } else {
        return null;
      }
    });

    const slingshotOrbits = computed(() => {
      const orbits: {orbit: Orbit, interval?: [number, number]}[] = [];
      if (selectedJourney.value) {
        orbits.push({
          orbit: selectedJourney.value.slingshotApproachOrbit,
          interval: [selectedJourney.value.slingshotSoiInTime, selectedJourney.value.slingshotTime],
        });
        orbits.push({
          orbit: selectedJourney.value.slingshotExitOrbit,
          interval: [selectedJourney.value.slingshotTime, selectedJourney.value.slingshotSoiOutTime],
        });
      }
      return orbits;
    });

    const transferOrbits = computed(() => {
      const orbits: {orbit: Orbit, interval?: [number, number]}[] = [];
      if (selectedJourney.value) {
        orbits.push({
          orbit: selectedJourney.value.transfer1.orbit,
          interval: [selectedJourney.value.startTime, selectedJourney.value.slingshotTime],
        });
        orbits.push({
          orbit: selectedJourney.value.transfer2.orbit,
          interval: [selectedJourney.value.slingshotTime, selectedJourney.value.endTime],
        });
        orbits.push({
          orbit: selectedJourney.value.originBody.orbit,
        });
        orbits.push({
          orbit: selectedJourney.value.slingshotBody.orbit,
        });
        orbits.push({
          orbit: selectedJourney.value.destinationBody.orbit,
        });
      }
      return orbits;
    });

    const calculate = () => {
      router.push({
        name: 'slingshot',
        query: localVals.value,
      });
    };

    return {planetNames, localVals, selectedJourney, calculate, mission, transferOrbits, slingshotOrbits};
  }
});
</script>
