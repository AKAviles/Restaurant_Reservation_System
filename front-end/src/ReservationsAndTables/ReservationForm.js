import React, { useState, useEffect } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { createReservation, editReservation } from "../utils/api";
import { today, formatDate, asDateString } from "../utils/date-time";
import ErrorAlert from "../layout/ErrorAlert";
import { changeStatus } from "../utils/api";

const newToday = today();

function ReservationForm({ initialFormData }) {
  const history = useHistory();
  const { pathname } = useLocation();
  const isEdit = pathname.includes("edit");
  const isNew = pathname.includes("new");

  const [reservation, setReservation] = useState({ ...initialFormData });
  const [error, setError] = useState("");
  const [submitAttempt, setSubmitAttempt] = useState(false);

  useEffect(() => {
    let dateChosen = new Date(initialFormData.reservation_date);
    if (isEdit) {
      setReservation({
        ...initialFormData,
        reservation_date: asDateString(dateChosen),
      });
    }
  }, [initialFormData]);

  function validReservationDates({ target }) {
    // dates must be in converted from yyyy/mm/dd to mm/dd/yyyy for Date.prototype conversion
    const dateChosen = new Date(formatDate(target.value));
    const today = new Date(formatDate(newToday));
    const isNotTuesday = dateChosen.getDay() !== 2; // 2 = tuesday's index
    const isThisDayOrAfter = dateChosen.getDate() >= today.getDate();
    const isThisMonthOrAfter = dateChosen.getMonth() >= today.getMonth();
    const isThisYearOrAfter = dateChosen.getFullYear() >= today.getFullYear();
    const isAfterThisYear = dateChosen.getFullYear() - today.getFullYear() > 0;
    if (
      (isNotTuesday &&
        isThisDayOrAfter &&
        isThisMonthOrAfter &&
        isThisYearOrAfter) ||
      isAfterThisYear
    ) {
      setError("");
      setSubmitAttempt(false);
      setReservation(
        (form) => (form = { ...form, reservation_date: target.value })
      );
    } else {
      setReservation(
        (form) => (form = { ...form, reservation_date: target.value })
      );
      setError({
        message: "Please enter a valid date. (We are closed on tuesdays)",
      });
    }

    // validate time in case date was set after time
    validReservationTimes();
  }

  function badTime() {
    setError({
      message:
        "Please enter a valid time. (We reserve tables from 10:30AM to 9:30PM.)",
    });
  }

  function validReservationTimes({ target } = reservation.reservation_time) {
    let timeChosen;

    if (target) {
      timeChosen = target.value;
    } else {
      timeChosen = reservation.reservation_time;
    }

    setReservation(
      (form) => (form = { ...form, reservation_time: timeChosen })
    );

    let chosenMinutes = Number(`${timeChosen[3]}${timeChosen[4]}`);
    let chosenHour = Number(`${timeChosen[0]}${timeChosen[1]}`);

    const currentTime = new Date(Date.now());
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    //return error message if chosen time is outsisde operating hours

    if (
      (chosenHour >= 21 && chosenMinutes > 30) ||
      chosenHour > 21 ||
      (chosenHour <= 10 && chosenMinutes < 30) ||
      chosenHour < 10
    ) {
      badTime();
    } else {
      setError("");
      setSubmitAttempt(false);
    }

    if (reservation.reservation_date === newToday) {
      // if the chosen hour is later than the current hour (current hour is less than chosen hour) set reservation time
      if (currentHour < chosenHour) {
        setError("");
        setSubmitAttempt(false);
      }
      // if the chosen hour is earlier than the current hour (current hour is greater than the chosen hour ) display error message
      else if (currentHour > chosenHour) {
        badTime();
      }
      // if hours are the same check minutes
      else {
        // if the chosen minute is later than the current minute ( current minute is less than the chosen minute ) set reservation time
        if (currentMinute < chosenMinutes) {
          setError("");
          setSubmitAttempt(false);
        }
        // if the chosen minute is earlier than the current minute (current minute is greater than chosen minute) display error message
        else {
          badTime();
        }
      }
    }
  }

  function handleChange({ target: { name, value } }) {
    setReservation({ ...reservation, [name]: value });
  }

  function navigateToDashboard() {
    history.push(`/dashboard?date=${reservation.reservation_date}`);
  }

  const [cancelled, setCancelled] = useState("");

  useEffect(() => {
    if (cancelled) {
      changeStatusCancel(cancelled);
      navigateToDashboard();
    }
  }, [cancelled]);

  // call api to cancel reservation
  async function changeStatusCancel(cancelledReservation) {
    const abortController = new AbortController();
    await changeStatus(
      "cancelled",
      cancelledReservation,
      abortController.signal
    );
    setCancelled((can) => (can = ""));
    return () => abortController.abort();
  }

  function cancelBtnHandler(event) {
    event.preventDefault();
    if (
      window.confirm(
        "Do you want to cancel this reservation? This cannot be undone."
      )
    ) {
      setCancelled((cancelled) => (cancelled = reservation.reservation_id));
    }
  }

  async function APIOnSubmit(event) {
    const abortController = new AbortController();
    setError(null);
    //if this is an edit: call editReservation from API, else: call is createReservation from API
    if (isEdit) {
      try {
        await editReservation(
          { ...reservation, people: Number(reservation.people) },
          reservation.reservation_id,
          abortController.signal
        );
        // navigate to dashboard is promise is resolved
        navigateToDashboard();
      } catch (error) {
        //set error to display if caught
        setError((err) => (err = error));
      }
    } else if (isNew) {
      try {
        await createReservation(
          { ...reservation, people: Number(reservation.people) },
          abortController.signal
        );
        // navigate to dashboard is promise is resolved
        navigateToDashboard();
      } catch (error) {
        //set error to display if caught
        setError((err) => (err = error));
      }
    }

    return () => abortController.abort();
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitAttempt(true);
    if (!error) {
      APIOnSubmit(event);
    }
  }
  return (
    <div>
      <div>{submitAttempt ? <ErrorAlert error={error} /> : null}</div>

      <form onSubmit={handleSubmit}>
        <div className='row'>
          <div className='col'>
            <label htmlFor='first_name'>First Name</label>
            <br />
            <input
              type='text'
              onChange={handleChange}
              name='first_name'
              value={reservation.first_name}
              required={true}
            />
          </div>
          <div className='col'>
            <label htmlFor='last_name'>Last Name</label>
            <br />
            <input
              type='text'
              onChange={handleChange}
              name='last_name'
              value={reservation.last_name}
              required={true}
            />
          </div>
        </div>
        <div className='row'>
          <div className='col'>
            <label htmlFor='mobile_number'>Mobile Number</label>
            <br />
            <input
              type='text'
              onChange={handleChange}
              name='mobile_number'
              value={reservation.mobile_number}
              required={true}
            />
          </div>
          <div className='col'>
            <label htmlFor='people'>Party Size</label>
            <br />
            <input
              type='text'
              onChange={handleChange}
              name='people'
              value={reservation.people}
              required={true}
            />
          </div>
        </div>
        <div className='row'>
          <div className='col'>
            <label htmlFor='reservation_date'>Date of Reservation</label>
            <br />
            <input
              type='date'
              onChange={validReservationDates}
              name='reservation_date'
              value={reservation.reservation_date}
              required={true}
            />
          </div>
          <div className='col'>
            <label htmlFor='reservation_time'>Time of Reservation</label>
            <br />
            <input
              type='time'
              onChange={validReservationTimes}
              name='reservation_time'
              value={reservation.reservation_time}
              required={true}
            />
          </div>
        </div>
        <div
          style={{ margin: "25px 0 0 0" }}
          className='row w-75 justify-content-center'
        >
          <button className='btn btn-primary' type='submit'>
            Submit
          </button>
          <button
            onClick={() =>
              history.push(`/dashboard?date=${reservation.reservation_date}`)
            }
            className='btn btn-secondary'
            type='cancel'
          >
            Cancel
          </button>
          {isEdit ? (
            <div>
              <button onClick={cancelBtnHandler} className='btn btn-danger'>
                Cancel Reservation
              </button>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default ReservationForm;
