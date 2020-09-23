const express = require('express');

const bcrypt = require('bcrypt');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const Disciplina = require('../models/disciplina');
const TokenDesconexion = require('../models/desconexion');
const Datospersonales = require('../models/datospersonales');
const Datosresidencia = require('../models/datosresidencia');
const Datosdeportivos = require('../models/datosdeportivos');
const Datosinstitucionales = require('../models/datosinstitucionales');
const CambioDatosPersonales = require('../models/cambioDatosPersonales');

const { verificarToken, verificaAdmin_Role, verificarTokenDesconexion } = require('../middlewares/autenticacion');


const app = express();



const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
    //midlewares -> funciones que se van a disparar, cada peticion siempre pasa por estas lineas
    // obtener usuarios
    //app.get('/admin/users', [verificarToken, verificaAdmin_Role, verificarTokenDesconexion], (req, res) => { 
app.get('/admin/users', (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 10;
    limite = Number(limite);

    Usuario.find({ estado: true }, 'nombre email role estado verificado fechaRegistro')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            res.json({
                    ok: true,
                    usuarios
                })
                /*  Usuario.count({ estado: true }, (err, conteo) => {
                     res.json({
                         ok: true,
                         usuarios,
                         cuantos: conteo

                     })

                 }) */
        })
});



//obtener usuario por id
app.get('/admin/users/:id', [verificarToken, verificaAdmin_Role, verificarTokenDesconexion], (req, res) => {

    let id = req.params.id;

    Usuario.findById(id)
        .exec((err, usuarioDB) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!usuarioDB) {
                return res.status(200).json({
                    ok: false,
                    err: {
                        message: 'ID no existe'
                    }
                });
            }

            res.json({
                ok: true,
                usuario: usuarioDB
            })

        });

});

/**
 * CREAR USUARIO
 * Permite al administrador crear un usuario (Deportologo, Fisioterapeuta, Administrador, Visualizador)
 * Este no requiere que confirme el correo, quedara verificado inmediatamente
 * No se permite tampoco que registre usuarios con rol Deportista
 * Los deportistas deberan registrarse mediante el servicio de registro
 */
app.post('/admin/users/crearusuario', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role,
        verificado: true
    });

    Usuario.findOne({ email: body.email }, function(err, user) {
        if (user) {
            return res.status(200).json({
                estado: false,
                codigo: '0009',
                err: {
                    mensaje: 'El email ya se encuentra registrado en el sistema'
                }
            });
        } else {
            //grabar el objeto usuario en la bd
            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }
                const tokenDesconexion = new TokenDesconexion({
                    _userId: usuarioDB._id
                });
                tokenDesconexion.save(function(err) {
                    if (err) {
                        return res.status(400).json({
                            ok: false,
                            err
                        });
                    }
                });
                res.json({
                    estado: true,
                    codigo: '0000',
                    mensaje: 'Usuario registrado exitosamente',
                    usuarioRegistrado: usuarioDB
                });
            });
        }
    });
});

/**
 * HABILITAR USUARIO
 * Permite habilitar un usuario del sistema que fue deshabilitado
 * Este quedara con los datos que registro antes de ser deshabilitado
 */
app.get('/admin/users/habilitarusuario/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;

    let cambiaEstado = {
        estado: true
    };
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: `Usuario ${usuarioBorrado.email} habilitado exitosamente`
        });
    });
});


/**
 * DESHABILITAR USUARIO (ELIMINAR)
 * Permite deshabilitar un usuario del sistema
 * Cumple la funcion de eliminar usuario, se utiliza la deshabilitación
 * Para tener la trazabilidad de los datos registrados por el usuario
 */
app.get('/admin/users/deshabilitarusuario/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;

    let cambiaEstado = {
        estado: false
    };
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(200).json({
                estado: false,
                codigo: '0011',
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: `Usuario ${usuarioBorrado.email} deshabilitado exitosamente`
        });
    });
});


/**
 * CAMBIAR ROL DE USUARIO
 * Permite cambiar el rol a un usuario registrado
 * en el sistema, esta funcion solamente puede ser
 * utilizada por usuario con rol ADMIN
 */
app.put('/admin/users/cambioderol/:id', function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['role']);

    //forma de actualizar
    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                mensaje: 'El ID no corresponde a ningun usuario registrado'
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: `El rol fue cambiado con exito, ahora el usuario ${usuarioDB.nombre} (${usuarioDB.email}) tiene el rol de: ${req.body.role}`
        })
    })
});


// =================================================
//              Disciplina deportiva              //
// =================================================

