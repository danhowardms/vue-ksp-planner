import { createApp } from 'vue';
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { RouteDefn, routes } from './routes';
import {CelestialBody} from "../../ts-ksp/src";

/*
// Create the hub which will contain global data, and store a reference to it in the Vue prototype
import hub from './back-end/hub.js';
Vue.prototype.$hub = hub;
document.addEventListener('DOMContentLoaded', () => {
    var dummy = document.createElement('div');
    dummy.style.display = 'none';
    document.body.appendChild(dummy);
    hub.$mount(dummy);
});
*/

// Register all Vue components from the components directory
const vueFiles = require.context('./components', true, /\.vue$/i);
const components: Map<string, object> = new Map<string, object>();
vueFiles.keys().map((key) => {
    const componentName: string = key.split('/').slice(1).join('-').replace(/\.vue$/, '');
    components.set(componentName, vueFiles(key).default);
});

// Setup routing
const setRouteComponents = function(records: RouteDefn[]): RouteRecordRaw[] {
    return records.map((record) => {
        return {
            path: record.path,
            name: record.name,
            component: components.get(record.component),
        } as RouteRecordRaw;
    });
};
const router = createRouter({
    history: createWebHashHistory(),
    routes: setRouteComponents(routes),
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {

    const appComponent = components.get('app');
    const appEle = document.getElementById('app');
    if (appComponent && appEle) {
        const app = createApp(appComponent);
        for (const [componentName, componentDefn] of components.entries()) {
            app.component(componentName, componentDefn);
        }
        app.use(router);
        const vm = app.mount(appEle);
        // @ts-ignore
        window.app = app;
    }
});
