const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const service = require("./reservations.service");

/**
 * List handler for reservation resources
 */

async function list(req, res) {
  if (req.query.mobile_number) {
    const mobile_number = req.query.mobile_number;
    const searchResults = await service.search(mobile_number);
    res.json({ data: searchResults });
  } else {
    let date = req.query.date;
    const data = await service.list(date);

    data.sort((t1, t2) => {
      t1_time = t1.reservation_time;
      const t1_hours = Number(`${t1_time[0]}${t1_time[1]}`);
      const t1_minutes = Number(`${t1_time[3]}${t1_time[4]}`);

      t2_time = t2.reservation_time;
      const t2_hours = Number(`${t2_time[0]}${t2_time[1]}`);
      const t2_minutes = Number(`${t2_time[3]}${t2_time[4]}`);

      if (t1_hours === t2_hours) {
        return t1_minutes - t2_minutes;
      } else {
        return t1_hours - t2_hours;
      }
    });

    const sorted = data.filter(
      (reservation) => reservation.status !== "finished"
    );
    res.json({
      data: sorted,
    });
  }
}

async function read(req, res, next) {
  const { reservation_id } = req.params;
  const data = await service.read(reservation_id);
  if (data) {
    res.json({
      data: data,
    });
  } else {
    next({ status: 404, message: `${reservation_id}` });
  }
}

// validate reservation exists -> set resrvation as local vairable or call error
async function reservationExists(req, res, next) {
  const { reservation_id } = req.params;

  const exists = await service.read(reservation_id);
  if (!exists) {
    next({ status: 404, message: reservation_id });
  } else {
    res.locals.reservation = exists;
    next();
  }
}

// validate reservation has proper status when updating status
function properStatus(req, res, next) {
  const { status } = req.body.data;
  const reservation = res.locals.reservation;

  if (status === "seated" && reservation.status === "seated") {
    next({ status: 400, message: "seated" });
  }

  if (reservation.status === "finished") {
    next({ status: 400, message: "finished" });
  }
  if (
    status === "booked" ||
    status === "seated" ||
    status === "finished" ||
    status === "cancelled"
  ) {
    res.locals.status = status;
    next();
  } else {
    next({ status: 400, message: "unknown" });
  }
}

// change status of reservation in database
async function changeStatus(req, res, next) {
  const { reservation_id } = req.params;
  if (!reservation_id) {
    next({ status: 400, message: reservation_id });
  }

  if (!req.body.data) {
    next({ status: 400, message: "data" });
  }

  const status = res.locals.status;

  const newStatus = await service.changeStatus(status, reservation_id);
  res.status(200).json({ data: { status: newStatus[0] } });
}

//create a new reservation
async function create(req, res, next) {
  let reservation = req.body.data;
  if (!reservation) {
    next({ status: 400, message: "no reservation" });
  }
  if (!reservation.status) {
    reservation = { ...reservation, status: "booked" };
  }
  if (reservation.status === "finished") {
    next({ status: 400, message: "finished" });
  }
  if (reservation.status === "seated") {
    next({ status: 400, message: "seated" });
  }

  const newReservation = await service.create(reservation);
  res.status(201).json({
    data: newReservation[0],
  });
}

//validate req.body reservation has proper data or return error
function validateReservation(req, res, next) {
  const reservation = req.body.data;

  if (!reservation) {
    next({ status: 400, message: "data" });
  }
  const {
    first_name,
    last_name,
    mobile_number,
    reservation_date,
    reservation_time,
    people,
  } = reservation;

  const attributes = {
    first_name: first_name,
    last_name: last_name,
    reservation_time: reservation_time,
    reservation_date: reservation_date,
    people: people,
    mobile_number: mobile_number,
  };

  let isValidData = true;

  for (let [key, value] of Object.entries(attributes)) {
    if (key === "people" && isNaN(value)) {
      isValidData = false;
      next({ status: 400, message: "people" });
    }

    if (!value || value === "") {
      isValidData = false;
      next({ status: 400, message: `${key}` });
    }

    if (key === "reservation_time") {
      //interpolate hours and minutes and check validity
      const hours = Number(`${value[0]}${value[1]}`);
      const minutes = Number(`${value[3]}${value[4]}`);
      if (
        hours > 20 ||
        hours < 10 ||
        minutes < 0 ||
        minutes > 60 ||
        isNaN(minutes) ||
        isNaN(hours) ||
        (hours === 20 && minutes > 30) ||
        (hours === 10 && minutes < 30)
      ) {
        isValidData = false;
        next({ status: 400, message: key });
      }
    }

    if (key === "reservation_date") {
      let message = "";

      const date = new Date(`${value} ${attributes.reservation_time}`);
      if (isNaN(date)) {
        next({ status: 400, message: `${key}` });
      }

      const today = new Date(Date.now());
      const offset = today.getTimezoneOffset() / 60;
      const isATuesday = date.getDay() === 2;
      const compareYear = date.getFullYear() - today.getFullYear();
      const compareMonth = date.getMonth() - today.getMonth();
      const compareDay = date.getDate() - today.getDate();
      const compareHours = date.getHours() + 7 - today.getHours();
      const compareMinutes = date.getMinutes() - today.getMinutes();

      let isInThePast = null;
      if (compareYear >= 0) {
        if (compareYear === 0) {
          if (compareMonth >= 0) {
            if (compareMonth === 0) {
              if (compareDay >= 0) {
                if (compareDay === 0) {
                  if (compareHours >= 0) {
                    if (compareHours === 0) {
                      if (compareMinutes >= 0 || compareMinutes === 0) {
                      } else {
                        //minute is in the past
                        isValidData = false;
                        message = "future";
                        isInThePast = true;
                      }
                    }
                  } else {
                    //hour is in the past
                    isValidData = false;
                    message = "future";
                    isInThePast = true;
                  }
                }
              } else {
                //day is in the past
                isValidData = false;
                message = "future";
                isInThePast = true;
              }
            }
          } else {
            //month is in the past
            isValidData = false;
            message = "future";
            isInThePast = true;
          }
        }
      } else {
        //year is in the past
        isValidData = false;
        message = "future";
        isInThePast = true;
      }

      if (isATuesday) {
        message = "closed";
      }

      if (isATuesday || isInThePast) {
        next({ status: 400, message: `${message}` });
      }
    }
  }

  if (isValidData) {
    next();
  } else {
    next({ status: 400, message: "Data is invalid" });
  }
}

//edit existing resrevation data
async function editReservation(req, res, next) {
  const { reservation_id } = req.params;

  if (!reservation_id) {
    next({ status: 400, message: "data" });
  }

  if (!req.body.data) {
    next({ status: 400, message: "data" });
  }

  const reservation = req.body.data;
  if (!reservation) {
    next({ status: 400, message: "no reservation" });
  }

  const update = await service.editReservation(reservation_id, reservation);
  res.status(200).json({ data: update[0] });
}

function isPeopleNumber(req, res, next) {
  const { data: { people } = {} } = req.body;
  if (typeof people !== "number") {
    return next({
      status: 400,
      message: "people: must be a Number",
    });
  } else {
    next();
  }
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [
    asyncErrorBoundary(validateReservation),
    isPeopleNumber,
    asyncErrorBoundary(create),
  ],
  read: asyncErrorBoundary(read),
  changeStatus: [
    asyncErrorBoundary(reservationExists),
    properStatus,
    asyncErrorBoundary(changeStatus),
  ],
  editReservation: [
    asyncErrorBoundary(validateReservation),
    isPeopleNumber,
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(editReservation),
  ],
};
