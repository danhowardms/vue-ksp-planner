import {OrbitingCelestialBodyJSON, makeOrbitingCelestialBody, OrbitingCelestialBody, findSlingshotRoute, SlingshotOptions} from "../../ts-ksp";

type SlingshotMissionParams = {
    originBody: OrbitingCelestialBody | OrbitingCelestialBodyJSON,
    slingshotBody: OrbitingCelestialBody | OrbitingCelestialBodyJSON,
    destinationBody: OrbitingCelestialBody | OrbitingCelestialBodyJSON,
    initialOrbitalVelocity: number,
    finalOrbitalVelocity: number,
    departureRangeDays: [number, number],
    durationRangeDays: [number, number],
    width: number,
    height: number,
};

const slingshotPorkchopCalculate = (mission: SlingshotMissionParams, progressCallback: (p: number) => void, deltaVCallback: (values: [number, number, number][]) => void) => {
    const originBody = makeOrbitingCelestialBody(mission.originBody);
    const slingshotBody = makeOrbitingCelestialBody(mission.slingshotBody);
    const destinationBody = makeOrbitingCelestialBody(mission.destinationBody);
    const initialOrbitalVelocity: number = mission.initialOrbitalVelocity;
    const finalOrbitalVelocity: number = mission.finalOrbitalVelocity;
    const earliestDepartureDays: number = mission.departureRangeDays[0];
    const shortestTimeOfFlightDays: number = mission.durationRangeDays[0];
    const width = mission.width;
    const height = mission.height;
    const xResolution: number = (mission.departureRangeDays[1] - mission.departureRangeDays[0]) / width;
    const yResolution: number = (mission.durationRangeDays[1] - mission.durationRangeDays[0]) / height;

    const iterateJourneys = (fn: (i: number, y: number, x: number, timeOfFlight: number, departureTime: number) => void) => {
        let i = 0;
        for (let y = 0; y < height; y++) {
            const timeOfFlight = (shortestTimeOfFlightDays + y * yResolution) * (6 * 60 * 60);
            for (let x = 0; x < width; x++) {
                const departureTime = (earliestDepartureDays + x * xResolution) * (6 * 60 * 60);
                fn(i, y, x, timeOfFlight, departureTime);
                i++;
            }
        }
    };

    let unsentData: [number, number, number][] = [];
    let lastProgress: number = Date.now();

    iterateJourneys((i, y, x, timeOfFlight, departureTime) => {
        const opts: SlingshotOptions = {
            startTime: departureTime,
            originBody: originBody,
            slingshotBody: slingshotBody,
            destinationBody: destinationBody,
            totalDuration: timeOfFlight,
            originOrbitalSpeed: initialOrbitalVelocity,
            destinationOrbitalSpeed: finalOrbitalVelocity,
        };
        const slingshot = findSlingshotRoute(opts);
        let deltaV: number;
        try {
            deltaV = slingshot.totalDeltaV;
        } catch (e) {
            console.log(e);
            deltaV = NaN;
        }
        unsentData.push([x, y, deltaV]);

        const now = Date.now();
        if (now - lastProgress > 1000) {
            progressCallback((y + 1) / height);
            deltaVCallback(unsentData);
            lastProgress = now;
            unsentData = [];
        }
    });

    deltaVCallback(unsentData);
};

export {SlingshotMissionParams, slingshotPorkchopCalculate};
