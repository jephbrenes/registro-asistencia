const STORAGE_KEY =
    "registro_asistencia_v1";

const CONFIG_KEY =
    "configuracion_asistencia_v1";


let datos = {
    empleados: []
};


let empleadoSeleccionadoId = null;

let fechaInicioSemana =
    obtenerInicioSemana(new Date());


/* =====================================================
   CONFIGURACIÓN
===================================================== */

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
            JSON.stringify(
                configuracionPredeterminada
            )
        );

        return JSON.parse(
            JSON.stringify(
                configuracionPredeterminada
            )
        );
    }


    try {

        const config =
            JSON.parse(guardada);

        return {

            ...configuracionPredeterminada,

            ...config,

            horarios: {

                ...configuracionPredeterminada.horarios,

                ...(config.horarios || {})

            },

            almuerzo: {

                ...configuracionPredeterminada.almuerzo,

                ...(config.almuerzo || {})

            }

        };

    } catch {

        return JSON.parse(
            JSON.stringify(
                configuracionPredeterminada
            )
        );

    }

}


/* =====================================================
   LOCAL STORAGE
===================================================== */

function cargarDatos() {

    const guardado =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (!guardado) {

        datos = {
            empleados: []
        };

        return;
    }


    try {

        datos =
            JSON.parse(guardado);

    } catch {

        datos = {
            empleados: []
        };

    }

}


function guardarDatos() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(datos)
    );

}


/* =====================================================
   FECHAS
===================================================== */

function obtenerInicioSemana(fecha) {

    const resultado =
        new Date(fecha);

    resultado.setHours(
        0, 0, 0, 0
    );


    const dia =
        resultado.getDay();


    const diferencia =
        dia === 0
            ? -6
            : 1 - dia;


    resultado.setDate(
        resultado.getDate() + diferencia
    );


    return resultado;

}


function crearFecha(
    fechaBase,
    dias
) {

    const fecha =
        new Date(fechaBase);

    fecha.setDate(
        fecha.getDate() + dias
    );

    return fecha;

}


function fechaClave(fecha) {

    const año =
        fecha.getFullYear();

    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            fecha.getDate()
        ).padStart(2, "0");


    return `${año}-${mes}-${dia}`;

}


function formatearFecha(fecha) {

    return fecha.toLocaleDateString(
        "es-CR",
        {
            weekday: "long",
            day: "numeric",
            month: "long"
        }
    );

}


function formatearFechaCorta(fecha) {

    return fecha.toLocaleDateString(
        "es-CR",
        {
            day: "2-digit",
            month: "2-digit"
        }
    );

}


/* =====================================================
   SEMANA
===================================================== */

function obtenerNumeroSemana(fecha) {

    const copia =
        new Date(
            Date.UTC(
                fecha.getFullYear(),
                fecha.getMonth(),
                fecha.getDate()
            )
        );


    const dia =
        copia.getUTCDay() || 7;


    copia.setUTCDate(
        copia.getUTCDate() + 4 - dia
    );


    const inicio =
        new Date(
            Date.UTC(
                copia.getUTCFullYear(),
                0,
                1
            )
        );


    return Math.ceil(
        (
            (
                (
                    copia - inicio
                ) / 86400000
            ) + 1
        ) / 7
    );

}


/* =====================================================
   HORARIOS
===================================================== */

function obtenerDiaSemana(fecha) {

    const dias = [
        "domingo",
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado"
    ];


    return dias[
        fecha.getDay()
    ];

}


function obtenerHorarioBase(fecha) {

    const config =
        obtenerConfiguracion();


    const dia =
        obtenerDiaSemana(fecha);


    return config.horarios[dia] || {

        entrada: "",
        salida: ""

    };

}


