import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./ReservationCard.css";

function ReservationCard({ reservations, setCancelled }) {
  const [reservationElements, setReservationElements] = useState([]);
  const { pathname } = useLocation();

  const isSearch = pathname.includes("search");

  //implement into dashboard
  useEffect(() => {
    setReservationElements(formatElements(reservations));
  }, [reservations]);

  function cancelBtnHandler({ target }) {
    if (
      window.confirm(
        "Do you want to cancel this reservation? This cannot be undone."
      )
    ) {
      setCancelled(
        (cancelled) => (cancelled = target.dataset.reservationIdCancel)
      );
    }
  }

  function formatElements(reservations) {
    const formattedReservationElements = reservations.map((reservation) => {
      const {
        status,
        reservation_id,
        reservation_time,
        reservation_date,
        first_name,
        last_name,
        people,
        created_at,
        mobile_number,
      } = reservation;

      // reservations can only be canceled, seated, or edited if they have status "booked"
      const booked = status === "booked";
      const buttons = (
        <div className='row justify-content-end'>
          <div>
            <a
              className='btn btn-outline-warning'
              href={`/reservations/${reservation_id}/edit`}
              role='button'
            >
              edit
            </a>
          </div>
          <div>
            {}
            <button
              className='btn btn-outline-danger'
              onClick={cancelBtnHandler}
              data-reservation-id-cancel={reservation.reservation_id}
            >
              cancel
            </button>
          </div>
          <a
            href={`/reservations/${reservation_id}/seat`}
            role='button'
            className='btn btn-outline-primary'
          >
            seat
          </a>
        </div>
      );

      const reservationElement = (
        <div
          className='card'
          key={reservation_id}
          style={{ marginBottom: "5px" }}
        >
          <div className='row justify-content-between'>
            <h3>
              {last_name}, {first_name}
            </h3>
            <div>
              <span
                className='badge bg-primary'
                data-reservation-id-status={reservation.reservation_id}
              >
                {status}
              </span>
            </div>
          </div>

          <div className='row'>
            <div className='col'>
              <h5>Mobile Number</h5>
              <p>{mobile_number}</p>
            </div>
            <div className='col'>
              <h5>Date and Time:</h5>
              <p>
                {reservation_date}, {reservation_time}
              </p>
            </div>
            <div className='col'>
              <h5>Party Size:</h5>
              <p>{people}</p>
            </div>
          </div>
          <div className='row'>
            <div className='row align-items-end'>
              <p className='col-5 ' style={{ marginLeft: "20px" }}>
                Created at: {created_at}
              </p>
              <p className='col'>Reservation ID: {reservation_id}</p>
            </div>
            <div className='col'>{booked && !isSearch ? buttons : null}</div>
          </div>
        </div>
      );
      if (status !== "cancelled") {
        return reservationElement;
      } else {
        return null;
      }
    });
    return formattedReservationElements;
  }

  return reservationElements;
}

export default ReservationCard;