/**
 * OBTENER DISCIPLINAS
 * Este servicio permite obtener todas las disciplinas
 * Que se han registrado en la BD del sistema
 */
app.get('/admin/disciplinas/obtenerdisciplinas', (req, res) => {

    Disciplina.find({}, 'nombre')
        .exec((err, disciplinas) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            res.json({
                estado: true,
                codigo: '0000',
                disciplinas
            })
        })
});

/**
 * REGISTRAR DISCIPLINA
 * Este servicio permite agregar una nueva disciplina
 * a la lista de disciplinas, solamente se requiere
 * el nombre de la disciplina a crear (UNICO)
 */
app.post('/admin/disciplinas/registrardisciplina', function(req, res) {

    let body = req.body;

    let disciplina = new Disciplina({
        nombre: body.nombre
    });

    disciplina.save((err, disciplinaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Disciplina registrada exitosamente'
        });
    });
});

/**
 * MODIFICAR DISCIPLINA
 * Permite modificar el nombre de una disciplina
 * se requiere el ID de esta para su modificación
 */
app.put('/admin/disciplinas/modificardisciplina/:id', function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['nombre']);

    Disciplina.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, disciplinaDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        if (!disciplinaDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID de la disciplina no existe'
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Disciplina modificada exitosamente'
        })
    })
});

/**
 * ELIMINAR DISCIPLINA
 * Permite eliminar una disciplina que ya se encuentra
 * creada en la BD, se elimina mediante su ID
 */
app.delete('/admin/disciplinas/eliminardisciplina/:id', function(req, res) {

    Disciplina.findByIdAndDelete({ _id: req.params.id }, (err, disciplinaBorrada) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Error al procesar la solicitud en la API'
                }
            });
        }
        if (!disciplinaBorrada) {
            return res.status(200).json({
                estado: false,
                codigo: '0010',
                mensaje: 'El ID de la disciplina no existe'

            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Disciplina eliminada correctamente'
        });
    });
});


// ===============================================================
//            HABILITAR - DESHABILITAR CAMBIO DE DATOS          //
// ===============================================================

/**
 * CREAR COLECCION CAMBIO DATOS
 * Solamente se utiliza una(1) sola vez, crea el objeto en la coleccion
 * el cual posteriormente se consultara y modificara para permitir o no el cambio
 * de datos de los usuarios en el sistema
 */
app.post('/admin/users/cambiodedatos', function(req, res) {

    let cambioDatosPersonales = new CambioDatosPersonales({
        codigo: '2020',
        estado: 'false'
    });
    cambioDatosPersonales.save((err, cambioDatosPersonalesDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            cambioDatosPersonales: cambioDatosPersonalesDB
        });
    });
});


/**
 * HABILITAR CAMBIO DE DATOS 
 * Habilita el cambio de datos
 * para todos los usuarios registrados en el sistema
 * este servicio cambia el valor de la variable 'estado' a 'true'
 */
app.get('/admin/users/cambiodedatos/habilitar', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, codigoDB) {
        if (!codigoDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0404',
                err: {
                    mensaje: 'Codigo de cambio de datos personales INCORRECTO'
                }
            });
        } else {
            codigoDB.estado = 'true';
            codigoDB.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se pudo habilitar el cambio de datos'
                        }
                    });
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Cambio de datos HABILITADO exitosamente'
                    });
                }

            });
        }
    });
});

/**
 * DESHABILITAR CAMBIO DE DATOS
 * Deshabilita el cambio de datos
 * para todos los usuarios registrados en el sistema
 * este servicio cambia el valor de la variable 'estado' a 'false'
 */
app.get('/admin/users/cambiodedatos/deshabilitar', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    CambioDatosPersonales.findOne({ codigo: '2020' }, function(err, codigoDB) {
        if (!codigoDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0013',
                err: {
                    mensaje: 'Codigo de cambio de datos personales INCORRECTO'
                }
            });
        } else {
            codigoDB.estado = 'false';
            codigoDB.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se pudo deshabilitar el cambio de datos'
                        }
                    });
                } else {
                    res.json({
                        estado: true,
                        codigo: '0000',
                        mensaje: 'Cambio de datos DESHABILITADO exitosamente'
                    });
                }

            });
        }
    });
});


/**
 * CONSULTAR ESTADO CAMBIO DE DATOS 
 * Api que permite consultar si esta habilitado o deshabilitado
 * el cambio de datos
 */
app.get('/admin/users/cambiodedatos/consultar', function(req, res) {

    CambioDatosPersonales.find({}, function(err, puedeModificar) {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0001',
                err: {
                    mensaje: 'No se pudo consultar el estado del cambio de datos personales'
                }
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            puedeModificar
        });

    });
});



