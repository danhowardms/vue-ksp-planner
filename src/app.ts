import Vue from 'vue';
import VueRouter from 'vue-router';

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

// Attach global mixins
Vue.use(VueRouter);

// Register all Vue components from the components directory
const vueFiles = require.context('./components', true, /\.vue$/i);
let components: {[index: string]: object} = {};
vueFiles.keys().map((key) => {
    const componentName: string = key.split('/').slice(1).join('-').replace(/\.vue$/, '');
    components[componentName] = Vue.component(componentName, vueFiles(key).default);
});

// Setup routing
import routes from './routes';
const setRouteComponents = function(records: any) {
    for (let record of records) {
        record.component = components[record.component];
    }
};
setRouteComponents(routes);
const router = new VueRouter({
    routes: routes
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const appEle = document.getElementById('app');
    if (! appEle) {
        return;
    }
    const app = new Vue({
        el: appEle,
        router: router,
        render: function(h) {
            return h(components.app, {props: {}});
        }
    });
    // @ts-ignore
    window.app = app;
});
