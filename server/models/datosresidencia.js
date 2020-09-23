const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let Schema = mongoose.Schema;

let datosResidenciaSchema = new Schema({
    usuarioId: {
        type: String,
        unique: true,
        required: true
    },
    pais: {
        type: String,
        default: 'COLOMBIA'
    },
    departamento: {
        type: String,
        required: true
    },
    municipio: {
        type: String,
        required: true
    },
    barrio: {
        type: String,
        required: true
    },
    direccion: {
        type: String,
        required: true
    },
    estrato: {
        type: Number,
        required: true
    },
    telefono: {
        type: Number,
        required: true
    },
    celular: {
        type: Number,
        required: true
    },
    correo: {
        type: String,
        required: true
    }
});


datosResidenciaSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Datosresidencia', datosResidenciaSchema);