const mongoose = require('mongoose')
const Schema = mongoose.Schema;

let disciplinaSchema = new Schema({
    nombre: {
        type: String,
        unique: true,
        required: [true, 'El nombre de la disciplina es obligatorio']
    }
});

module.exports = mongoose.model('Disciplina', disciplinaSchema);