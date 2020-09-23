const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let cambioDatosPersonalesSchema = new Schema({
    codigo: {
        type: String,
        unique: true,
        default: '2020'
    },
    estado: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('CambioDatosPersonales', cambioDatosPersonalesSchema);