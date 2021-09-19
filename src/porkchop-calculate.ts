import {
    CelestialBody, Vector3,
    TransferOptions,
    TransferType,
    findTransfer,
    OrbitingCelestialBody, makeOrbitingCelestialBody, Orbit
} from "../../ts-ksp";

const WIDTH = 300;
const HEIGHT = 300;

const porkchopCalculate = (mission: any, progressCallback: (p: number) => void, deltaVCallback: (result: any) => void) => {
    const transferType: TransferType = mission.transferType;
    const originBody = makeOrbitingCelestialBody(mission.originBody);
    const destinationBody = makeOrbitingCelestialBody(mission.destinationBody);
    const initialOrbitalVelocity: number = mission.initialOrbitalVelocity;
    const finalOrbitalVelocity: number = mission.finalOrbitalVelocity;
    const earliestDeparture: number = mission.earliestDeparture;
    const shortestTimeOfFlight: number = mission.shortestTimeOfFlight;
    const xResolution: number = mission.xScale / WIDTH;
    const yResolution: number = mission.yScale / HEIGHT;
    const originOrbit: Orbit = originBody.orbit;
    const destinationOrbit: Orbit = destinationBody.orbit;
    const n1: Vector3 = originOrbit.normalVector();
    const originPositions: Vector3[] = [];
    const originVelocities: Vector3[] = [];

    // Pre-calculate origin positions and velocities
    for (let x = 0; x <= WIDTH; x++) {
        const departureTime: number = earliestDeparture + x * xResolution;
        const trueAnomaly: number = originOrbit.trueAnomalyAt(departureTime);
        originPositions[x] = originOrbit.positionAtTrueAnomaly(trueAnomaly);
        originVelocities[x] = originOrbit.velocityAtTrueAnomaly(trueAnomaly);
    }

    const iterateTransfers = (fn: (i: number, y: number, x: number, timeOfFlight: number, departureTime: number, arrivalTime: number) => void) => {
        let i = 0;
        for (let y = 0; y < HEIGHT; y++) {
            const timeOfFlight = shortestTimeOfFlight + ((HEIGHT - 1) - y) * yResolution;
            for (let x = 0; x < WIDTH; x++) {
                const departureTime = earliestDeparture + x * xResolution;
                const arrivalTime = departureTime + timeOfFlight;
                fn(i, y, x, timeOfFlight, departureTime, arrivalTime);
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
    let lastProgress: number = 0;
    let minDeltaVPoint: {x: number, y: number} | undefined = undefined;

    iterateTransfers((i, y, x, timeOfFlight, departureTime, arrivalTime) => {
        const p1 = originPositions[x];
        const v1 = originVelocities[x];
        const trueAnomaly = destinationOrbit.trueAnomalyAt(arrivalTime);
        const p2 = destinationOrbit.positionAtTrueAnomaly(trueAnomaly);
        const v2 = destinationOrbit.velocityAtTrueAnomaly(trueAnomaly);
        const opts = new TransferOptions(originBody, destinationBody, departureTime, timeOfFlight, initialOrbitalVelocity, finalOrbitalVelocity, p1, v1, n1, p2, v2);
        const transfer = findTransfer(transferType, opts);
        const deltaV = transfer.deltaV;
        deltaVs[i] = deltaV;
        if (deltaV < minDeltaV) {
            minDeltaV = deltaV;
            minDeltaVPoint = {x: x, y: (HEIGHT - 1) - y};
        }
        if (deltaV > maxDeltaV) {
            maxDeltaV = deltaV;
        }
        if (! isNaN(deltaV)) {
            const logDeltaV = Math.log(deltaV);
            sumLogDeltaV += logDeltaV;
            sumSqLogDeltaV += logDeltaV * logDeltaV;
            deltaVCount++;
        }

        if (x === 0) {
            const now = Date.now();
            if (now - lastProgress > 100) {
                progressCallback((y + 1) / HEIGHT);
                lastProgress = now;
            }
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

export {porkchopCalculate};