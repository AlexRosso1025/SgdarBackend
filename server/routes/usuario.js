const express = require('express');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const Disciplina = require('../models/disciplina');
const TokenDesconexion = require('../models/desconexion');
const Datospersonales = require('../models/datospersonales');
const Datosresidencia = require('../models/datosresidencia');
const Datosdeportivos = require('../models/datosdeportivos');
const Datosinstitucionales = require('../models/datosinstitucionales');
const CambioDatosPersonales = require('../models/cambioDatosPersonales');

const { verificarToken, verificarTokenDesconexion } = require('../middlewares/autenticacion');


const app = express();



const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


// ===============================================================
//                 DATOS PERSONALES DEL USUARIO                 //
// ===============================================================


/**
 * CREAR DATOS PERSONALES 
 * Este servicio permite crear los datos personales de un usuario
 * Se debe enviar el numero de documento del usuario
 * al cual se le desea registrar los datos personales
 */
app.post('/user/datospersonales/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = req.body;

    Usuario.findOne({ _id: id }, function(err, usuarioDb) {
        if (!usuarioDb) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exíste un usuario registrado con el Id ingresado`
                }
            });
        } else {
            Datospersonales.findOne({ usuarioId: id }, function(err, usuarioDB) {
                if (usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0012',
                        err: {
                            mensaje: `El usuario ${usuarioDb.email} ya tiene registrados datos personales!`
                        }
                    });
                } else {
                    let datosPersonales = new Datospersonales({
                        usuarioId: id,
                        tipoDocumento: body.tipoDocumento,
                        numeroDocumento: body.numeroDocumento,
                        lugarExpedicionDocumento: body.lugarExpedicionDocumento,
                        sexo: body.sexo,
                        primerApellido: body.primerApellido,
                        segundoApellido: body.segundoApellido,
                        nombres: body.nombres,
                        fechaNacimiento: body.fechaNacimiento,
                        paisNacimiento: body.paisNacimiento,
                        estadoCivil: body.estadoCivil,
                        eps: body.eps,
                        grupoSanguineo: body.grupoSanguineo,
                        peso: body.peso,
                        talla: body.talla,
                        discapacidad: body.discapacidad,
                        tipoDiscapacidad: body.tipoDiscapacidad,
                        etnia: body.etnia,
                        desplazado: body.desplazado,
                        trabaja: body.trabaja,
                        cabezaHogar: body.cabezaHogar
                    });
                    //grabar el objeto usuario en la bd
                    datosPersonales.save((err, datosPersonalesDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: 'Datos personales registrados exitosamente'
                        });
                    });
                }
            });
        }
    });
});

/**
 * ACTUALIZAR DATOS PERSONALES
 * Servicio que permite modificar ciertos campos de los datos personales
 * de acuerdo al documento del usuario ingresado
 * este servicio verifica que el cambio de datos se encuentre habilitado
 * para proceder a la actualización de datos
 */
app.put('/user/datospersonales/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['sexo', 'estadoCivil', 'tipoDocumento', 'lugarExpedicionDocumento', 'numeroDocumento', 'eps', 'peso', 'talla', 'discapacidad', 'tipoDiscapacidad', 'desplazado', 'trabaja', 'cabezaHogar']);

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos personales'
                }
            });
        }
        if (!puedeModificar.estado) {
            return res.status(200).json({
                ok: false,
                codigo: '0013',
                err: {
                    mensaje: 'El cambio de datos personales esta deshabilitado'
                }
            });
        } else {
            //forma de actualizar
            Datospersonales.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        err
                    });
                }
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Datos personales del usuario actualizados exitosamente',
                    usuario: usuarioDB
                })


            });
        }
    });
});


/**
 * OBTENER DATOS PERSONALES DEL USUARIO
 * Este servicio permite obtener los datos personales
 * del usuario dependiendo del numero de documento enviado,
 * presenta solamente los datos de UN usuario en especifico
 */
app.get('/user/datospersonales/:id', [verificarToken, verificarTokenDesconexion], (req, res) => {

    let id = req.params.id;

    Datospersonales.findOne({ usuarioId: id })
        .exec((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    estado: false,
                    err
                });
            }
            if (!usuarioDB) {
                return res.status(200).json({
                    estado: false,
                    codigo: '0014',
                    err: {
                        message: 'No se encuentra datos personales registrados para el Id ingresado'
                    }
                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                datosPersonales: usuarioDB
            })

        });

});



// ===============================================================
//                                                              //
//                    USUARIO ROL: DEPORTISTA                   //
//                                                              //
// ===============================================================


// ===============================================================
//                       DATOS RESIDENCIA                       //
// ===============================================================


/**
 * CREAR DATOS DE RESIDENCIA
 * Este servicio permite crear la información de residencia de un usuario
 * con rol Deportista, mediante su id enviada como parametro en la API
 */
app.post('/user/datosresidencia/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = req.body;

    Usuario.findOne({ _id: id }, function(err, usuarioDb) {
        if (!usuarioDb) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario registrado con el Id ingresado`
                }
            });
        } else {
            Datosresidencia.findOne({ usuarioId: id }, function(err, usuarioDB) {
                if (usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0012',
                        err: {
                            mensaje: `El usuario ${usuarioDb.email} ya tiene registrados datos de residencia!`
                        }
                    });
                } else {
                    let datosResidencia = new Datosresidencia({
                        usuarioId: id,
                        pais: body.pais,
                        departamento: body.departamento,
                        municipio: body.municipio,
                        barrio: body.barrio,
                        direccion: body.direccion,
                        estrato: body.estrato,
                        telefono: body.telefono,
                        celular: body.celular,
                        correo: body.correo
                    });
                    //grabar el objeto usuario en la bd
                    datosResidencia.save((err, datosResidenciaDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: 'Datos socioeconómicos registrados exitosamente'
                        });
                    });
                }
            });
        }
    });
});