function minutosHora(hora) {

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


function calcularDuracion(
    entrada,
    salida
) {

    if (!entrada || !salida) {
        return 0;
    }


    return Math.max(
        0,
        minutosHora(salida) -
        minutosHora(entrada)
    );

}


function obtenerAlmuerzoMinutos() {

    const config =
        obtenerConfiguracion();


    if (
        config.almuerzo.pagado
    ) {
        return 0;
    }


    return minutosHora(
        config.almuerzo.duracion
    );

}


function obtenerJornadaProgramada(
    fecha
) {

    const horario =
        obtenerHorarioBase(fecha);


    if (
        !horario.entrada ||
        !horario.salida
    ) {

        return 0;

    }


    let minutos =
        calcularDuracion(
            horario.entrada,
            horario.salida
        );


    minutos -=
        obtenerAlmuerzoMinutos();


    return Math.max(
        0,
        minutos
    );

}


/* =====================================================
   REGISTRO AUTOMÁTICO
===================================================== */

/*
    ESTA FUNCIÓN ES LA PRINCIPAL DEL CAMBIO.

    Si un empleado no tiene registro para un día
    laborable, automáticamente se crea como trabajado
    utilizando el horario configurado.

    Ejemplo:

    Lunes:
    07:30 - 17:30

    Se guarda automáticamente como:

    {
        entrada: "07:30",
        salida: "17:30",
        estado: "Completo",
        observacion: ""
    }

    No hace falta abrir el día.
*/

function asegurarRegistroAutomatico(
    empleado,
    fecha
) {

    if (!empleado) {
        return false;
    }


    if (!empleado.registros) {

        empleado.registros = {};

    }


    const clave =
        fechaClave(fecha);


    /*
        Si ya existe un registro, no lo tocamos.

        Esto es importante porque si el usuario
        modifica la entrada o salida, su modificación
        se conserva.
    */

    if (
        empleado.registros[clave]
    ) {

        return false;

    }


    const horario =
        obtenerHorarioBase(fecha);


    /*
        Si el día no tiene horario, no se crea
        como trabajado.

        Por ejemplo, domingo.
    */

    if (
        !horario.entrada ||
        !horario.salida
    ) {

        return false;

    }


    empleado.registros[clave] = {

        entrada:
            horario.entrada,

        salida:
            horario.salida,

        estado:
            "Completo",

        observacion:
            ""

    };


    return true;

}


/*
    Crea automáticamente los registros de toda
    la semana que se está mostrando.
*/

function asegurarSemanaAutomatica(
    empleado
) {

    if (!empleado) {
        return;
    }


    let huboCambios = false;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const fecha =
            crearFecha(
                fechaInicioSemana,
                i
            );


        const creado =
            asegurarRegistroAutomatico(
                empleado,
                fecha
            );


        if (creado) {

            huboCambios = true;

        }

    }


    if (huboCambios) {

        guardarDatos();

    }

}


/* =====================================================
   INFORMACIÓN DEL DÍA
===================================================== */

function obtenerInformacionDia(
    empleado,
    fecha
) {

    /*
        Antes de calcular el día, aseguramos que
        exista automáticamente si es laborable.
    */

    asegurarRegistroAutomatico(
        empleado,
        fecha
    );


    const clave =
        fechaClave(fecha);


    const horario =
        obtenerHorarioBase(fecha);


    const registro =
        empleado.registros?.[clave];


    const jornada =
        obtenerJornadaProgramada(
            fecha
        );


    if (!horario.entrada ||
        !horario.salida) {

        return {

            programado: 0,

            trabajado: 0,

            balance: 0,

            registro:
                registro || null,

            horario

        };

    }


    if (
        registro &&
        registro.estado === "Ausente"
    ) {

        return {

            programado:
                jornada,

            trabajado:
                0,

            balance:
                -jornada,

            registro,

            horario

        };

    }


    if (
        registro &&
        registro.estado === "Justificado" &&
        !registro.entrada &&
        !registro.salida
    ) {

        return {

            programado:
                jornada,

            trabajado:
                jornada,

            balance:
                0,

            registro,

            horario

        };

    }


    if (
        registro &&
        registro.entrada &&
        registro.salida
    ) {

        let trabajado =
            calcularDuracion(
                registro.entrada,
                registro.salida
            );


        trabajado -=
            obtenerAlmuerzoMinutos();


        trabajado =
            Math.max(
                0,
                trabajado
            );


        return {

            programado:
                jornada,

            trabajado,

            balance:
                trabajado - jornada,

            registro,

            horario

        };

    }


    return {

        programado:
            jornada,

        trabajado:
            0,

        balance:
            0,

        registro:
            registro || null,

        horario

    };

}


