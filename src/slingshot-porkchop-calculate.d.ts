import { OrbitingCelestialBodyJSON, OrbitingCelestialBody } from "../../ts-ksp";
declare type SlingshotMissionParams = {
    originBody: OrbitingCelestialBody | OrbitingCelestialBodyJSON;
    slingshotBody: OrbitingCelestialBody | OrbitingCelestialBodyJSON;
    destinationBody: OrbitingCelestialBody | OrbitingCelestialBodyJSON;
    initialOrbitalVelocity: number;
    finalOrbitalVelocity: number;
    departureRangeDays: [number, number];
    durationRangeDays: [number, number];
    width: number;
    height: number;
};
declare const slingshotPorkchopCalculate: (mission: SlingshotMissionParams, progressCallback: (p: number) => void, deltaVCallback: (values: [number, number, number][]) => void) => void;
export { SlingshotMissionParams, slingshotPorkchopCalculate };