/**
 * ACTUALIZAR DATOS RESIDENCIA
 * Servicio que permite modificar todos los campos de los datos de residencia
 * de acuerdo al id enviado como parametro
 * este servicio verifica que el cambio de datos se encuentre habilitado
 * para proceder a la actualización de datos
 */
app.put('/user/datosresidencia/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['pais', 'departamento', 'municipio', 'barrio', 'direccion', 'estrato', 'telefono', 'celular', 'correo']);

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos'
                }
            });
        }
        if (!puedeModificar.estado) {
            return res.status(200).json({
                ok: false,
                codigo: '0013',
                mensaje: 'El cambio de datos esta deshabilitado'
            });
        } else {
            //forma de actualizar
            Datosresidencia.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        err
                    });
                }
                if (!usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0011',
                        mensaje: `No se encuentra un usuario asociado al Id enviado`
                    });
                }
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Datos de residencia del usuario actualizados exitosamente',
                    usuario: usuarioDB
                })
            });
        }
    });
});

/**
 * OBTENER DATOS DE RESIDENCIA
 * Este servicio permite obtener los datos de residencia
 * del usuario dependiendo del numero de documento enviado,
 * presenta solamente los datos de UN usuario en especifico
 */
app.get('/user/datosresidencia/:id', [verificarToken, verificarTokenDesconexion], (req, res) => {

    let id = req.params.id;

    Datosresidencia.findOne({ usuarioId: id })
        .exec((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    estado: false,
                    err
                });
            }
            if (!usuarioDB) {
                return res.status(200).json({
                    estado: false,
                    codigo: '0014',
                    mensaje: 'No se encuentran datos de residencia registrados para la Id ingresada'

                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                datosSocioeconomicos: usuarioDB
            })
        });
});



// ===============================================================
//                      DATOS INSTITUCIONALES                   //
// ===============================================================



/**
 * CREAR DATOS INSTITUCIONALES
 * Este servicio permite crear los datos institucionales de un usuario
 * con rol Deportista, mediante su id enviada como parametro en la API
 */