// =========================================================================
//                     MODIFICAR DATOS DEL USUARIO                        //
//   REGISTRO - PERSONALES - RESIDENCIA - INSTITUCIONALES - DEPORTIVOS    //
// =========================================================================


/**
 * MODIFICAR DATOS DE REGISTRO DE USUARIO
 * Permite la modificación de los datos de registro de los
 * usuarios registrados (nombre, email, estado, role), se debe enviar el ID del usuario 
 * a modificar como parametro
 */
app.put('/admin/users/modificarusuario/datosregistro/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        res.json({
            ok: true,
            usuario: usuarioDB
        })
    })
});


/**
 * MODIFICAR DATOS PERSONALES DE UN USUARIO
 * Servicio que permite modificar los datos personales
 * de acuerdo al documento del usuario ingresado
 */
app.put('/admin/users/modificarusuario/datospersonales/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['tipoDocumento', 'lugarExpedicionDocumento', 'numeroDocumento', 'sexo', 'primerApellido', 'segundoApellido', 'nombres', 'fechaNacimiento', 'paisNacimiento', 'estadoCivil', 'eps', 'grupoSanguineo', 'peso', 'talla', 'discapacidad', 'tipoDiscapacidad', 'etnia', 'desplazado', 'trabaja', 'cabezaHogar']);

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
            mensaje: 'Datos personales del usuario actualizados exitosamente'
        })
    });
});

/**
 * MODIFICAR DATOS DE RESIDENCIA DE UN USUARIO
 * Servicio que permite modificar los datos de residencia
 * de acuerdo al Id del usuario enviado como parametro
 */
app.put('/admin/users/modificarusuario/datosresidencia/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['pais', 'departamento', 'municipio', 'barrio', 'direccion', 'estrato', 'telefono', 'celular', 'correo']);

    Datosresidencia.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos de residencia del usuario actualizados exitosamente',
            usuario: usuarioDB
        })
    });
});

/**
 * MODIFICAR DATOS INSTITUCIONALES DEL USUARIO
 * Servicio que permite modificar los datos institucionales
 * de acuerdo al Id del usuario enviado como parametro
 */
app.put('/admin/users/modificarusuario/datosinstitucionales/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['tipoAspirante', 'anioIngreso', 'facultad', 'programaAcademico', 'semestreActual', 'promedioAcumulado', 'sede']);

    Datosinstitucionales.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos institucionales del usuario actualizados exitosamente',
            usuario: usuarioDB
        })
    });
});


/**
 * MODIFICAR DATOS DEPORTIVOS DEL USUARIO
 * Servicio que permite modificar los datos deportivos
 * de acuerdo al Id del usuario enviado como parametro
 */
app.put('/admin/users/modificarusuario/datosdeportivos/:id', [verificarToken, verificarTokenDesconexion, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['foto', 'fechaInscripcion', 'disciplinaDeportiva', 'especialidad', 'genero', 'categorizacion', 'tipoDeportista', 'nivelDeportivo', 'cicloOlimpico', 'cicloOlimpicoActual', 'mayorLogroObtenido']);

    Datosdeportivos.findOneAndUpdate({ usuarioId: id }, body, { context: 'query', new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                err
            });
        }
        res.json({
            estado: true,
            codigo: '0000',
            mensaje: 'Datos deportivos del usuario actualizados exitosamente',
            usuario: usuarioDB
        })
    });
});







/**
 * 
 * 
 * 
 *     SERVICIOS SOLAMENTE PARA PRUEBAS EN DESARROLLO
 * 
 * 
 * 
 */





/**
 * Servicio para eliminar usuario
 * Solamente utilizado para pruebas - NO PRODUCCIÓN
 */
app.delete('/usuario/eliminar/:id', function(req, res) {

    Usuario.findOneAndRemove({ _id: req.params.id }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0404',
                err
            });
        }
        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                codigo: '0002',
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        res.json({
            ok: true,
            codigo: '0000',
            message: 'Usuario eliminado exitosamente'
        });
    });
});

/**
 * Servicio para eliminar token de desconexion de usuario
 * Solamente utilizado para pruebas - NO PRODUCCIÓN
 */
app.delete('/usuario/eliminar-token/:id', function(req, res) {
    TokenDesconexion.findOneAndRemove({ _userId: req.params.id }, (err, tokenDesconexionBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                codigo: '0404',
                err
            });
        }
        res.json({
            ok: true,
            codigo: '0000',
            message: 'Token de desconexion asociado al usuario eliminado exitosamente'
        });

    })
});



module.exports = app;