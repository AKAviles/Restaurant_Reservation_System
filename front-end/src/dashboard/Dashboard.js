import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  listReservations,
  listTables,
  finishReservation,
  changeStatus,
} from "../utils/api";
import ErrorAlert from "../layout/ErrorAlert";
import ReservationCard from "../ReservationsAndTables/ReservationCard";
import "./Dashboard.css";

/**
 * Defines the dashboard page.
 * @param date
 *  the date for which the user wants to view reservations.
 * @returns {JSX.Element}
 */

//additional hook is needed to get query param from url
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Dashboard({ date }) {
  //////  \/ load reservations \/  //////
  //overide default date if "date" is present in query param
  let location = useQuery().get("date");
  if (location) date = location;

  //states for reservation data and errors
  const [reservations, setReservations] = useState([]);
  const [reservationsError, setReservationsError] = useState(null);

  //states for finishing or canceling reservations
  const [finishIds, setFinishIds] = useState({ tableId: "", resId: "" });
  const [cancelled, setCancelled] = useState("");

  //states for tables data and errors
  const [tables, setTables] = useState([]);
  const [tablesError, setTablesError] = useState(null);
  const [tablesLoaded, setTablesLoaded] = useState(false);

  //called on initial render and state update to render table
  //and reservation data
  useEffect(() => {
    loadTables();
    if (cancelled) {
      changeStatusCancel(cancelled);
    }
  }, [date, cancelled, finishIds]);

  useEffect(() => {
    if (tablesLoaded) {
      loadReservations();
    }
  }, [tablesLoaded]);
  // call api to cancel reservation
  async function changeStatusCancel(cancelledReservation) {
    const abortController = new AbortController();
    await changeStatus(
      "cancelled",
      cancelledReservation,
      abortController.signal
    );
    setCancelled((cancelled) => (cancelled = ""));
    return () => abortController.abort();
  }

  // call api to load reservation data
  async function loadReservations() {
    const abortController = new AbortController();
    try {
      setReservationsError(null);
      const result = await listReservations({ date }, abortController.signal);
      result.filter(
        (reservation) =>
          reservation.status === "booked" || reservation.status === "seated"
      );

      setReservations(
        result.sort(
          (resA, resB) => resA.reservation_time > resB.reservation_time
        )
      );
    } catch (error) {
      setReservationsError(error);
    }
    return () => abortController.abort();
  }

  // call api to load tables data
  async function loadTables() {
    setTablesLoaded(false);
    setTables((tables) => (tables = []));
    setTablesError((error) => (error = null));
    const { tableId } = finishIds;
    const abortController = new AbortController();
    try {
      if (tableId) {
        try {
          await finishReservation(tableId, abortController.signal);
          setFinishIds({ ...finishIds, tableId: "" });
        } catch (error) {
          setTablesError(error);
        }
      }
      const fetchedTables = await listTables(abortController.signal);
      setTables((tbls) => (tbls = fetchedTables));
      setTablesLoaded(true);
    } catch (error) {
      setTablesError(error);
    }

    return () => abortController.abort();
  }
  // handle state when finish button is pressed
  function finishHandler({ target }) {
    if (
      window.confirm(
        "Is this table ready to seat new guests? This cannot be undone."
      )
    ) {
      setFinishIds({
        tableId: target.dataset.tableIdFinish,
        resId: target.dataset.reservationIdFinish,
      });
    }
  }

  // format tables list to jsx elements
  const tablesList = tables.map((table) => {
    let backgroundColor = table.reservation_id ? "occupied" : "free";
    return (
      <li className={`list-group-item ${backgroundColor}`} key={table.table_id}>
        <div>
          <div className='row'>
            <div className='col'>
              <h4>Table Name</h4>
              <p>{table.table_name}</p>
              <h4>Table Capacity</h4>
              <p>{table.capacity}</p>
            </div>
            {table.reservation_id ? (
              <div className='row'>
                <div className='col'>
                  <span
                    className='badge bg-success'
                    data-table-id-status={table.table_id}
                  >
                    occupied
                  </span>
                  <br />
                  <button
                    onClick={finishHandler}
                    data-table-id-finish={table.table_id}
                    data-reservation-id-finish={table.reservation_id}
                    className='btn btn-danger'
                  >
                    Finish
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <span
                  data-table-id-status={table.table_id}
                  className='badge bg-primary'
                >
                  free
                </span>
              </div>
            )}
          </div>
        </div>
      </li>
    );
  });

  return (
    <main className='container'>
      <div className='row'>
        <div className='col'>
          <h1>Dashboard</h1>
          <div className='d-md-flex mb-3'>
            <h5 className='mb-0'>Reservations for date: {date}</h5>
          </div>
          <div className='col'>
            <h2>Tables</h2>
            <ErrorAlert error={tablesError} />
            <ul className='list-group'>{tablesList}</ul>
          </div>
          <div className='col'>
            <h2>Reservations</h2>
            <ErrorAlert error={reservationsError} />
            <ul className='list-group'>
              {
                <ReservationCard
                  reservations={reservations}
                  cancelled={cancelled}
                  setCancelled={setCancelled}
                />
              }
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