app.post('/user/datosinstitucionales/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = req.body;

    Usuario.findOne({ _id: id }, function(err, usuarioDb) {
        if (!usuarioDb) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario registrado con el Id ingresado`
                }
            });
        } else {
            Datosinstitucionales.findOne({ usuarioId: id }, function(err, usuarioDB) {
                if (usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0012',
                        err: {
                            mensaje: `El usuario ${usuarioDb.email} ya tiene registrados datos institucionales!`
                        }
                    });
                } else {
                    let datosInstitucionales = new Datosinstitucionales({
                        usuarioId: id,
                        tipoAspirante: body.tipoAspirante,
                        anioIngreso: body.anioIngreso,
                        facultad: body.facultad,
                        programaAcademico: body.programaAcademico,
                        semestreActual: body.semestreActual,
                        promedioAcumulado: body.promedioAcumulado,
                        sede: body.sede
                    });
                    //grabar el objeto usuario en la bd
                    datosInstitucionales.save((err, datosInstitucionalesDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: 'Datos institucionales registrados exitosamente'
                        });
                    });
                }
            });
        }
    });
});



/**
 * ACTUALIZAR DATOS INSTITUCIONALES
 * Servicio que permite modificar todos los campos de los datos institucionales
 * de acuerdo al id enviado como parametro
 * este servicio verifica que el cambio de datos se encuentre habilitado
 * para proceder a la actualización de datos
 */
app.put('/user/datosinstitucionales/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['tipoAspirante', 'anioIngreso', 'facultad', 'programaAcademico', 'semestreActual', 'promedioAcumulado', 'sede']);

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos'
                }
            });
        }
        if (!puedeModificar.estado) {
            return res.status(200).json({
                ok: false,
                codigo: '0013',
                err: {
                    mensaje: 'El cambio de datos esta deshabilitado'
                }
            });
        } else {
            //forma de actualizar
            Datosinstitucionales.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        err
                    });
                }
                if (!usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0011',
                        err: {
                            mensaje: `No se encuentra un usuario asociado al Id enviado`
                        }
                    });
                }
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Datos institucionales del usuario actualizados exitosamente',
                    usuario: usuarioDB
                })
            });
        }
    });
});


/**
 * OBTENER DATOS INSTITUCIONALES
 * Este servicio permite obtener los datos institucionales
 * del usuario dependiendo del numero de documento enviado,
 * presenta solamente los datos de UN usuario en especifico
 */
app.get('/user/datosinstitucionales/:id', [verificarToken, verificarTokenDesconexion], (req, res) => {

    let id = req.params.id;

    Datosinstitucionales.findOne({ usuarioId: id })
        .exec((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    estado: false,
                    err
                });
            }
            if (!usuarioDB) {
                return res.status(200).json({
                    estado: false,
                    codigo: '0014',
                    err: {
                        message: 'No se encuentran datos institucionales registrados para la Id ingresada'
                    }
                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                datosInstitucionales: usuarioDB
            })
        });
});


// ===============================================================
//                        DATOS DEPORTIVOS                      //
// ===============================================================



/**
 * CREAR DATOS DEPORTIVOS
 * Este servicio permite crear los datos deportivos de un usuario
 * con rol Deportista, mediante su id enviada como parametro en la API
 */
app.post('/user/datosdeportivos/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = req.body;

    Usuario.findOne({ _id: id }, function(err, usuarioDb) {
        if (!usuarioDb) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    mensaje: `No exite un usuario registrado con el Id ingresado`
                }
            });
        } else {
            Datosdeportivos.findOne({ usuarioId: id }, function(err, usuarioDB) {
                if (usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0012',
                        err: {
                            mensaje: `El usuario ${usuarioDb.email} ya tiene registrados datos deportivos!`
                        }
                    });
                } else {
                    let datosDeportivos = new Datosdeportivos({
                        usuarioId: id,
                        foto: body.foto,
                        fechaInscripcion: body.fechaInscripcion,
                        disciplinaDeportiva: body.disciplinaDeportiva,
                        especialidad: body.especialidad,
                        genero: body.genero,
                        categorizacion: body.categorizacion,
                        tipoDeportista: body.tipoDeportista,
                        nivelDeportivo: body.nivelDeportivo,
                        cicloOlimpico: body.cicloOlimpico,
                        cicloOlimpicoActual: body.cicloOlimpicoActual,
                        mayorLogroObtenido: body.mayorLogroObtenido
                    });
                    datosDeportivos.save((err, datosDeportivosDB) => {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                err
                            });
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            datosDeportivos: datosDeportivosDB
                        });
                    });
                }
            });
        }
    });
});



/**
 * ACTUALIZAR DATOS INSTITUCIONALES
 * Servicio que permite modificar todos los campos de los datos institucionales
 * de acuerdo al id enviado como parametro
 * este servicio verifica que el cambio de datos se encuentre habilitado
 * para proceder a la actualización de datos
 */
app.put('/user/datosdeportivos/:id', [verificarToken, verificarTokenDesconexion], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['foto', 'fechaInscripcion', 'disciplinaDeportiva', 'especialidad', 'genero', 'categorizacion', 'tipoDeportista', 'nivelDeportivo', 'cicloOlimpico', 'cicloOlimpicoActual', 'mayorLogroObtenido']);

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos'
                }
            });
        }
        if (!puedeModificar.estado) {
            return res.status(200).json({
                ok: false,
                codigo: '0013',
                err: {
                    mensaje: 'El cambio de datos esta deshabilitado'
                }
            });
        } else {
            //forma de actualizar
            Datosdeportivos.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        err
                    });
                }
                if (!usuarioDB) {
                    return res.status(200).json({
                        estado: false,
                        codigo: '0011',
                        err: {
                            mensaje: `No se encuentra un usuario asociado al Id enviado`
                        }
                    });
                }
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Datos deportivos del usuario actualizados exitosamente',
                    usuario: usuarioDB
                })
            });
        }
    });
});



/**
 * OBTENER DATOS DEPORTIVOS
 * Este servicio permite obtener los datos deportivos
 * del usuario dependiendo del numero de documento enviado,
 * presenta solamente los datos de UN usuario en especifico
 */
app.get('/user/datosdeportivos/:id', [verificarToken, verificarTokenDesconexion], (req, res) => {

    let id = req.params.id;

    Datosdeportivos.findOne({ usuarioId: id })
        .exec((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    estado: false,
                    err
                });
            }
            if (!usuarioDB) {
                return res.status(200).json({
                    estado: false,
                    codigo: '0014',
                    err: {
                        message: 'No se encuentran datos deportivos registrados para la Id ingresada'
                    }
                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                datosDeportivos: usuarioDB
            })
        });
});








module.exports = app;