import { PropType } from "vue";
import { Porkchop } from "../porkchop";
declare type QtyPoint = {
    x: number;
    y: number;
};
declare type xYAxis = {
    title: string;
    unit: string;
    min: number;
    max: number;
};
declare type zAxis = {
    title: string;
    unit: string;
};
declare const _default: import("vue").DefineComponent<{
    porkchop: {
        type: typeof Porkchop;
        required: true;
    };
    xAxis: {
        type: PropType<xYAxis>;
        required: true;
    };
    yAxis: {
        type: PropType<xYAxis>;
        required: true;
    };
    zAxis: {
        type: PropType<zAxis>;
        required: true;
    };
    selectedQtyPoint: {
        type: PropType<QtyPoint>;
        required: false;
    };
    updateKey: {};
}, {
    plotCanvas: import("vue").Ref<HTMLCanvasElement | null>;
    onClickPlot: (event: PointerEvent) => void;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, Record<string, any>, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<{
    porkchop?: unknown;
    xAxis?: unknown;
    yAxis?: unknown;
    zAxis?: unknown;
    selectedQtyPoint?: unknown;
    updateKey?: unknown;
} & {
    porkchop: Porkchop;
    xAxis: xYAxis;
    yAxis: xYAxis;
    zAxis: zAxis;
} & {
    selectedQtyPoint?: QtyPoint | undefined;
    updateKey?: unknown;
}>, {}>;
export default _default;
