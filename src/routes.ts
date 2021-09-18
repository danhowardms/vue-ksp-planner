type RouteDefn = {
    path: string,
    name?: string,
    component: string,
};

const routes: RouteDefn[] = [
    {
        path: '/',
        name: 'dashboard',
        component: 'dashboard',
    },
    {
        path: '/transfer',
        name: 'transfer',
        component: 'transfer',
    },
    {
        path: '/map-test',
        component: 'map-test',
    },
    {
        path: '/slingshot',
        component: 'slingshot',
    },
    {
        path: '/slingshot-test',
        component: 'slingshot-test',
    },
];

export {RouteDefn, routes};
