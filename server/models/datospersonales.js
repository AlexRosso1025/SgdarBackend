const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

let tipoDocumentosValidos = {
    values: ['TI', 'CC', 'CE', 'PS', 'CA'],
    message: '{VALUE} no es un tipo de documento válido'
};

let sexoValido = {
    values: ['MASCULINO', 'FEMENINO'],
    message: '{VALUE} no es un sexo válido, valores permitidos: MASCULINO - FEMENINO '
}

let estadoCivilValido = {
    values: ['SOLTERO(A)', 'CASADO(A)', 'DIVORCIADO(A)', 'VIUDO(A)', 'UNION-LIBRE', 'SEPARADO(A)'],
    message: '{VALUE} no es un estado civil válido, valores permitidos: SOLTERO(A), CASADO(A), DIVORCIADO(A), VIUDO(A), UNION-LIBRE, SEPARADO(A)'
}

let epsValida = {
    values: ['SISBEN', 'ARS', 'EPS', 'OTRO'],
    message: '{VALUE} no es una EPS válida'
}

let respuestaDoble = {
    values: ['SI', 'NO'],
    message: '{VALUE} no es un valor válido'
}

let tipoDiscapacidadValida = {
    values: ['NINGUNA', 'FISICA', 'SENSORIAL', 'INTELECTUAL', 'PSIQUICA', 'VISCERAL', 'MULTIPLE'],
    message: '{VALUE} no es una discapacidad válida'
}

let etniaValida = {
    values: ['MESTIZO', 'INDIGENA', 'AFROECUATORIANO', 'BLANCO', 'MONTUBIO'],
    message: '{VALUE} no es una etnia válida'
}

let Schema = mongoose.Schema;

let datosPersonalesSchema = new Schema({
    usuarioId: {
        type: String,
        unique: true,
        required: true
    },
    tipoDocumento: {
        type: String,
        required: true,
        enum: tipoDocumentosValidos
    },
    numeroDocumento: {
        type: Number,
        unique: true,
        required: true
    },
    lugarExpedicionDocumento: {
        type: String,
        required: true
    },
    sexo: {
        type: String,
        required: true,
        enum: sexoValido
    },
    primerApellido: {
        type: String,
        required: true
    },
    segundoApellido: {
        type: String,
        required: true
    },
    nombres: {
        type: String,
        required: true
    },
    fechaNacimiento: {
        type: Date,
        required: true
    },
    paisNacimiento: {
        type: String,
        default: 'COLOMBIA'
    },
    estadoCivil: {
        type: String,
        required: true,
        enum: estadoCivilValido
    },
    eps: {
        type: String,
        required: true,
        enum: epsValida
    },
    grupoSanguineo: {
        type: String,
        required: true
    },
    peso: {
        type: Number,
        required: true
    },
    talla: {
        type: Number,
        required: true
    },
    discapacidad: {
        type: String,
        required: true,
        enum: respuestaDoble
    },
    tipoDiscapacidad: {
        type: String,
        default: 'NINGUNA',
        enum: tipoDiscapacidadValida
    },
    etnia: {
        type: String,
        required: true,
        enum: etniaValida
    },
    desplazado: {
        type: String,
        required: true,
        enum: respuestaDoble
    },
    trabaja: {
        type: String,
        required: true,
        enum: respuestaDoble
    },
    cabezaHogar: {
        type: String,
        required: true,
        enum: respuestaDoble
    }
});


datosPersonalesSchema.plugin(uniqueValidator, {
    message: '{PATH} debe de ser único'
});

module.exports = mongoose.model('Datospersonales', datosPersonalesSchema);