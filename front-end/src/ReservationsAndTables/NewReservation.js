import React from "react";
import ReservationForm from "./ReservationForm";
import { today } from "../utils/date-time";

function NewReservation() {
  const initialFormData = {
    first_name: "",
    last_name: "",
    mobile_number: "",
    reservation_date: today(),
    reservation_time: "",
    people: "",
    status: "booked",
  };

  return (
    <main className='container'>
      <div className='row justify-content-center'>
        <div className='col-8'>
          <div>
            <h1>New reservation</h1>
          </div>
          {<ReservationForm initialFormData={initialFormData} />}
        </div>
      </div>
    </main>
  );
}

export default NewReservation;
