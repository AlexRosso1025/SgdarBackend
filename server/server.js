require("./config/config");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
//midlewares -> funciones que se van a disparar, cada peticion siempre pasa por estas lineas

//habilitar la carpeta public
//app.use(express.static(path.resolve(__dirname, '../public')));

//configuracion global de rutas
app.use(require("./routes/index"));
app.use(cors());


//conexion a BD

//mondoDB -> protocolo
// puerto al lado del localhost
//nombre de BD

mongoose
  .connect(
    process.env.URLDB ||
      "mongodb+srv://ssaldarriaga:edXFNyMD4qCt3yoq@pruebapoliestudiantes-rrx5q.mongodb.net/test",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(console.log("Base de datos ONLINE"))
  .catch((err) => {
    if (err) throw err;
  });
  
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Escuchando al puerto ", PORT);
});
