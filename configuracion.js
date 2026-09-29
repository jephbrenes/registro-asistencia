const CONFIG_KEY = "configuracion_asistencia_v1";


const configuracionPredeterminada = {

    horarios: {

        lunes: {
            entrada: "07:30",
            salida: "17:30"
        },

        martes: {
            entrada: "07:30",
            salida: "17:30"
        },

        miercoles: {
            entrada: "07:30",
            salida: "17:30"
        },

        jueves: {
            entrada: "07:30",
            salida: "17:30"
        },

        viernes: {
            entrada: "07:30",
            salida: "17:30"
        },

        sabado: {
            entrada: "07:30",
            salida: "12:00"
        },

        domingo: {
            entrada: "",
            salida: "",
            laborable: false
        }

    },

    almuerzo: {
        duracion: "01:00",
        pagado: false
    },

    modoOscuro: false

};


function obtenerConfiguracion() {

    const guardada =
        localStorage.getItem(CONFIG_KEY);

    if (!guardada) {

        localStorage.setItem(
            CONFIG_KEY,
            JSON.stringify(configuracionPredeterminada)
        );

        return structuredClone(
            configuracionPredeterminada
        );
    }

    try {

        const configuracion =
            JSON.parse(guardada);

        return combinarConfiguracion(
            configuracionPredeterminada,
            configuracion
        );

    } catch (error) {

        console.error(
            "Error leyendo configuración:",
            error
        );

        return structuredClone(
            configuracionPredeterminada
        );
    }
}


function combinarConfiguracion(base, guardada) {

    return {

        horarios: {

            lunes: {
                ...base.horarios.lunes,
                ...(guardada.horarios?.lunes || {})
            },

            martes: {
                ...base.horarios.martes,
                ...(guardada.horarios?.martes || {})
            },

            miercoles: {
                ...base.horarios.miercoles,
                ...(guardada.horarios?.miercoles || {})
            },

            jueves: {
                ...base.horarios.jueves,
                ...(guardada.horarios?.jueves || {})
            },

            viernes: {
                ...base.horarios.viernes,
                ...(guardada.horarios?.viernes || {})
            },

            sabado: {
                ...base.horarios.sabado,
                ...(guardada.horarios?.sabado || {})
            },

            domingo: {
                ...base.horarios.domingo,
                ...(guardada.horarios?.domingo || {})
            }

        },

        almuerzo: {
            ...base.almuerzo,
            ...(guardada.almuerzo || {})
        },

        modoOscuro:
            guardada.modoOscuro ??
            base.modoOscuro

    };
}


function guardarConfiguracion(configuracion) {

    localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify(configuracion)
    );
}


function cargarConfiguracionPagina() {

    const config =
        obtenerConfiguracion();


    /* HORARIOS */

    document.querySelectorAll(
        ".horario-entrada"
    ).forEach(input => {

        const dia =
            input.dataset.dia;

        input.value =
            config.horarios[dia].entrada;

    });


    document.querySelectorAll(
        ".horario-salida"
    ).forEach(input => {

        const dia =
            input.dataset.dia;

        input.value =
            config.horarios[dia].salida;

    });


    document.getElementById(
        "domingoLaborable"
    ).checked =
        config.horarios.domingo.laborable;


    /* ALMUERZO */

    document.getElementById(
        "duracionAlmuerzo"
    ).value =
        config.almuerzo.duracion;


    document.getElementById(
        "almuerzoPagado"
    ).checked =
        config.almuerzo.pagado;


    /* MODO OSCURO */

    document.getElementById(
        "modoOscuro"
    ).checked =
        config.modoOscuro;


    aplicarModoOscuro(
        config.modoOscuro
    );

    actualizarEjemploAlmuerzo();
}


function guardarHorarios() {

    const config =
        obtenerConfiguracion();


    document.querySelectorAll(
        ".horario-entrada"
    ).forEach(input => {

        const dia =
            input.dataset.dia;

        config.horarios[dia].entrada =
            input.value;

    });


    document.querySelectorAll(
        ".horario-salida"
    ).forEach(input => {

        const dia =
            input.dataset.dia;

        config.horarios[dia].salida =
            input.value;

    });


    config.horarios.domingo.laborable =
        document.getElementById(
            "domingoLaborable"
        ).checked;


    config.almuerzo.duracion =
        document.getElementById(
            "duracionAlmuerzo"
        ).value || "00:00";


    config.almuerzo.pagado =
        document.getElementById(
            "almuerzoPagado"
        ).checked;


    guardarConfiguracion(config);


    mostrarToast(
        "Configuración guardada correctamente"
    );


    actualizarEjemploAlmuerzo();
}


function aplicarModoOscuro(activo) {

    if (activo) {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

    }

    localStorage.setItem(
        "modo_oscuro",
        activo ? "true" : "false"
    );
}


function actualizarEjemploAlmuerzo() {

    const entrada =
        document.querySelector(
            '[data-dia="lunes"].horario-entrada'
        ).value;

    const salida =
        document.querySelector(
            '[data-dia="lunes"].horario-salida'
        ).value;

    const almuerzo =
        document.getElementById(
            "duracionAlmuerzo"
        ).value || "00:00";

    const pagado =
        document.getElementById(
            "almuerzoPagado"
        ).checked;


    if (!entrada || !salida) {
        return;
    }


    const inicio =
        convertirHoraMinutos(entrada);

    const fin =
        convertirHoraMinutos(salida);

    const duracion =
        fin - inicio;

    const minutosAlmuerzo =
        convertirHoraMinutos(almuerzo);


    let jornada =
        duracion;


    if (!pagado) {

        jornada -= minutosAlmuerzo;

    }


    const horas =
        Math.floor(jornada / 60);

    const minutos =
        jornada % 60;


    const texto =
        `Si trabaja de ${entrada} a ${salida} y el almuerzo ${
            pagado ? "es pagado" : "no es pagado"
        }, la jornada laboral será de ${horas} horas${
            minutos > 0
                ? ` y ${minutos} minutos`
                : ""
        }.`;

    document.getElementById(
        "ejemploAlmuerzo"
    ).textContent = texto;
}


function convertirHoraMinutos(hora) {

    if (!hora) {
        return 0;
    }

    const partes =
        hora.split(":");

    return (
        Number(partes[0]) * 60 +
        Number(partes[1])
    );
}


function mostrarToast(mensaje) {

    const toast =
        document.getElementById("toast");

    toast.textContent =
        mensaje;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


/* EVENTOS */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarConfiguracionPagina();


        document.getElementById(
            "guardarHorarios"
        ).addEventListener(
            "click",
            guardarHorarios
        );


        document.getElementById(
            "modoOscuro"
        ).addEventListener(
            "change",
            function () {

                const config =
                    obtenerConfiguracion();

                config.modoOscuro =
                    this.checked;

                guardarConfiguracion(
                    config
                );

                aplicarModoOscuro(
                    this.checked
                );

            }
        );


        document.getElementById(
            "duracionAlmuerzo"
        ).addEventListener(
            "input",
            actualizarEjemploAlmuerzo
        );


        document.getElementById(
            "almuerzoPagado"
        ).addEventListener(
            "change",
            actualizarEjemploAlmuerzo
        );


        document.querySelectorAll(
            ".horario-entrada, .horario-salida"
        ).forEach(input => {

            input.addEventListener(
                "input",
                actualizarEjemploAlmuerzo
            );

        });

    }
);