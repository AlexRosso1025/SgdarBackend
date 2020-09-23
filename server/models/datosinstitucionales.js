const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let tipoAspiranteValido = {
    values: ['NUEVO', 'REINGRESO', 'TRANSFERENCIA-INTERNA', 'TRANSFERENCIA-EXTERNA', 'CICLO-PROPEDEUTICO', 'OTRO'],
    message: '{VALUE} no es un tipo de aspirante válido'
};

let tipoFacultadValida = {
    values: ['ADMINISTRACION', 'CIENCIAS-AGRARIAS', 'CIENCIAS-BASICAS', 'COMUNICACION-AUDIOVISUAL', 'EDUCACION-FISICA', 'INGENIERIA'],
    message: '{VALUE} no es una facultad válida'
};

let sedeValida = {
    values: ['MEDELLÍN', 'RIONEGRO', 'APARTADÓ'],
    message: '{VALUE} no es una sede válida'
};

let programasValidos = {
    values: ['', ''],
    message: '{VALUE} no es un programa válido'
};


let Schema = mongoose.Schema;

let datosInstitucionalesSchema = new Schema({
    usuarioId: {
        type: String,
        unique: true,
        required: true
    },
    tipoAspirante: {
        type: String,
        required: true,
        enum: tipoAspiranteValido
    },
    anioIngreso: {
        type: String,
        required: true
    },
    facultad: {
        type: String,
        required: true,
        enum: tipoFacultadValida
    },
    programaAcademico: {
        type: String,
        required: true
    },
    semestreActual: {
        type: Number,
        required: true
    },
    promedioAcumulado: {
        type: String,
        required: true
    },
    sede: {
        type: String,
        required: true,
        enum: sedeValida
    }
});


datosInstitucionalesSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Datosinstitucionales', datosInstitucionalesSchema);