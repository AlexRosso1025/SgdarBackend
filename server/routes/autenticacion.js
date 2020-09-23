const express = require('express');

const crypto = require('crypto');


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');


const Usuario = require('../models/usuario');
const Token = require('../models/token');
const TokenDesconexion = require('../models/desconexion');

const app = express();


// =============================
// RUTAS REST AUTENTICACIÓN
// =============================

app.get('/', (req, res) => {
    res.json({
        codigo: '0000',
        message: 'Pantalla de inicio, Bienvenido a la pagina principal de APIs del SGDAR POLI JIC'
    })
});

/**
 * AUTENTICACIÓN DE USUARIO
 * Este servicio permite iniciar sesion con un email y contraseña que se encuentren
 * registrados en la Base de Datos. 
 * Se implementa un metodo para verificar si el email enviado coincide con alguno
 * de los que se tiene guardado, igualmente se verifica la contraseña encriptada.
 * Si los datos son correctos se genera el token de sesión para el usuario.
 * se retorna un rs con el estado, usuario y token
 */
app.post('/autenticacion/autenticarse', (req, res) => {
    //obtenemos el correo y password que envia el usuario
    let body = req.body;
    //si existe un correo valido lo voy a obtener en usuarioDB, sino usuarioDB seria null o vacio
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        if (err) {
            //con el return ya me salgo de la funcion
            return res.status(400).json({
                estado: false,
                codigo: '0001',
                err: {
                    mensaje: 'Error al intentar consultar el usuario, intente despues'
                }
            });
        }
        //verificamos si el email no existe
        if (!usuarioDB) {
            return res.status(200).json({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'No se encuentra un usuario registrado con el correo ingresado'
                }
            });
        }
        //verificamos que el usuario este verificado
        if (!usuarioDB.verificado) {
            return res.status(200).json({
                estado: false,
                codigo: '0003',
                err: {
                    mensaje: 'No ha confirmado su correo electronico, si no tiene un correo de confirmación, solicitelo nuevamente!'
                }
            });
        }
        if (!usuarioDB.estado) {
            return res.status(200).json({
                estado: false,
                codigo: '0004',
                err: {
                    mensaje: 'Usuario desactivado, comuniquese con el administrador del sistema!'
                }
            });
        }
        //verificamos si la contraseña no coincide con la del usuario
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(200).json({
                estado: false,
                codigo: '0005',
                err: {
                    mensaje: 'Clave incorrecta, verifique la clave ingresada'
                }
            });
        }

        //generamos el token
        let token = jwt.sign({
            usuario: usuarioDB
        }, process.env.SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });

        TokenDesconexion.findOne({ _userId: usuarioDB._id }, (err, tokenDesconexion) => {
            if (err) {
                return res.status(400).json({
                    estado: false,
                    codigo: '0001',
                    err: {
                        mensaje: 'Error al consultar el token de desconexion del usuario'
                    }
                });
            }

            tokenDesconexion.estadoToken = token;

            tokenDesconexion.save((err, token) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se pudo almacenar el token de desconexion del usuario, Verifiquelo manualmente en la base de datos'
                        }
                    });
                }
            });
        });

        //devolvemos la respuesta en formato json
        res.json({
            estado: true,
            codigo: '0000',
            usuario: usuarioDB,
            token
        });
    })
});

/**
 * REGISTRO DE USUARIO
 * Este servicio permite registrarse en la Base de Datos
 * Para esto se debe hacer un rq con el nombre, email y contraseña del usuario a registrar
 * el correo enviado se verificara con la intención de que no se encuentre registrado previamente en la Base de Datos
 * En caso de que no este registrado, se crea el usuario y se envia un mail con token para que el usuario confirme el email
 */
