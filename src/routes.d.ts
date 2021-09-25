declare type RouteDefn = {
    path: string;
    name?: string;
    component: string;
    props?: (route: any) => object;
};
declare const routes: RouteDefn[];
export { RouteDefn, routes };