/* =====================================================
   FORMATO DE TIEMPO
===================================================== */

function formatearDuracion(
    minutos
) {

    minutos =
        Math.round(minutos);


    const signo =
        minutos < 0
            ? "-"
            : "";


    minutos =
        Math.abs(minutos);


    const horas =
        Math.floor(
            minutos / 60
        );


    const mins =
        minutos % 60;


    if (horas === 0) {

        return `${signo}${mins} min`;

    }


    if (mins === 0) {

        return `${signo}${horas} h`;

    }


    return `${signo}${horas} h ${mins} min`;

}


function formatearBalance(
    minutos
) {

    if (minutos > 0) {

        return `+${formatearDuracion(
            minutos
        )}`;

    }


    if (minutos < 0) {

        return formatearDuracion(
            minutos
        );

    }


    return "0 minutos";

}


function formatearBalanceExcel(
    minutos
) {

    if (minutos > 0) {

        const abs =
            Math.abs(minutos);

        const horas =
            Math.floor(
                abs / 60
            );

        const mins =
            abs % 60;


        if (horas && mins) {

            return `+${horas}h ${mins}m`;

        }


        if (horas) {

            return `+${horas} horas`;

        }


        return `+${mins} minutos`;

    }


    if (minutos < 0) {

        const abs =
            Math.abs(minutos);

        const horas =
            Math.floor(
                abs / 60
            );

        const mins =
            abs % 60;


        if (horas && mins) {

            return `-${horas}h ${mins}m`;

        }


        if (horas) {

            return `-${horas} horas`;

        }


        return `-${mins} minutos`;

    }


    return "";

}


/* =====================================================
   EMPLEADOS
===================================================== */

function generarId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );

}


function agregarEmpleado(
    nombre,
    identificacion
) {

    const empleado = {

        id: generarId(),

        nombre:
            nombre.trim(),

        identificacion:
            identificacion.trim(),

        registros: {}

    };


    datos.empleados.push(
        empleado
    );


    /*
        Al crear el empleado también se crean
        automáticamente los días laborables
        de la semana actual.
    */

    asegurarSemanaAutomatica(
        empleado
    );


    guardarDatos();


    empleadoSeleccionadoId =
        empleado.id;


    renderizarTodo();


    mostrarToast(
        "Empleado agregado correctamente"
    );

}


function editarEmpleado(
    empleado
) {

    document.getElementById(
        "tituloModalEmpleado"
    ).textContent =
        "Editar empleado";


    document.getElementById(
        "empleadoId"
    ).value =
        empleado.id;


    document.getElementById(
        "nombreEmpleado"
    ).value =
        empleado.nombre;


    document.getElementById(
        "identificacionEmpleadoInput"
    ).value =
        empleado.identificacion;


    abrirModal(
        "modalEmpleado"
    );

}


function eliminarEmpleado(
    id
) {

    const empleado =
        datos.empleados.find(
            e => e.id === id
        );


    if (!empleado) {
        return;
    }


    const confirmar =
        confirm(
            `¿Desea eliminar a ${empleado.nombre}?`
        );


    if (!confirmar) {
        return;
    }


    datos.empleados =
        datos.empleados.filter(
            e => e.id !== id
        );


    if (
        empleadoSeleccionadoId === id
    ) {

        empleadoSeleccionadoId =
            datos.empleados.length
                ? datos.empleados[0].id
                : null;

    }


    guardarDatos();

    renderizarTodo();


    mostrarToast(
        "Empleado eliminado"
    );

}


/* =====================================================
   RENDER EMPLEADOS
===================================================== */