app.post('/autenticacion/registrarse', function(req, res) {
    //obtenemos los datos enviamos en el rq
    let body = req.body;
    //definimos una variable usuario con los datos enviados en el rq
    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: 'DEPORTISTA_ROLE'
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
            //grabamos el objeto usuario en la Base de datos
            usuario.save((err, usuarioDB) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'No se pudo registrar el usuario en la base de datos'
                        }
                    });
                }

                //se crea el token que servira para confirmar la cuenta via email
                const token = new Token({
                    _userId: usuarioDB._id,
                    token: crypto.randomBytes(16).toString('hex')
                });
                // Guardamos el token de confirmacion
                token.save(function(err) {
                    if (err) {
                        return res.status(400).json({
                            estado: false,
                            codigo: '0001',
                            err: {
                                mensaje: 'No se guardo el token de confirmación en la base de datos'
                            }
                        });
                    }
                    //se crea el token de desconexion, utilizando el ID del usuario para referenciarlo
                    const tokenDesconexion = new TokenDesconexion({
                        _userId: usuarioDB._id
                    });
                    //Guardamos el nuevo registro del token de Desconexion
                    tokenDesconexion.save(function(err) {
                        if (err) {
                            return res.status(400).json({
                                ok: false,
                                codigo: '0001',
                                err: {
                                    mensaje: 'El token de desconexion asociado al usuario no se creo en la base de datos'
                                }
                            });
                        }
                    });

                    const URL_PRODUCCION = `http://sgdarpoli.com/confirmacion/${token.token}`;
                    const URL_DESARROLLO = `http://localhost:3000/confirmacion/${token.token}`;


                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.GMAIL_USERNAME,
                            pass: process.env.GMAIL_PASSWORD
                        }


                    });

                    const mailOptions = {
                        from: 'no-reply@tdgpolijic.com',
                        to: req.body.email,
                        subject: "Confirme su email de registro",
                        html: `<center><table width="900"><tbody><tr><td><br><br><br></td></tr><tr><td><br><p align="left"></p><h3><b>Estimado ${usuario.nombre},</b>
                       </h3><p></p><p>Hemos recibido una solicitud para registrarse en el portal de SGDAR POLI JIC. </p><p>El <b>Link,</b> para confirmar su correo y finalizar el registro es el siguiente:</p>
                       </td></tr><tr><td align="center"><br> <div><p style="padding:0px 0px;word-wrap:break-word">
                       <a href="${URL_DESARROLLO}"><input type="button" style="background-color: #4CAF50; border: none; color: white; padding: 15px 200px; text-align: center;
                       text-decoration: none; display: inline-block; font-size: 18px" value="CONFIRMAR CUENTA"></a></p></div><br></td></tr><tr><td align="left">
                       <p>El Link para confirmar el correo caducará en <b>30 minutos</b>; asegúrese de utilizarlo inmediatamente. <br>Pasado el tiempo deberá generar un nuevo código en el módulo de registro.<br>Si no solicitó el registro de usuario, por favor ignore este correo</p>
                       <p><b>Nota</b>: Una vez cumplido este procedimiento ya puede iniciar sesión en el portal con sus datos.</p><div style="text-align:justify;font-size:10px">
                       <p style="text-align:justify">AVISO LEGAL</p><p>Este mensaje es confidencial, privado y está protegido por las normas jurídicas que aplican. Usted no debe copiar el mensaje ni divulgar su contenido a ninguna persona y por ningún medio. Si lo ha recibido por error, por favor elimínelo de su sistema.
                       <br>Esta cuenta de correo es de uso exclusivo para envío, por favor absténgase de escribir o responder al mismo, puesto que rebotará y/o no obtendrá respuesta</p>
                       </div></td></tr><tr><td></td></tr><tr><td><div style="float:left;width:50%;height:10px;background-color:#5bb75b"></div>
                       <div style="float:left;width:50%;height:10px;background-color:#faa732"></div></td></tr></tbody></table></center>`
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            console.log(err);
                            return next(err);
                        }
                        res.json({
                            estado: true,
                            codigo: '0000',
                            mensaje: "Usuario registrado, Mensaje de confirmación enviado al correo",
                            usuarioRegistado: usuarioDB
                        });
                    });
                });
            });
        }
    });
});


