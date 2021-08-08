const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const service = require("./tables.service");
const ReservationService = require("../reservations/reservations.service");

// validate table in req.body has proper data
function validateTable(req, res, next) {
  const data = req.body.data;

  if (!data) {
    next({ status: 400, message: "data" });
  }

  const { table_name, capacity } = data;

  if (!table_name || table_name === "" || table_name.length <= 1) {
    next({ status: 400, message: "table_name" });
  }

  if (!capacity || isNaN(capacity) || capacity <= 0) {
    next({ status: 400, message: "capacity" });
  }

  next();
}

// create a new table
async function create(req, res) {
  const table = req.body.data;
  const created = await service.create(table);
  res.status(201).json({ data: created[0] });
}

async function seatReservation(req, res, next) {
  const { table_id } = req.params;
  const { reservation_id } = req.body.data;

  if (res.locals.isOccupied) {
    next({ status: 400, message: "occupied" });
  }

  const capacity = Number(res.locals.table.capacity);
  const people = Number(res.locals.reservation.people);

  if (capacity < people) {
    next({ status: 400, message: "capacity" });
  }

  const status = res.locals.reservation.status;
  await service.assignId(table_id, reservation_id);
  let resev = await ReservationService.read(reservation_id);
  if (resev.status === "seated") {
    next({
      message: "already seated",
      status: 400,
    });
  }
  let updated = await service.updateRes({
    ...resev,
    status: "seated",
  });
  res.status(200).json({ data: updated });
}

// validate reservation exists
async function reservationExists(req, res, next) {
  if (!req.body.data) {
    next({ status: 400, message: "data" });
  }
  const { reservation_id } = req.body.data;

  if (!reservation_id) {
    next({ status: 400, message: "reservation_id" });
  }

  const exists = await service.reservationExists(reservation_id);

  if (exists) {
    res.locals.reservation = exists;
    next();
  } else {
    next({ status: 404, message: `${reservation_id}` });
  }
}

// validate whether a table is already occupied
async function isOccupied(req, res, next) {
  const { table_id } = req.params;
  const table = await service.read(table_id);

  if (!table) {
    next({ status: 404, message: table_id });
  }

  if (table.reservation_id) {
    res.locals.isOccupied = true;
    res.locals.table = table;
    next();
  } else {
    res.locals.isOccupied = false;
    res.locals.table = table;
    next();
  }
}

// list and sort all tables by name
async function list(req, res) {
  const list = await service.list();
  list.sort((t1, t2) => {
    if (
      (!t1.table_name.includes("Bar") && !t2.table_name.includes("Bar")) ||
      (t1.table_name.includes("Bar") && t2.table_name.includes("Bar"))
    ) {
      let a = t1.table_name.split("");
      let T1Num = [];
      a.forEach((char) => {
        if (Number(char)) {
          T1Num.push(char);
        }
      });
      a = T1Num.join("");

      let b = t2.table_name.split("");
      let T2Num = [];
      b.forEach((char) => {
        if (Number(char)) {
          T2Num.push(char);
        }
      });

      b = T2Num.join("");

      return Number(a) - Number(b);
    } else {
      if (!t1.table_name.includes("Bar")) {
        return -1;
      } else {
        return 1;
      }
    }
  });

  res.json({
    data: list,
  });
}

// validate whether a table is free
function freeTable(req, res, next) {
  if (!res.locals.isOccupied) {
    next({ status: 400, message: "not occupied" });
  }
  next();
}

// finish reservation and clear table
async function finishReservation(req, res) {
  const { table_id } = req.params;

  let table = await service.read(table_id);
  const { reservation_id } = table;
  let resev = await ReservationService.read(reservation_id);
  let updated = await service.updateRes(
    {
      ...resev,
      status: "finished",
    },
    table_id
  );
  await service.freeTable(table_id);
  res.sendStatus(200);
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [asyncErrorBoundary(validateTable), asyncErrorBoundary(create)],
  seatReservation: [
    asyncErrorBoundary(isOccupied),
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(seatReservation),
  ],
  destroy: [
    asyncErrorBoundary(isOccupied),
    freeTable,
    asyncErrorBoundary(finishReservation),
  ],
};
