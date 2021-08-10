const { PORT = 5000 } = process.env;

const app = require("./app");
const knex = require("./db/connection");

const whitelist = ["http://localhost:3000"];
const corsOptions = {
  origin: function (origin, callback) {
    console.log("** Origin of request " + origin);
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log("Origin acceptable");
      callback(null, true);
    } else {
      console.log("Origin rejected");
      callback(new Error("Not allowed by CORS"));
    }
  },
};

knex.migrate
  .latest()
  .then((migrations) => {
    console.log("migrations", migrations);
    app.listen(PORT, listener);
  })
  .catch((error) => {
    console.error(error);
    knex.destroy();
  });

function listener() {
  console.log(`Listening on Port ${PORT}!`);
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "front-end/build")));
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "front-end/build", "index.html"));
  });
}
