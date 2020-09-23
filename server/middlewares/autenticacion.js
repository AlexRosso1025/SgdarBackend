const jwt = require('jsonwebtoken');

const TokenDesconexion = require('../models/desconexion');

// ===================================
// Verificar Token
// ===================================
let verificarToken = (req, res, next) => {
    // obtenemos el header en este caso token
    let token = req.get('token');

    jwt.verify(token, process.env.SEED, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                ok: false,
                err: {
                    message: 'Token no válido'
                }
            });
        }
        req.usuario = decoded.usuario;
        next();
    });

};

// ===================================
// Verificar Token de conexión
// ===================================
let verificarTokenDesconexion = (req, res, next) => {
    // obtenemos el header en este caso token
    let token = req.get('token');
    let usuario = req.usuario;

    TokenDesconexion.findOne({ _userId: usuario._id }, function(error, tokenDesconexion) {
        if (error) {
            return res.status(400).json({
                ok: false,
                error
            });
        }

        if (tokenDesconexion.estadoToken == token) {
            next();

        } else {
            return res.json({
                ok: false,
                err: {
                    message: 'Debe de iniciar sesión para continuar'
                }
            });
        }
    });
};


// ===================================
// Verificar AdminRole
// ===================================
let verificaAdmin_Role = (req, res, next) => {

    let usuario = req.usuario;

    if (usuario.role === 'ADMIN_ROLE') {
        next();
    } else {
        return res.json({
            ok: false,
            err: {
                message: 'El usuario no es administrador'
            }
        });
    }
};





module.exports = {
    verificarToken,
    verificaAdmin_Role,
    verificarTokenDesconexion
}