import React, { useState, useEffect } from "react";
import ErrorAlert from "../layout/ErrorAlert";
import { listTables, assignResIdToTable, getReservation } from "../utils/api";
import { useParams, useHistory } from "react-router-dom";

function SeatReservation() {
  const { reservation_id } = useParams();
  const history = useHistory();

  ////// \/ load tables \/ \\\\\\
  const [tables, setTables] = useState([]);
  const [tablesError, setTablesError] = useState(null);
  useEffect(loadTables, [reservation_id]);

  function loadTables() {
    const abortController = new AbortController();
    setTablesError(null);
    listTables(abortController.signal).then(setTables).catch(setTablesError);
    return () => abortController.abort();
  }

  const tablesList = tables.map((table) => {
    if (!table.reservation_id) {
      return (
        <option
          key={table.table_id}
          value={table.table_id}
          name={table.table_name}
          cap={table.capacity}
        >
          {table.table_name} - {table.capacity}
        </option>
      );
    } else {
      return null;
    }
  });

  // \/Load reservation\/ \\
  useEffect(() => {
    loadReservationData();
  }, []);

  const [reservation, setReservation] = useState("");
  const [reservationError, setReservationError] = useState(null);
  const [reservationElement, setReservationElement] = useState("");

  async function loadReservationData() {
    const abortController = new AbortController();
    try {
      const reservation = await getReservation(
        reservation_id,
        abortController.signal
      );
      setReservation(reservation);
      setReservationElement(
        (reservationElement) =>
          (reservationElement = (
            <div>
              <h4>The {reservation.last_name} party</h4>
              <h5>Reservation Holder:</h5>{" "}
              <p>
                {reservation.last_name}, {reservation.first_name}
              </p>
              <h5>Phone Number</h5> <p>{reservation.mobile_number}</p>
              <h5>Party of:</h5> <p>{reservation.people} people</p>
              <h5>Reservation Time</h5>
              <p>{reservation.reservation_time}</p>
            </div>
          ))
      );
    } catch (error) {
      setReservationError(error);
    }
    return () => abortController.abort();
  }

  // \/handle select state\/ \\

  const [selection, setSelection] = useState("select a table");
  const [tableCap, setTableCap] = useState("");
  const [partyIsSmallerThanCap, setPartyIsSmallerThanCap] = useState(true);
  const [nothingSelected, setNothingSelected] = useState(true);

  function handleChange(event) {
    setNothingSelected(false);
    let count = 0;
    while (event.target[count]) {
      if (event.target[count].getAttribute("value") === event.target.value) {
        const tableCap = event.target[count].getAttribute("cap");
        setTableCap(tableCap);
      }
      setSelection(event.target.value);
      count++;
    }
  }

  /// \/ assign table \/ \\\\

  function partyIsSmallerThanCapacity() {
    return Number(tableCap) >= Number(reservation.people);
  }

  async function handleSubmit(event) {
    const abortController = new AbortController();
    event.preventDefault();
    const partyIsSmallerThanCap = partyIsSmallerThanCapacity();

    if (partyIsSmallerThanCap) {
      setPartyIsSmallerThanCap(true);
      //await changeStatus("seated", reservation_id);
      await assignResIdToTable(
        reservation_id,
        selection,
        abortController.signal
      );
      history.push(
        `/dashboard?date=${reservation.reservation_date.substring(0, 10)}`
      );
    } else {
      setPartyIsSmallerThanCap(false);
    }
    return () => abortController.abort();
  }

  function handleCancel() {
    history.push(
      `/dashboard?date=${reservation.reservation_date.substring(0, 10)}`
    );
  }

  return (
    <div className='container'>
      <div className='row'></div>
      <h4>Choose table to seat reservation #{reservation_id}</h4>
      <div>
        <h3>Reservation information:</h3>
        <ErrorAlert error={reservationError} />
        {reservationElement}
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          <h5>Available tables:</h5>
          <ErrorAlert error={tablesError} />
          <select name='table_id' onChange={handleChange}>
            {nothingSelected ? <option>select a table</option> : null}
            {tablesList}
          </select>
        </label>
        <div>
          <button type='submit' className='btn btn-primary'>
            Seat Table
          </button>
          <button
            type='reset'
            onClick={handleCancel}
            className='btn btn-warning'
          >
            Cancel
          </button>
          <div>
            {partyIsSmallerThanCap ? null : (
              <p className='alert alert-danger'>
                Please make a new table selection. (Capacity may be too small
                for reservation.)
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default SeatReservation;
