import {CelestialBody, OrbitingCelestialBody, findSlingshotRoute, SlingshotOptions} from "../../ts-ksp/lib/index.js";

const WIDTH: number = 300;
const HEIGHT: number = 300;

const slingshotPorkchopCalculate = (mission: any, progressCallback: (p: number) => void, deltaVCallback: (result: any) => void) => {
    const originBody: OrbitingCelestialBody = (mission.originBody instanceof  OrbitingCelestialBody) ? mission.originBody : OrbitingCelestialBody.fromJSON(mission.originBody);
    const initialOrbitalVelocity: number = mission.initialOrbitalVelocity;
    const slingshotBody: OrbitingCelestialBody = (mission.slingshotBody instanceof OrbitingCelestialBody ? mission.slingshotBody : OrbitingCelestialBody.fromJSON(mission.slingshotBody));
    const destinationBody: OrbitingCelestialBody = (mission.destinationBody instanceof OrbitingCelestialBody) ? mission.destinationBody : OrbitingCelestialBody.fromJSON(mission.destinationBody);
    const finalOrbitalVelocity: number = mission.finalOrbitalVelocity;
    const earliestDeparture: number = mission.departureRange[0];
    const shortestTimeOfFlight: number = mission.durationRange[0];
    const xResolution: number = (mission.departureRange[1] - mission.departureRange[0]) / WIDTH;
    const yResolution: number = (mission.durationRange[1] - mission.durationRange[0]) / HEIGHT;

    const iterateJourneys = (fn: (i: number, y: number, x: number, timeOfFlight: number, departureTime: number) => void) => {
        let i = 0;
        for (let y = 0; y < HEIGHT; y++) {
            const timeOfFlight = shortestTimeOfFlight + ((HEIGHT - 1) - y) * yResolution;
            for (let x = 0; x < WIDTH; x++) {
                const departureTime = earliestDeparture + x * xResolution;
                fn(i, y, x, timeOfFlight, departureTime);
                i++;
            }
        }
    };

    const deltaVs: Float64Array = new Float64Array(WIDTH * HEIGHT);
    let minDeltaV: number = Infinity;
    let maxDeltaV: number = 0;
    let sumLogDeltaV: number = 0;
    let sumSqLogDeltaV: number = 0;
    let deltaVCount: number = 0;
    let lastProgress: number = Date.now();
    let minDeltaVPoint: {x: number, y: number} | undefined = undefined;

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
        deltaVs[i] = deltaV;
        if (deltaV < minDeltaV) {
            minDeltaV = deltaV;
            minDeltaVPoint = {x: x, y: (HEIGHT - 1) - y};
        }
        if (deltaV > maxDeltaV) {
            maxDeltaV = deltaV;
        }
        if (! isNaN(deltaV)) {
            const logDeltaV: number = Math.log(deltaV);
            sumLogDeltaV += logDeltaV;
            sumSqLogDeltaV += logDeltaV * logDeltaV;
            deltaVCount++;
        }

        const now = Date.now();
        if (now - lastProgress > 1000) {
            progressCallback((y + 1) / HEIGHT);
            deltaVCallback({
                deltaVs: deltaVs,
                minDeltaV: minDeltaV,
                minDeltaVPoint: minDeltaVPoint,
                maxDeltaV: maxDeltaV,
                deltaVCount: deltaVCount,
                sumLogDeltaV: sumLogDeltaV,
                sumSqLogDeltaV: sumSqLogDeltaV
            });
            lastProgress = now;
        }
    });

    deltaVCallback({
        deltaVs: deltaVs,
        minDeltaV: minDeltaV,
        minDeltaVPoint: minDeltaVPoint,
        maxDeltaV: maxDeltaV,
        deltaVCount: deltaVCount,
        sumLogDeltaV: sumLogDeltaV,
        sumSqLogDeltaV: sumSqLogDeltaV
    });

};

export {slingshotPorkchopCalculate};