function renderizarEmpleados() {

    const contenedor =
        document.getElementById(
            "listaEmpleados"
        );


    const busqueda =
        document.getElementById(
            "buscarEmpleado"
        ).value
            .toLowerCase()
            .trim();


    const empleados =
        datos.empleados.filter(
            empleado =>

                empleado.nombre
                    .toLowerCase()
                    .includes(busqueda)

                ||

                empleado.identificacion
                    .toLowerCase()
                    .includes(busqueda)
        );


    document.getElementById(
        "contadorEmpleados"
    ).textContent =

        `${datos.empleados.length} ${
            datos.empleados.length === 1
                ? "empleado"
                : "empleados"
        }`;


    contenedor.innerHTML = "";


    if (!empleados.length) {

        contenedor.innerHTML = `

            <div class="no-employees">

                <div>
                    👤
                </div>

                <p>
                    ${
                        datos.empleados.length
                            ? "No se encontraron empleados."
                            : "No hay empleados registrados."
                    }
                </p>

            </div>

        `;

        return;

    }


    empleados.forEach(
        empleado => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "employee-item";


            if (
                empleado.id ===
                empleadoSeleccionadoId
            ) {

                item.classList.add(
                    "active"
                );

            }


            const inicial =
                empleado.nombre
                    .charAt(0)
                    .toUpperCase();


            item.innerHTML = `

                <div class="employee-avatar">
                    ${inicial}
                </div>

                <div class="employee-info">

                    <strong>
                        ${escapeHtml(
                            empleado.nombre
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            empleado.identificacion
                        )}
                    </span>

                </div>

                <div class="employee-actions">

                    <button
                        class="icon-btn edit-employee"
                        title="Editar">
                        ✏️
                    </button>

                    <button
                        class="icon-btn delete-employee"
                        title="Eliminar">
                        🗑️
                    </button>

                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    empleadoSeleccionadoId =
                        empleado.id;

                    renderizarTodo();

                }
            );


            item.querySelector(
                ".edit-employee"
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    editarEmpleado(
                        empleado
                    );

                }
            );


            item.querySelector(
                ".delete-employee"
            ).addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    eliminarEmpleado(
                        empleado.id
                    );

                }
            );


            contenedor.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   RENDER SEMANA
===================================================== */

function renderizarSemana() {

    const grid =
        document.getElementById(
            "weekGrid"
        );


    grid.innerHTML = "";


    const empleado =
        datos.empleados.find(
            e =>
                e.id ===
                empleadoSeleccionadoId
        );


    if (!empleado) {

        document.getElementById(
            "emptyState"
        ).style.display = "flex";


        document.getElementById(
            "nombreEmpleadoSeleccionado"
        ).textContent =
            "Seleccione un empleado";


        document.getElementById(
            "identificacionEmpleado"
        ).textContent =
            "Seleccione un empleado para ver su asistencia";


        actualizarResumen(null);

        return;

    }


    /*
        AQUÍ SE CREA AUTOMÁTICAMENTE LA ASISTENCIA
        DE TODA LA SEMANA.

        Por eso ya no hace falta abrir cada día.
    */

    asegurarSemanaAutomatica(
        empleado
    );


    document.getElementById(
        "emptyState"
    ).style.display = "none";


    document.getElementById(
        "nombreEmpleadoSeleccionado"
    ).textContent =
        empleado.nombre;


    document.getElementById(
        "identificacionEmpleado"
    ).textContent =
        `Identificación: ${empleado.identificacion}`;


    const numeroSemana =
        obtenerNumeroSemana(
            fechaInicioSemana
        );


    document.getElementById(
        "numeroSemana"
    ).textContent =
        `Semana ${numeroSemana}`;


    const domingo =
        crearFecha(
            fechaInicioSemana,
            6
        );


    document.getElementById(
        "rangoSemana"
    ).textContent =
        `${formatearFechaCorta(
            fechaInicioSemana
        )} - ${formatearFechaCorta(
            domingo
        )}`;


    let totalProgramado = 0;
    let totalTrabajado = 0;
    let totalBalance = 0;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const fecha =
            crearFecha(
                fechaInicioSemana,
                i
            );


        const info =
            obtenerInformacionDia(
                empleado,
                fecha
            );


        totalProgramado +=
            info.programado;


        totalTrabajado +=
            info.trabajado;


        totalBalance +=
            info.balance;


        const card =
            crearTarjetaDia(
                fecha,
                info
            );


        grid.appendChild(
            card
        );

    }


    actualizarResumen({

        programado:
            totalProgramado,

        trabajado:
            totalTrabajado,

        balance:
            totalBalance

    });

}


function crearTarjetaDia(
    fecha,
    info
) {

    const card =
        document.createElement(
            "div"
        );


    const diaNumero =
        fecha.getDay();


    const nombres = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];


    card.className =
        "day-card";


    if (diaNumero === 0) {

        card.classList.add(
            "sunday"
        );

    }


    const hoy =
        fechaClave(fecha) ===
        fechaClave(new Date());


    if (hoy) {

        card.classList.add(
            "today"
        );

    }


    const balanceClass =
        info.balance > 0
            ? "positive"
            : info.balance < 0
                ? "negative"
                : "neutral";


    let estadoTexto =
        "Sin registro";


    if (
        info.registro
    ) {

        estadoTexto =
            info.registro.estado ||
            "Registrado";

    }


    const entrada =
        info.registro?.entrada ||
        info.horario.entrada ||
        "--:--";


    const salida =
        info.registro?.salida ||
        info.horario.salida ||
        "--:--";


    card.innerHTML = `

        <div class="day-header">

            <div>

                <strong>
                    ${nombres[diaNumero]}
                </strong>

                <span>
                    ${fecha.getDate()}
                </span>

            </div>

            ${
                hoy
                    ? `<span class="today-badge">HOY</span>`
                    : ""
            }

        </div>


        <div class="day-schedule">

            <span>
                ${entrada}
            </span>

            <span>→</span>

            <span>
                ${salida}
            </span>

        </div>


        <div class="day-status">

            <span class="status-dot"></span>

            ${estadoTexto}

        </div>


        <div class="day-balance ${balanceClass}">

            ${
                info.programado === 0
                    ? "No laborable"
                    : formatearBalance(
                        info.balance
                    )
            }

        </div>


        <button class="day-edit">

            ✏️ Editar

        </button>

    `;


    card.querySelector(
        ".day-edit"
    ).addEventListener(
        "click",
        event => {

            event.stopPropagation();

            abrirModalAsistencia(
                fecha
            );

        }
    );


    card.addEventListener(
        "click",
        () => {

            abrirModalAsistencia(
                fecha
            );

        }
    );


    return card;

}


/* =====================================================
   RESUMEN
===================================================== */

function actualizarResumen(resumen) {

    const horasProgramadas =
        document.getElementById(
            "horasProgramadas"
        );

    const balanceSemanal =
        document.getElementById(
            "balanceSemanal"
        );


    /*
        Si no hay empleado seleccionado
    */

    if (!resumen) {

        if (horasProgramadas) {

            horasProgramadas.textContent =
                "0h 0m";

        }


        if (balanceSemanal) {

            balanceSemanal.textContent =
                "0 minutos";

            balanceSemanal.classList.remove(
                "positive",
                "negative",
                "neutral"
            );

            balanceSemanal.classList.add(
                "neutral"
            );

        }

        return;

    }


    /*
        HORAS PROGRAMADAS

        Seguimos mostrando las horas programadas,
        pero YA NO mostramos "Tiempo trabajado".
    */

    if (horasProgramadas) {

        horasProgramadas.textContent =
            formatearDuracion(
                resumen.programado
            );

    }


    /*
        BALANCE SEMANAL

        El cálculo sigue utilizando:

        trabajado - programado

        pero no necesita mostrar
        "Tiempo trabajado".
    */

    if (balanceSemanal) {

        balanceSemanal.textContent =
            formatearBalance(
                resumen.balance
            );


        balanceSemanal.classList.remove(
            "positive",
            "negative",
            "neutral"
        );


        if (
            resumen.balance > 0
        ) {

            balanceSemanal.classList.add(
                "positive"
            );

        }

        else if (
            resumen.balance < 0
        ) {

            balanceSemanal.classList.add(
                "negative"
            );

        }

        else {

            balanceSemanal.classList.add(
                "neutral"
            );

        }

    }

}


/* =====================================================
   MODAL EMPLEADO
===================================================== */

function abrirModal(id) {

    document.getElementById(
        id
    ).classList.add(
        "show"
    );

}


function cerrarModal(id) {

    document.getElementById(
        id
    ).classList.remove(
        "show"
    );

}


function abrirNuevoEmpleado() {

    document.getElementById(
        "tituloModalEmpleado"
    ).textContent =
        "Nuevo empleado";


    document.getElementById(
        "formEmpleado"
    ).reset();


    document.getElementById(
        "empleadoId"
    ).value = "";


    abrirModal(
        "modalEmpleado"
    );

}


/* =====================================================
   GUARDAR EMPLEADO
===================================================== */

function procesarEmpleado(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "empleadoId"
        ).value;


    const nombre =
        document.getElementById(
            "nombreEmpleado"
        ).value.trim();


    const identificacion =
        document.getElementById(
            "identificacionEmpleadoInput"
        ).value.trim();


    if (!nombre || !identificacion) {

        mostrarToast(
            "Complete todos los campos"
        );

        return;

    }


    if (id) {

        const empleado =
            datos.empleados.find(
                e => e.id === id
            );


        if (empleado) {

            empleado.nombre =
                nombre;

            empleado.identificacion =
                identificacion;

        }


        mostrarToast(
            "Empleado actualizado"
        );

    } else {

        agregarEmpleado(
            nombre,
            identificacion
        );

        cerrarModal(
            "modalEmpleado"
        );

        document.getElementById(
            "formEmpleado"
        ).reset();

        return;

    }


    guardarDatos();

    cerrarModal(
        "modalEmpleado"
    );

    renderizarTodo();

}


/* =====================================================
   MODAL ASISTENCIA
===================================================== */

let fechaAsistenciaActual = null;


function abrirModalAsistencia(
    fecha
) {

    const empleado =
        datos.empleados.find(
            e =>
                e.id ===
                empleadoSeleccionadoId
        );


    if (!empleado) {
        return;
    }


    /*
        Aseguramos que el día tenga su registro
        automático antes de mostrar el modal.
    */

    asegurarRegistroAutomatico(
        empleado,
        fecha
    );


    fechaAsistenciaActual =
        fecha;


    const clave =
        fechaClave(fecha);


    const registro =
        empleado.registros?.[clave];


    const horario =
        obtenerHorarioBase(fecha);


    document.getElementById(
        "asistenciaFecha"
    ).value =
        clave;


    document.getElementById(
        "tituloModalAsistencia"
    ).textContent =
        `Asistencia - ${
            fecha.toLocaleDateString(
                "es-CR",
                {
                    weekday: "long"
                }
            )
        }`;


    document.getElementById(
        "fechaModalAsistencia"
    ).textContent =
        fecha.toLocaleDateString(
            "es-CR",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    document.getElementById(
        "horaEntrada"
    ).value =
        registro?.entrada ||
        horario.entrada ||
        "";


    document.getElementById(
        "horaSalida"
    ).value =
        registro?.salida ||
        horario.salida ||
        "";


    document.getElementById(
        "estadoAsistencia"
    ).value =
        registro?.estado ||
        "Completo";


    document.getElementById(
        "observacionAsistencia"
    ).value =
        registro?.observacion ||
        "";


    abrirModal(
        "modalAsistencia"
    );

}


/* =====================================================
   GUARDADO AUTOMÁTICO DEL TIEMPO
===================================================== */

/*
    Esta función guarda solamente las modificaciones
    de tiempo.

    Ya no es necesario pulsar "Guardar asistencia".
*/

function guardarCambiosTiempoAutomaticamente() {

    const empleado =
        datos.empleados.find(
            e =>
                e.id ===
                empleadoSeleccionadoId
        );


    if (!empleado) {
        return;
    }


    const fecha =
        document.getElementById(
            "asistenciaFecha"
        ).value;


    if (!fecha) {
        return;
    }


    const entrada =
        document.getElementById(
            "horaEntrada"
        ).value;


    const salida =
        document.getElementById(
            "horaSalida"
        ).value;


    if (!empleado.registros) {

        empleado.registros = {};

    }


    /*
        Conservamos información existente.
    */

    const registroAnterior =
        empleado.registros[fecha] || {};


    empleado.registros[fecha] = {

        ...registroAnterior,

        entrada,

        salida,

        estado:
            registroAnterior.estado ||
            "Completo",

        observacion:
            registroAnterior.observacion ||
            ""

    };


    guardarDatos();


    /*
        Actualizamos las tarjetas y los totales
        inmediatamente.
    */

    renderizarSemana();

}


/* =====================================================
   GUARDAR ASISTENCIA
===================================================== */

/*
    Se conserva esta función para que el HTML existente
    siga funcionando.

    Sin embargo, ahora guardar asistencia solamente
    ejecuta el mismo guardado automático de tiempo.
*/

function guardarAsistencia(
    event
) {

    event.preventDefault();


    guardarCambiosTiempoAutomaticamente();


    cerrarModal(
        "modalAsistencia"
    );


    mostrarToast(
        "Tiempo actualizado automáticamente"
    );

}


/* =====================================================
   RESTAURAR HORARIO
===================================================== */

function restaurarHorario() {

    const empleado =
        datos.empleados.find(
            e =>
                e.id ===
                empleadoSeleccionadoId
        );


    if (!empleado) {
        return;
    }


    const fecha =
        document.getElementById(
            "asistenciaFecha"
        ).value;


    const fechaObjeto =
        new Date(
            `${fecha}T00:00:00`
        );


    const horario =
        obtenerHorarioBase(
            fechaObjeto
        );


    document.getElementById(
        "horaEntrada"
    ).value =
        horario.entrada;


    document.getElementById(
        "horaSalida"
    ).value =
        horario.salida;


    /*
        Guardamos inmediatamente.
    */

    guardarCambiosTiempoAutomaticamente();


    document.getElementById(
        "estadoAsistencia"
    ).value =
        "Completo";


    document.getElementById(
        "observacionAsistencia"
    ).value = "";


    mostrarToast(
        "Horario restaurado"
    );

}


/* =====================================================
   EXCEL
===================================================== */

function descargarExcel() {

    if (
        typeof XLSX ===
        "undefined"
    ) {

        mostrarToast(
            "No se pudo cargar el generador de Excel"
        );

        return;

    }


    if (
        !datos.empleados.length
    ) {

        mostrarToast(
            "No hay empleados registrados"
        );

        return;

    }


    const filas = [];


    datos.empleados.forEach(
        empleado => {

            /*
                Antes de exportar también aseguramos
                que la semana tenga sus registros.
            */

            asegurarSemanaAutomatica(
                empleado
            );


            const fila = {

                Empleado:
                    empleado.nombre,

                Lunes: "",

                Martes: "",

                Miércoles: "",

                Jueves: "",

                Viernes: "",

                Sábado: "",

                Total: ""

            };


            let total =
                0;


            for (
                let i = 0;
                i < 6;
                i++
            ) {

                const fecha =
                    crearFecha(
                        fechaInicioSemana,
                        i
                    );


                const info =
                    obtenerInformacionDia(
                        empleado,
                        fecha
                    );


                const balance =
                    info.balance;


                total +=
                    balance;


                const columnas = [

                    "Lunes",

                    "Martes",

                    "Miércoles",

                    "Jueves",

                    "Viernes",

                    "Sábado"

                ];


                fila[
                    columnas[i]
                ] =
                    formatearBalanceExcel(
                        balance
                    );

            }


            fila.Total =
                formatearBalanceExcel(
                    total
                );


            if (!fila.Total) {

                fila.Total =
                    "0 minutos";

            }


            filas.push(
                fila
            );

        }
    );


    const hoja =
        XLSX.utils.json_to_sheet(
            filas
        );


    hoja["!cols"] = [

        { wch: 25 },

        { wch: 15 },

        { wch: 15 },

        { wch: 15 },

        { wch: 15 },

        { wch: 15 },

        { wch: 15 },

        { wch: 15 }

    ];


    const libro =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Asistencia"
    );


    const numeroSemana =
        obtenerNumeroSemana(
            fechaInicioSemana
        );


    XLSX.writeFile(
        libro,
        `Asistencia_Semana_${numeroSemana}.xlsx`
    );


    mostrarToast(
        "Excel descargado correctamente"
    );

}


/* =====================================================
   MODO OSCURO
===================================================== */

function aplicarModoOscuro() {

    const activo =
        localStorage.getItem(
            "modo_oscuro"
        ) === "true";


    if (activo) {

        document.body.classList.add(
            "dark-mode"
        );

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

    }

}


/* =====================================================
   NAVEGACIÓN
===================================================== */

function cambiarSemana(
    cantidad
) {

    fechaInicioSemana =
        crearFecha(
            fechaInicioSemana,
            cantidad * 7
        );


    renderizarSemana();

}


function irSemanaActual() {

    fechaInicioSemana =
        obtenerInicioSemana(
            new Date()
        );


    renderizarSemana();

}


/* =====================================================
   TOAST
===================================================== */

function mostrarToast(
    mensaje
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        mensaje;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    texto
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        texto;


    return div.innerHTML;

}


/* =====================================================
   RENDER GENERAL
===================================================== */

function renderizarTodo() {

    renderizarEmpleados();

    renderizarSemana();

}


/* =====================================================
   EVENTOS
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarDatos();

        aplicarModoOscuro();


        if (
            datos.empleados.length &&
            !empleadoSeleccionadoId
        ) {

            empleadoSeleccionadoId =
                datos.empleados[0].id;

        }


        /*
            Al iniciar la aplicación se crean
            automáticamente los registros de la
            semana actual.
        */

        if (empleadoSeleccionadoId) {

            const empleado =
                datos.empleados.find(
                    e =>
                        e.id ===
                        empleadoSeleccionadoId
                );


            if (empleado) {

                asegurarSemanaAutomatica(
                    empleado
                );

            }

        }


        renderizarTodo();


        document.getElementById(
            "btnNuevoEmpleado"
        ).addEventListener(
            "click",
            abrirNuevoEmpleado
        );


        document.getElementById(
            "cerrarModalEmpleado"
        ).addEventListener(
            "click",
            () => cerrarModal(
                "modalEmpleado"
            )
        );


        document.getElementById(
            "cancelarEmpleado"
        ).addEventListener(
            "click",
            () => cerrarModal(
                "modalEmpleado"
            )
        );


        document.getElementById(
            "formEmpleado"
        ).addEventListener(
            "submit",
            procesarEmpleado
        );


        document.getElementById(
            "cerrarModalAsistencia"
        ).addEventListener(
            "click",
            () => cerrarModal(
                "modalAsistencia"
            )
        );


        document.getElementById(
            "cancelarAsistencia"
        ).addEventListener(
            "click",
            () => cerrarModal(
                "modalAsistencia"
            )
        );


        document.getElementById(
            "formAsistencia"
        ).addEventListener(
            "submit",
            guardarAsistencia
        );


        document.getElementById(
            "btnRestaurarHorario"
        ).addEventListener(
            "click",
            restaurarHorario
        );


        /*
            =================================================
            GUARDADO AUTOMÁTICO DE ENTRADA Y SALIDA
            =================================================

            En cuanto se modifica la hora de entrada
            o salida, se guarda automáticamente.

            No hace falta pulsar Guardar.
        */

        const horaEntrada =
            document.getElementById(
                "horaEntrada"
            );


        const horaSalida =
            document.getElementById(
                "horaSalida"
            );


        if (horaEntrada) {

            horaEntrada.addEventListener(
                "change",
                guardarCambiosTiempoAutomaticamente
            );

        }


        if (horaSalida) {

            horaSalida.addEventListener(
                "change",
                guardarCambiosTiempoAutomaticamente
            );

        }


        document.getElementById(
            "buscarEmpleado"
        ).addEventListener(
            "input",
            renderizarEmpleados
        );


        document.getElementById(
            "btnSemanaAnterior"
        ).addEventListener(
            "click",
            () => cambiarSemana(-1)
        );


        document.getElementById(
            "btnSemanaSiguiente"
        ).addEventListener(
            "click",
            () => cambiarSemana(1)
        );


        document.getElementById(
            "btnSemanaActual"
        ).addEventListener(
            "click",
            irSemanaActual
        );


        document.getElementById(
            "btnDescargarExcel"
        ).addEventListener(
            "click",
            descargarExcel
        );


        window.addEventListener(
            "storage",
            () => {

                cargarDatos();

                aplicarModoOscuro();

                renderizarTodo();

            }
        );


        document.addEventListener(
            "click",
            event => {

                if (
                    event.target.classList.contains(
                        "modal-overlay"
                    )
                ) {

                    event.target.classList.remove(
                        "show"
                    );

                }

            }
        );

    }
);