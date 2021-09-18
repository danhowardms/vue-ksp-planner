declare type RouteDefn = {
    path: string;
    name?: string;
    component: string;
};
declare const routes: RouteDefn[];
export { RouteDefn, routes };
