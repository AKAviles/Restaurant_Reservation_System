import React from "react";

import { Redirect, Route, Switch } from "react-router-dom";
import Dashboard from "../dashboard/Dashboard";
import NotFound from "./NotFound";
import { today } from "../utils/date-time";
import NewReservation from "../ReservationsAndTables/NewReservation";
import Edit from "../ReservationsAndTables/Edit";
import SeatReservation from "../ReservationsAndTables/SeatReservation";
import Search from "../ReservationsAndTables/Search";
import NewTable from "../ReservationsAndTables/NewTable";

/**
 * Defines all the routes for the application.
 *
 * You will need to make changes to this file.
 *
 * @returns {JSX.Element}
 */
function Routes() {
  return (
    <Switch>
      <Route exact={true} path='/'>
        <Redirect to={"/dashboard"} />
      </Route>
      <Route exact={true} path='/reservations'>
        <Redirect to={"/dashboard"} />
      </Route>
      <Route path='/dashboard'>
        <Dashboard date={today()} />
      </Route>
      <Route exact={true} path='/reservations/new'>
        <NewReservation />
      </Route>
      <Route exact={true} path='/reservations/:reservation_id/edit'>
        <Edit />
      </Route>
      <Route exact={true} path='/reservations/:reservation_id/seat'>
        <SeatReservation />
      </Route>
      <Route exact={true} path='/search'>
        <Search />
      </Route>
      <Route exact={true} path='/tables/new'>
        <NewTable />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default Routes;