app.post('/autenticacion/olvido-clave', (req, res, next) => {

    const token = crypto.randomBytes(16).toString('hex');

    Usuario.findOne({ email: req.body.email }, function(err, user, req) {
        if (!user) {
            return res.status(200).json({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'El email ingresado no se encuentra registrado en el sistema'
                }
            });

        }
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000; //1 hour

        user.save(function(err) {
            if (err) {
                return res.status(400).send({
                    msg: err.message
                });
            }
        });

    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    });


    const URL_PRODUCCION = `http://sgdarpoli.com/reset/${token}`;
    const URL_DESARROLLO = `http://localhost:3000/reset/${token}`;
    const mailOptions = {
        from: 'no-reply@password-changed', //sender
        to: req.body.email,
        subject: 'Restablece tu clave en SGDAR POLI JIC',
        html: `<center><table width="900"><tbody><tr><td><br><br><br></td></tr><tr><td><br><p align="left"></p><h2><b>Reestablece tu clave</b></h2>
               <p></p><p>Hemos recibido una solicitud para reestablecer la clave en el portal de SGDAR POLI JIC. </p><p>El <b>Link,</b> para reestablecer la clave de su cuenta es el siguiente:</p>
               </td></tr><tr><td align="center"><br><div><p style="padding:0px 0px;word-wrap:break-word"><a href="${URL_DESARROLLO}"><input type="button" style="background-color: #4CAF50; border: none; color: white; padding: 15px 200px; text-align: center;
               text-decoration: none; display: inline-block; font-size: 18px" value="REESTABLECER CLAVE"></a></p></div><br></td></tr><tr><td align="left">
               <p>El Link para reestablecer la clave caducará en <b>30 minutos</b>; asegúrese de utilizarlo inmediatamente. <br>Pasado el tiempo deberá generar un nuevo código en el módulo de autenticación.<br>Si no solicitó el olvido de clave, por favor ignore este correo</p>
               <div style="text-align:justify;font-size:10px"><p style="text-align:justify">AVISO LEGAL</p><p>Este mensaje es confidencial, privado y está protegido por las normas jurídicas que aplican. Usted no debe copiar el mensaje ni divulgar su contenido a ninguna persona y por ningún medio. Si lo ha recibido por error, por favor elimínelo de su sistema.
               <br>Esta cuenta de correo es de uso exclusivo para envío, por favor absténgase de escribir o responder al mismo, puesto que rebotará y/o no obtendrá respuesta</p>
               </div></td></tr><tr><td></td></tr><tr><td><div style="float:left;width:50%;height:10px;background-color:#5bb75b"></div>
              <div style="float:left;width:50%;height:10px;background-color:#faa732"></div></td></tr></tbody></table></center>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return res.status(400).json({
                estado: false,
                codigo: '0001',
                err: {
                    mensaje: 'Error al intentar enviar el correo electronico'
                }
            });
        }
        res.json({
            codigo: '0000',
            message: "El correo para reestablecer la contraseña se envio exitosamente"
        });
    });


});

app.get('/reset/:token', function(req, res, next) {
    Usuario.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function(err, user) {
        if (err) {
            return res.status(400).json({
                estado: false,
                codigo: '0001',
                err: {
                    mensaje: 'Error al intentar procesar la solicitud'
                }
            });
        }

        if (!user) {
            return res.status(200).json({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'No se encontro un usuario asociado al token que se quiere verificar'
                }
            });
        }

        res.json({
            ok: true,
            err: {
                message: 'Se presenta la pantalla para ingresar la nueva contraseña -> cambiar mennsaje',
                codigo: '0000'
            }
        });
    });
});

app.post('/reset/:token', function(req, res) {
    Usuario.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, function(err, user) {
        if (err) {
            return res.status(400).json({
                estado: false,
                codigo: '0001',
                err: {
                    mensaje: 'Error al intentar procesar la solicitud'
                }
            });
        }

        if (!user) {
            return res.status(200).json({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'No se encontro un usuario asociado al token que se quiere verificar'
                }
            });
        }
        if (req.body.password === req.body.confirmarpassword) {
            user.password = bcrypt.hashSync(req.body.password, 10);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            user.save(function(err) {
                if (err) {
                    return res.status(400).json({
                        ok: false,
                        err
                    });
                }
            });

        } else {
            return res.status(200).json({
                estado: false,
                codigo: '0006',
                err: {
                    mensaje: 'Contraseñas no coinciden'

                }
            });
        }



        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USERNAME,
                pass: process.env.GMAIL_PASSWORD
            }
        });

        const URL_PRODUCCION = 'http://sgdarpoli.com';
        const URL_DESARROLLO = 'http://localhost:3000';
        const mailOptions = {
            to: user.email,
            from: 'no-reply@changed-password',
            subject: 'Se ha cambiado la clave de tu cuenta',
            html: `<center><table width="900"><tbody><tr><td><br><br><br></td></tr><tr><td><br><p align="left"></p><h2><b>Tienes una clave nueva</b>
                  </h2><p></p><p>¡Has actualizado la clave de SGDAR POLI JIC! Si no has hecho este cambio, contacta con nuestro equipo de Ayuda. (contacto@polijic.edu.co) </p>
                  <p>Puedes iniciar sesión con tu nueva clave en el sitio presionando el siguiente boton</p></td></tr><tr><td align="center"><br><div>
                  <p style="padding:0px 0px;word-wrap:break-word"><a href="${URL_DESARROLLO}"><input type="button" style="background-color: #4CAF50; border: none; color: white; padding: 15px 200px; text-align: center;
                  text-decoration: none; display: inline-block; font-size: 18px" value="IR AL SITIO WEB"></a></p></div><br></td></tr><tr><td align="left">
                  <p>Has recibido este correo electrónico porque has cambiado la clave. Si has recibido esta notificación por error, contacta con el equipo de Ayuda.</p>
                  <div style="text-align:justify;font-size:10px"><p style="text-align:justify">AVISO LEGAL</p><p>Este mensaje es confidencial, privado y está protegido por las normas jurídicas que aplican. Usted no debe copiar el mensaje ni divulgar su contenido a ninguna persona y por ningún medio. Si lo ha recibido por error, por favor elimínelo de su sistema.
                  <br>Esta cuenta de correo es de uso exclusivo para envío, por favor absténgase de escribir o responder al mismo, puesto que rebotará y/o no obtendrá respuesta</p>
                  </div></td></tr><tr><td></td></tr><tr><td><div style="float:left;width:50%;height:10px;background-color:#5bb75b"></div>
                  <div style="float:left;width:50%;height:10px;background-color:#faa732"></div></td></tr></tbody></table></center>`
        };
        transporter.sendMail(mailOptions, function(err) {
            if (err) {
                return res.status(400).json({
                    estado: false,
                    codigo: '0001',
                    err: {
                        mensaje: 'Error al intentar enviar el correo electronico'
                    }
                });
            }
            res.json({
                codigo: '0000',
                mensaje: "La clave se cambio exitosamente, se envio un correo confirmandolo",

            });
        });
    });

});


//token para verificar correo 
app.get('/confirmacion/:token', function(req, res) {

    let tokenObtenido = req.params.token;

    // Buscamos el token que trae del correo con el registrado en la BD
    Token.findOne({ token: tokenObtenido }, function(err, token) {
        if (!token) {
            return res.status(200).send({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'No pudimos encontrar un token asociado al que intenta verificar en nuestro sistema.'
                }

            });
        }
        // Buscamos el usuario mediante el ID del token que se encuentra
        Usuario.findOne({ _id: token._userId }, function(err, user) {
            if (!user)
                return res.status(200).send({
                    estado: false,
                    codigo: '0002',
                    err: {
                        mensaje: 'No se encontro un usuario asociado a este token.'
                    }
                });
            if (user.verificado)
                return res.status(200).send({
                    estado: false,
                    codigo: '0007',
                    err: {
                        mensaje: 'El usuario ya se encuentra verificado en el sistema.'
                    }

                });

            // Cambiamos el estado de verificado del usuario
            user.verificado = true;
            user.save(function(err) {
                if (err) {
                    return res.status(400).send({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'Error al cambiar el estado de verificado del usuario en la base de datos'
                        }
                    });
                }
                res.status(200).send("Cuenta verificada, ya puede iniciar sesión con sus credenciales");
            });
            //eliminamos el token que acabamos de confirmar de la BD
            Token.findOneAndRemove({ _userId: user._id }, function(err) {
                if (err) {
                    return res.status(400).send({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'Error al eliminar el token de confirmación almacenado en la Base de datos'
                        }
                    });
                }
            });


        });
    });
});


app.post('/confirmacion/reenviar-token', function(req, res, next) {

    Usuario.findOne({ email: req.body.email }, function(err, usuarioDB) {
        if (!usuarioDB) {
            return res.status(200).send({
                estado: false,
                codigo: '0002',
                err: {
                    mensaje: 'No pudimos encontrar un usuario con ese correo'
                }
            });
        }
        if (usuarioDB.verificado) {
            return res.status(200).send({
                estado: false,
                codigo: '0007',
                err: {
                    mensaje: 'El usuario ya se encuentra verificado en el sistema.'
                }
            });
        }

        const token = new Token({
            _userId: usuarioDB._id,
            token: crypto.randomBytes(16).toString('hex')
        });

        const URL_PRODUCCION = `http://sgdarpoli.com/confirmacion/${token.token}`;
        const URL_DESARROLLO = `http://localhost:3000/confirmacion/${token.token}`;
        // Save the verification token
        token.save(function(err) {
            if (err) {
                return res.status(400).json({
                    estado: false,
                    codigo: '0001',
                    err: {
                        mensaje: 'Error al guardar el token que se acaba de generar antes de enviarlo al usuario'
                    }
                });
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USERNAME,
                    pass: process.env.GMAIL_PASSWORD
                }


            });

            const mailOptions = {
                from: 'no-reply@confirmar-email',
                to: req.body.email,
                subject: "Confirme su email de registro",
                html: `<center><table width="900"><tbody><tr><td><br><br><br></td></tr><tr><td><br><p align="left"></p><h3><b>Estimado ${usuarioDB.nombre},</b>
                </h3><p></p><p>Hemos recibido una solicitud para registrarse en el portal de SGDAR POLI JIC. </p><p>El <b>Link,</b> para confirmar su correo y finalizar el registro es el siguiente:</p>
                </td></tr><tr><td align="center"><br> <div><p style="padding:0px 0px;word-wrap:break-word">
                <a href="${URL_DESARROLLO}"><input type="button" style="background-color: #4CAF50; border: none; color: white; padding: 15px 200px; text-align: center;
                text-decoration: none; display: inline-block; font-size: 18px" value="CONFIRMAR CUENTA"></a></p></div><br></td></tr><tr><td align="left">
                <p>El Link para confirmar el correo caducará en <b>30 minutos</b>; asegúrese de utilizarlo inmediatamente. <br>Pasado el tiempo deberá generar un nuevo código en el módulo de registro.<br>Si no solicitó el registro de usuario, por favor ignore este correo</p>
                <p><b>Nota</b>: Una vez cumplido este procedimiento ya puede iniciar sesión en el portal con sus datos.</p><div style="text-align:justify;font-size:10px">
                <p style="text-align:justify">AVISO LEGAL</p><p>Este mensaje es confidencial, privado y está protegido por las normas jurídicas que aplican. Usted no debe copiar el mensaje ni divulgar su contenido a ninguna persona y por ningún medio. Si lo ha recibido por error, por favor elimínelo de su sistema.
                <br>Esta cuenta de correo es de uso exclusivo para envío, por favor absténgase de escribir o responder al mismo, puesto que rebotará y/o no obtendrá respuesta</p>
                </div></td></tr><tr><td></td></tr><tr><td><div style="float:left;width:50%;height:10px;background-color:#5bb75b"></div>
                <div style="float:left;width:50%;height:10px;background-color:#faa732"></div></td></tr></tbody></table></center>`
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    return res.status(400).json({
                        estado: false,
                        codigo: '0001',
                        err: {
                            mensaje: 'Error al intentar enviar el correo electronico'
                        }
                    });
                }
                res.json({
                    codigo: '0000',
                    mensaje: "El token se reenvio exitosamente al correo del usuario"
                });
            });
        });

    });
});


/**
 * CIERRE DE SESIÓN
 * Este servicio permite terminar la sesión del usuario actual
 * Se actualiza el campo estadoToken de la coleccion asociada al usuario utilizara para verificar la conexion
 */
app.post('/logout', (req, res) => {
    let token = req.get('token');

    TokenDesconexion.findOne({ estadoToken: token }, function(error, tokenDesconexion) {
        if (error) {
            return res.status(400).json({
                estado: false,
                codigo: '0001',
                err: {
                    mensaje: 'Error al intentar cerrar sesión, intentelo luego'
                }
            });
        }

        if (tokenDesconexion === null) {
            return res.status(200).json({
                codigo: '0008',
                message: 'La sesión que esta intentando terminar ya no existe, inicie sesión nuevamente'
            });
        }

        tokenDesconexion.estadoToken = 'Desconectado';
        tokenDesconexion.save(function(error) {
            if (error) {
                return res.status(400).json({
                    estado: false,
                    codigo: '0001',
                    err: {
                        mensaje: 'No se actualizo el token de desconexion al cerrar sesión'
                    }
                });
            }
            res.json({
                codigo: '0000',
                message: 'Cerro sesión exitosamente'
            })
        });
    });
});






module.exports = app;