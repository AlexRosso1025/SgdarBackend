const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let generosValidos = {
    values: ['MASCULINO', 'FEMENINO'],
    message: '{VALUE} no es un genero válido'
};

let tipoDeportistaValido = {
    values: ['REPRESENTATIVO', 'FORMATIVO', 'PROFESIONAL', 'AMATEUR'],
    message: '{VALUE} no es un tipo de deportista válido'
};

let nivelDeportivoValido = {
    values: ['CLUB', 'SELECCION-DEPARTAMENTAL', 'SELECCION-NACIONAL'],
    message: '{VALUE} no es un nivel deportivo válido'
};

let respuestaDoble = {
    values: ['SI', 'NO'],
    message: '{VALUE} no es un valor válido'
};

let cicloOlimpicoValido = {
    values: ['PANAMERICANO', 'SURAMERICANO', 'BOLIVARIANO', 'MUNDIAL', 'PREOLIMPICO', 'NO-APLICA'],
    message: '{VALUE} no es un ciclo olimpico válido'
};


let Schema = mongoose.Schema;

let datosDeportivosSchema = new Schema({
    usuarioId: {
        type: String,
        unique: true,
        required: true
    },
    foto: {
        type: String
    },
    fechaInscripcion: {
        type: Date,
        required: true
    },
    disciplinaDeportiva: {
        type: String,
        required: true
    },
    especialidad: {
        type: String,
        required: true
    },
    genero: {
        type: String,
        required: true,
        enum: generosValidos
    },
    categorizacion: {
        type: String,
        required: true
    },
    tipoDeportista: {
        type: String,
        required: true,
        enum: tipoDeportistaValido
    },
    nivelDeportivo: {
        type: String,
        required: true,
        enum: nivelDeportivoValido
    },
    cicloOlimpico: {
        type: String,
        required: true,
        enum: respuestaDoble
    },
    cicloOlimpicoActual: {
        type: String,
        required: true,
        enum: cicloOlimpicoValido
    },
    mayorLogroObtenido: {
        type: String,
        required: true
    }
});


datosDeportivosSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Datosdeportivos', datosDeportivosSchema);