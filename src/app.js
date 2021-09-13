import Vue from 'vue';
import VueRouter from 'vue-router';
//import util from 'admin-util';

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
var components = {};
vueFiles.keys().map((key) => {
    const componentName = key.split('/').slice(1).join('-').replace(/\.vue$/, '');
    components[componentName] = Vue.component(componentName, vueFiles(key).default);
});

// Setup routing
import routes from './routes.js';
const setRouteComponents = function(records) {
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
    var appEle = document.getElementById('app');
    var app = new Vue({
        el: appEle,
        router: router,
        render: function(h) {
            return h(components.app, {props: {}});
        }
    });
    window.app = app;
});
