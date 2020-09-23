const mongoose = require('mongoose');

const tokenDesconexionSchema = new mongoose.Schema({
    _userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Usuario'
    },
    estadoToken: {
        type: String,
        default: 'Desconectado'
    }
});

module.exports = mongoose.model('TokenDesconexion', tokenDesconexionSchema);