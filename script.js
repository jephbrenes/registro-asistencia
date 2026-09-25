const STORAGE_KEY = "registro_asistencia_v1";


// ========================================
// DATOS
// ========================================

let datos = cargarDatos();

let empleadoSeleccionadoId = null;

let empleadoEditandoId = null;

let semanaActual =
    obtenerInicioSemana(new Date());

let fechaSeleccionada = null;


// ========================================
// ELEMENTOS
// ========================================

const listaEmpleados =
    document.getElementById("listaEmpleados");

const cantidadEmpleados =
    document.getElementById("cantidadEmpleados");

const buscarEmpleado =
    document.getElementById("buscarEmpleado");

const btnAgregarEmpleado =
    document.getElementById("btnAgregarEmpleado");

const sinEmpleadoSeleccionado =
    document.getElementById(
        "sinEmpleadoSeleccionado"
    );

const contenidoEmpleado =
    document.getElementById(
        "contenidoEmpleado"
    );

const nombreEmpleadoSeleccionado =
    document.getElementById(
        "nombreEmpleadoSeleccionado"
    );

const numeroSemana =
    document.getElementById(
        "numeroSemana"
    );

const balanceSemanal =
    document.getElementById(
        "balanceSemanal"
    );

const rangoSemana =
    document.getElementById(
        "rangoSemana"
    );

const diasSemana =
    document.getElementById(
        "diasSemana"
    );

const btnSemanaAnterior =
    document.getElementById(
        "btnSemanaAnterior"
    );

const btnSemanaActual =
    document.getElementById(
        "btnSemanaActual"
    );

const btnSemanaSiguiente =
    document.getElementById(
        "btnSemanaSiguiente"
    );


// ========================================
// EDITOR ASISTENCIA
// ========================================

const editorAsistencia =
    document.getElementById(
        "editorAsistencia"
    );

const fechaEditor =
    document.getElementById(
        "fechaEditor"
    );

const entrada =
    document.getElementById(
        "entrada"
    );

const salida =
    document.getElementById(
        "salida"
    );

const estado =
    document.getElementById(
        "estado"
    );

const observacion =
    document.getElementById(
        "observacion"
    );

const btnGuardar =
    document.getElementById(
        "btnGuardar"
    );

const btnRestaurar =
    document.getElementById(
        "btnRestaurar"
    );

const btnCerrarEditor =
    document.getElementById(
        "btnCerrarEditor"
    );


// ========================================
// MODAL EMPLEADO
// ========================================

const modalEmpleado =
    document.getElementById(
        "modalEmpleado"
    );

const tituloModalEmpleado =
    document.getElementById(
        "tituloModalEmpleado"
    );

const nombreEmpleado =
    document.getElementById(
        "nombreEmpleado"
    );

const identificacionEmpleado =
    document.getElementById(
        "identificacionEmpleado"
    );

const btnCerrarModal =
    document.getElementById(
        "btnCerrarModal"
    );

const btnCancelarEmpleado =
    document.getElementById(
        "btnCancelarEmpleado"
    );

const btnGuardarEmpleado =
    document.getElementById(
        "btnGuardarEmpleado"
    );


// ========================================
// NOTIFICACIÓN
// ========================================

const notificacion =
    document.getElementById(
        "notificacion"
    );

const textoNotificacion =
    document.getElementById(
        "textoNotificacion"
    );


// ========================================
// CARGAR DATOS
// ========================================

function cargarDatos() {

    const guardado =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!guardado) {

        return {
            empleados: []
        };

    }


    try {

        const datosGuardados =
            JSON.parse(guardado);


        if (!Array.isArray(
            datosGuardados.empleados
        )) {

            datosGuardados.empleados = [];

        }


        datosGuardados.empleados.forEach(
            empleado => {

                if (!empleado.registros) {

                    empleado.registros = {};

                }

            }
        );


        return datosGuardados;

    } catch (error) {

        console.error(
            "Error cargando datos:",
            error
        );


        return {
            empleados: []
        };

    }

}


// ========================================
// GUARDAR DATOS
// ========================================

function guardarDatos() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(datos)
    );

}


// ========================================
// FECHAS
// ========================================

function obtenerInicioSemana(fecha) {

    const nuevaFecha =
        new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        );


    const dia =
        nuevaFecha.getDay();


    const diferencia =
        dia === 0
            ? -6
            : 1 - dia;


    nuevaFecha.setDate(
        nuevaFecha.getDate() +
        diferencia
    );


    return nuevaFecha;

}


function crearFecha(
    fecha,
    cantidadDias
) {

    const nuevaFecha =
        new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        );


    nuevaFecha.setDate(
        nuevaFecha.getDate() +
        cantidadDias
    );


    return nuevaFecha;

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


// ========================================
// NÚMERO DE SEMANA
// ========================================

function obtenerNumeroSemana(fecha) {

    const fechaCopia =
        new Date(
            Date.UTC(
                fecha.getFullYear(),
                fecha.getMonth(),
                fecha.getDate()
            )
        );


    const dia =
        fechaCopia.getUTCDay() || 7;


    fechaCopia.setUTCDate(
        fechaCopia.getUTCDate() +
        4 -
        dia
    );


    const inicioAño =
        new Date(
            Date.UTC(
                fechaCopia.getUTCFullYear(),
                0,
                1
            )
        );


    return Math.ceil(
        (
            (
                fechaCopia -
                inicioAño
            ) / 86400000 +
            1
        ) / 7
    );

}


// ========================================
// NOMBRES
// ========================================

const nombresDias = [

    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"

];


const nombresMeses = [

    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre"

];


function formatearFechaCompleta(
    fecha
) {

    return `${
        nombresDias[
            fecha.getDay()
        ]
    } ${
        fecha.getDate()
    } de ${
        nombresMeses[
            fecha.getMonth()
        ]
    } de ${
        fecha.getFullYear()
    }`;

}


function formatearRangoSemana(
    inicio
) {

    const fin =
        crearFecha(
            inicio,
            6
        );


    if (
        inicio.getMonth() ===
        fin.getMonth() &&

        inicio.getFullYear() ===
        fin.getFullYear()
    ) {

        return `${
            inicio.getDate()
        } - ${
            fin.getDate()
        } de ${
            nombresMeses[
                inicio.getMonth()
            ]
        } de ${
            inicio.getFullYear()
        }`;

    }


    return `${
        inicio.getDate()
    } de ${
        nombresMeses[
            inicio.getMonth()
        ]
    } - ${
        fin.getDate()
    } de ${
        nombresMeses[
            fin.getMonth()
        ]
    } de ${
        fin.getFullYear()
    }`;

}


// ========================================
// HORARIO BASE
// ========================================

function obtenerHorarioBase(
    fecha
) {

    const dia =
        fecha.getDay();


    // Lunes a viernes

    if (
        dia >= 1 &&
        dia <= 5
    ) {

        return {

            entrada: "07:30",

            salida: "17:30"

        };

    }


    // Sábado

    if (dia === 6) {

        return {

            entrada: "07:30",

            salida: "12:00"

        };

    }


    // Domingo

    return null;

}


// ========================================
// MINUTOS
// ========================================

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
    entradaHora,
    salidaHora
) {

    if (
        !entradaHora ||
        !salidaHora
    ) {

        return 0;

    }


    const entradaMinutos =
        minutosHora(
            entradaHora
        );


    const salidaMinutos =
        minutosHora(
            salidaHora
        );


    return Math.max(
        0,
        salidaMinutos -
        entradaMinutos
    );

}


// ========================================
// FORMATO TIEMPO
// ========================================

function formatearTiempo(
    minutos
) {

    const valor =
        Math.abs(minutos);


    const horas =
        Math.floor(
            valor / 60
        );


    const minutosRestantes =
        valor % 60;


    return `${horas}h ${String(
        minutosRestantes
    ).padStart(2, "0")}m`;

}


function formatearBalance(
    minutos
) {

    if (minutos > 0) {

        return `+${formatearTiempo(
            minutos
        )}`;

    }


    if (minutos < 0) {

        return `-${formatearTiempo(
            minutos
        )}`;

    }


    return "0h 00m";

}


// ========================================
// EMPLEADO SELECCIONADO
// ========================================

function obtenerEmpleadoSeleccionado() {

    return datos.empleados.find(
        empleado =>
            empleado.id ===
            empleadoSeleccionadoId
    );

}


// ========================================
// INFORMACIÓN DE DÍA
// ========================================

function obtenerInformacionDia(
    empleado,
    fecha
) {

    const base =
        obtenerHorarioBase(
            fecha
        );


    if (!base) {

        return {

            trabaja: false,

            entrada: "",

            salida: "",

            estado: "Descanso",

            observacion: "",

            programado: 0,

            trabajado: 0,

            diferencia: 0

        };

    }


    const clave =
        fechaClave(fecha);


    const registro =
        empleado.registros?.[
            clave
        ];


    const entradaDia =
        registro?.entrada ??
        base.entrada;


    const salidaDia =
        registro?.salida ??
        base.salida;


    const estadoDia =
        registro?.estado ??
        "Completo";


    const programado =
        calcularDuracion(
            base.entrada,
            base.salida
        );


    let trabajado = 0;

    let diferencia = 0;


    // AUSENTE

    if (
        estadoDia ===
        "Ausente"
    ) {

        trabajado = 0;

        diferencia =
            -programado;

    }


    // JUSTIFICADO SIN HORAS

    else if (
        estadoDia ===
            "Justificado" &&
        !entradaDia &&
        !salidaDia
    ) {

        trabajado = 0;

        diferencia = 0;

    }


    // NORMAL

    else {

        trabajado =
            calcularDuracion(
                entradaDia,
                salidaDia
            );


        diferencia =
            trabajado -
            programado;

    }


    return {

        trabaja: true,

        entrada: entradaDia,

        salida: salidaDia,

        estado: estadoDia,

        observacion:
            registro?.observacion ??
            "",

        programado,

        trabajado,

        diferencia,

        modificado:
            Boolean(registro)

    };

}


// ========================================
// RENDERIZAR EMPLEADOS
// ========================================

function renderizarEmpleados() {

    listaEmpleados.innerHTML = "";


    cantidadEmpleados.textContent =
        datos.empleados.length;


    const texto =
        buscarEmpleado.value
            .trim()
            .toLowerCase();


    const empleadosFiltrados =
        datos.empleados.filter(
            empleado => {

                const nombre =
                    empleado.nombre
                        .toLowerCase();


                const identificacion =
                    (
                        empleado.identificacion ||
                        ""
                    ).toLowerCase();


                return (
                    nombre.includes(texto) ||
                    identificacion.includes(texto)
                );

            }
        );


    if (
        empleadosFiltrados.length ===
        0
    ) {

        const mensaje =
            document.createElement(
                "div"
            );


        mensaje.style.textAlign =
            "center";


        mensaje.style.padding =
            "20px";


        mensaje.style.color =
            "#6b7280";


        mensaje.textContent =
            datos.empleados.length ===
            0

                ? "No hay empleados registrados."

                : "No se encontraron empleados.";


        listaEmpleados.appendChild(
            mensaje
        );


        return;

    }


    empleadosFiltrados.forEach(
        empleado => {

            crearElementoEmpleado(
                empleado
            );

        }
    );

}


// ========================================
// CREAR ELEMENTO EMPLEADO
// ========================================

function crearElementoEmpleado(
    empleado
) {

    const contenedor =
        document.createElement(
            "div"
        );


    contenedor.className =
        "empleado-item";


    if (
        empleado.id ===
        empleadoSeleccionadoId
    ) {

        contenedor.classList.add(
            "activo"
        );

    }


    // AVATAR

    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "avatar";


    avatar.textContent =
        obtenerIniciales(
            empleado.nombre
        );


    // INFORMACIÓN

    const info =
        document.createElement(
            "div"
        );


    info.className =
        "empleado-info";


    const nombre =
        document.createElement(
            "strong"
        );


    nombre.textContent =
        empleado.nombre;


    const identificacion =
        document.createElement(
            "small"
        );


    identificacion.textContent =
        empleado.identificacion ||
        "Sin identificación";


    info.appendChild(
        nombre
    );

    info.appendChild(
        identificacion
    );


    // ACCIONES

    const acciones =
        document.createElement(
            "div"
        );


    acciones.className =
        "acciones-empleado";


    // BOTÓN EDITAR

    const btnEditar =
        document.createElement(
            "button"
        );


    btnEditar.type =
        "button";


    btnEditar.className =
        "btn-accion-empleado btn-editar";


    btnEditar.title =
        "Editar empleado";


    btnEditar.textContent =
        "✏️";


    btnEditar.addEventListener(
        "click",
        evento => {

            evento.stopPropagation();

            abrirEditarEmpleado(
                empleado.id
            );

        }
    );


    // BOTÓN ELIMINAR

    const btnEliminar =
        document.createElement(
            "button"
        );


    btnEliminar.type =
        "button";


    btnEliminar.className =
        "btn-accion-empleado btn-eliminar";


    btnEliminar.title =
        "Eliminar empleado";


    btnEliminar.textContent =
        "🗑️";


    btnEliminar.addEventListener(
        "click",
        evento => {

            evento.stopPropagation();

            eliminarEmpleado(
                empleado.id
            );

        }
    );


    acciones.appendChild(
        btnEditar
    );

    acciones.appendChild(
        btnEliminar
    );


    contenedor.appendChild(
        avatar
    );

    contenedor.appendChild(
        info
    );

    contenedor.appendChild(
        acciones
    );


    // SELECCIONAR EMPLEADO

    contenedor.addEventListener(
        "click",
        () => {

            seleccionarEmpleado(
                empleado.id
            );

        }
    );


    listaEmpleados.appendChild(
        contenedor
    );

}


// ========================================
// INICIALES
// ========================================

function obtenerIniciales(
    nombre
) {

    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            palabra =>
                palabra
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");

}


// ========================================
// SELECCIONAR EMPLEADO
// ========================================

function seleccionarEmpleado(
    id
) {

    empleadoSeleccionadoId =
        id;


    cerrarEditor();


    renderizarEmpleados();


    renderizarEmpleado();

}


// ========================================
// RENDERIZAR EMPLEADO
// ========================================

function renderizarEmpleado() {

    const empleado =
        obtenerEmpleadoSeleccionado();


    if (!empleado) {

        sinEmpleadoSeleccionado
            .classList.remove(
                "oculto"
            );


        contenidoEmpleado
            .classList.add(
                "oculto"
            );


        return;

    }


    sinEmpleadoSeleccionado
        .classList.add(
            "oculto"
        );


    contenidoEmpleado
        .classList.remove(
            "oculto"
        );


    nombreEmpleadoSeleccionado
        .textContent =
            empleado.nombre;


    renderizarSemana();

}


// ========================================
// RENDERIZAR SEMANA
// ========================================

function renderizarSemana() {

    const empleado =
        obtenerEmpleadoSeleccionado();


    if (!empleado) {

        return;

    }


    numeroSemana.textContent =
        obtenerNumeroSemana(
            semanaActual
        );


    rangoSemana.textContent =
        formatearRangoSemana(
            semanaActual
        );


    diasSemana.innerHTML =
        "";


    let balanceTotal = 0;


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const fecha =
            crearFecha(
                semanaActual,
                i
            );


        const informacion =
            obtenerInformacionDia(
                empleado,
                fecha
            );


        balanceTotal +=
            informacion.diferencia;


        const tarjeta =
            crearTarjetaDia(
                fecha,
                informacion
            );


        diasSemana.appendChild(
            tarjeta
        );

    }


    balanceSemanal.textContent =
        formatearBalance(
            balanceTotal
        );


    balanceSemanal.classList.remove(
        "balance-positivo",
        "balance-negativo",
        "balance-neutro"
    );


    if (balanceTotal > 0) {

        balanceSemanal.classList.add(
            "balance-positivo"
        );

    }

    else if (balanceTotal < 0) {

        balanceSemanal.classList.add(
            "balance-negativo"
        );

    }

    else {

        balanceSemanal.classList.add(
            "balance-neutro"
        );

    }

}


// ========================================
// TARJETA DÍA
// ========================================

function crearTarjetaDia(
    fecha,
    informacion
) {

    const tarjeta =
        document.createElement(
            "div"
        );


    tarjeta.className =
        "dia-card";


    const nombre =
        document.createElement(
            "div"
        );


    nombre.className =
        "dia-nombre";


    nombre.textContent =
        nombresDias[
            fecha.getDay()
        ];


    const numero =
        document.createElement(
            "div"
        );


    numero.className =
        "dia-numero";


    numero.textContent =
        fecha.getDate();


    tarjeta.appendChild(
        nombre
    );


    tarjeta.appendChild(
        numero
    );


    // DOMINGO

    if (
        !informacion.trabaja
    ) {

        tarjeta.classList.add(
            "domingo"
        );


        const descanso =
            document.createElement(
                "div"
            );


        descanso.className =
            "descanso";


        descanso.textContent =
            "Día libre";


        tarjeta.appendChild(
            descanso
        );


        return tarjeta;

    }


    // HORARIO

    const horario =
        document.createElement(
            "div"
        );


    horario.className =
        "horario";


    const horarioTitulo =
        document.createElement(
            "span"
        );


    horarioTitulo.textContent =
        "Horario";


    const horarioTexto =
        document.createElement(
            "strong"
        );


    horarioTexto.textContent =
        `${
            informacion.entrada ||
            "--:--"
        } - ${
            informacion.salida ||
            "--:--"
        }`;


    horario.appendChild(
        horarioTitulo
    );


    horario.appendChild(
        horarioTexto
    );


    tarjeta.appendChild(
        horario
    );


    // ESTADO

    const estadoElemento =
        document.createElement(
            "span"
        );


    estadoElemento.className =
        "estado";


    estadoElemento.textContent =
        informacion.estado;


    switch (
        informacion.estado
    ) {

        case "Completo":

            estadoElemento.classList.add(
                "estado-completo"
            );

            break;


        case "Tarde":

            estadoElemento.classList.add(
                "estado-tarde"
            );

            break;


        case "Hora extra":

            estadoElemento.classList.add(
                "estado-extra"
            );

            break;


        case "Salida antes":

            estadoElemento.classList.add(
                "estado-salida"
            );

            break;


        case "Ausente":

            estadoElemento.classList.add(
                "estado-ausente"
            );

            break;


        case "Justificado":

            estadoElemento.classList.add(
                "estado-justificado"
            );

            break;

    }


    tarjeta.appendChild(
        estadoElemento
    );


    // DIFERENCIA

    const diferencia =
        document.createElement(
            "div"
        );


    diferencia.className =
        "diferencia";


    if (
        informacion.diferencia > 0
    ) {

        diferencia.textContent =
            `+${
                formatearTiempo(
                    informacion.diferencia
                )
            }`;


        diferencia.classList.add(
            "positiva"
        );

    }

    else if (
        informacion.diferencia < 0
    ) {

        diferencia.textContent =
            `-${
                formatearTiempo(
                    informacion.diferencia
                )
            }`;


        diferencia.classList.add(
            "negativa"
        );

    }

    else {

        diferencia.textContent =
            "0h 00m";


        diferencia.classList.add(
            "neutra"
        );

    }


    tarjeta.appendChild(
        diferencia
    );


    // ABRIR EDITOR

    tarjeta.addEventListener(
        "click",
        () => {

            abrirEditor(
                fecha
            );

        }
    );


    return tarjeta;

}


// ========================================
// ABRIR EDITOR
// ========================================

function abrirEditor(
    fecha
) {

    const empleado =
        obtenerEmpleadoSeleccionado();


    if (!empleado) {

        return;

    }


    const horario =
        obtenerHorarioBase(
            fecha
        );


    if (!horario) {

        return;

    }


    fechaSeleccionada =
        fechaClave(
            fecha
        );


    const registro =
        empleado.registros?.[
            fechaSeleccionada
        ];


    fechaEditor.textContent =
        formatearFechaCompleta(
            fecha
        );


    entrada.value =
        registro?.entrada ??
        horario.entrada;


    salida.value =
        registro?.salida ??
        horario.salida;


    estado.value =
        registro?.estado ??
        "Completo";


    observacion.value =
        registro?.observacion ??
        "";


    editorAsistencia
        .classList.remove(
            "oculto"
        );


    actualizarCamposEstado();


    editorAsistencia.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


// ========================================
// ESTADO
// ========================================

function actualizarCamposEstado() {

    if (
        estado.value ===
        "Ausente"
    ) {

        entrada.value = "";

        salida.value = "";

        entrada.disabled = true;

        salida.disabled = true;

    }

    else {

        entrada.disabled = false;

        salida.disabled = false;

    }

}


estado.addEventListener(
    "change",
    actualizarCamposEstado
);


// ========================================
// GUARDAR ASISTENCIA
// ========================================

btnGuardar.addEventListener(
    "click",
    () => {

        if (!fechaSeleccionada) {

            return;

        }


        const empleado =
            obtenerEmpleadoSeleccionado();


        if (!empleado) {

            return;

        }


        if (!empleado.registros) {

            empleado.registros = {};

        }


        empleado.registros[
            fechaSeleccionada
        ] = {

            entrada:
                entrada.value,

            salida:
                salida.value,

            estado:
                estado.value,

            observacion:
                observacion.value.trim()

        };


        guardarDatos();


        renderizarSemana();


        cerrarEditor();


        mostrarNotificacion(
            "Asistencia guardada correctamente."
        );

    }
);


// ========================================
// RESTAURAR HORARIO
// ========================================

btnRestaurar.addEventListener(
    "click",
    () => {

        if (!fechaSeleccionada) {

            return;

        }


        const empleado =
            obtenerEmpleadoSeleccionado();


        if (!empleado) {

            return;

        }


        if (!empleado.registros) {

            empleado.registros = {};

        }


        delete empleado.registros[
            fechaSeleccionada
        ];


        guardarDatos();


        renderizarSemana();


        cerrarEditor();


        mostrarNotificacion(
            "Horario original restaurado."
        );

    }
);


// ========================================
// CERRAR EDITOR
// ========================================

function cerrarEditor() {

    editorAsistencia
        .classList.add(
            "oculto"
        );


    fechaSeleccionada =
        null;

}


btnCerrarEditor.addEventListener(
    "click",
    cerrarEditor
);


// ========================================
// SEMANA ANTERIOR
// ========================================

btnSemanaAnterior.addEventListener(
    "click",
    () => {

        semanaActual =
            crearFecha(
                semanaActual,
                -7
            );


        cerrarEditor();


        renderizarSemana();

    }
);


// ========================================
// ESTA SEMANA
// ========================================

btnSemanaActual.addEventListener(
    "click",
    () => {

        semanaActual =
            obtenerInicioSemana(
                new Date()
            );


        cerrarEditor();


        renderizarSemana();

    }
);


// ========================================
// SEMANA SIGUIENTE
// ========================================

btnSemanaSiguiente.addEventListener(
    "click",
    () => {

        semanaActual =
            crearFecha(
                semanaActual,
                7
            );


        cerrarEditor();


        renderizarSemana();

    }
);


// ========================================
// ABRIR MODAL AGREGAR
// ========================================

btnAgregarEmpleado.addEventListener(
    "click",
    () => {

        abrirAgregarEmpleado();

    }
);


function abrirAgregarEmpleado() {

    empleadoEditandoId =
        null;


    tituloModalEmpleado.textContent =
        "Agregar empleado";


    btnGuardarEmpleado.textContent =
        "Guardar empleado";


    nombreEmpleado.value =
        "";


    identificacionEmpleado.value =
        "";


    modalEmpleado
        .classList.remove(
            "oculto"
        );


    setTimeout(
        () => {

            nombreEmpleado.focus();

        },
        100
    );

}


// ========================================
// EDITAR EMPLEADO
// ========================================

function abrirEditarEmpleado(
    id
) {

    const empleado =
        datos.empleados.find(
            elemento =>
                elemento.id === id
        );


    if (!empleado) {

        return;

    }


    empleadoEditandoId =
        id;


    tituloModalEmpleado.textContent =
        "Editar empleado";


    btnGuardarEmpleado.textContent =
        "Guardar cambios";


    nombreEmpleado.value =
        empleado.nombre;


    identificacionEmpleado.value =
        empleado.identificacion ||
        "";


    modalEmpleado
        .classList.remove(
            "oculto"
        );


    setTimeout(
        () => {

            nombreEmpleado.focus();

        },
        100
    );

}


// ========================================
// GUARDAR EMPLEADO
// ========================================

btnGuardarEmpleado.addEventListener(
    "click",
    () => {

        const nombre =
            nombreEmpleado.value.trim();


        const identificacion =
            identificacionEmpleado.value.trim();


        if (!nombre) {

            mostrarNotificacion(
                "Ingrese el nombre del empleado."
            );


            nombreEmpleado.focus();


            return;

        }


        // =================================
        // EDITAR
        // =================================

        if (empleadoEditandoId) {

            const empleado =
                datos.empleados.find(
                    elemento =>
                        elemento.id ===
                        empleadoEditandoId
                );


            if (!empleado) {

                return;

            }


            empleado.nombre =
                nombre;


            empleado.identificacion =
                identificacion;


            guardarDatos();


            cerrarModalEmpleado();


            renderizarEmpleados();


            renderizarEmpleado();


            mostrarNotificacion(
                "Empleado actualizado correctamente."
            );


            return;

        }


        // =================================
        // AGREGAR
        // =================================

        const nuevoEmpleado = {

            id:
                Date.now().toString(),

            nombre:

                nombre,

            identificacion:

                identificacion,

            registros:

                {}

        };


        datos.empleados.push(
            nuevoEmpleado
        );


        guardarDatos();


        empleadoSeleccionadoId =
            nuevoEmpleado.id;


        cerrarModalEmpleado();


        renderizarEmpleados();


        renderizarEmpleado();


        mostrarNotificacion(
            "Empleado agregado correctamente."
        );

    }
);


// ========================================
// ELIMINAR EMPLEADO
// ========================================

function eliminarEmpleado(
    id
) {

    const empleado =
        datos.empleados.find(
            elemento =>
                elemento.id === id
        );


    if (!empleado) {

        return;

    }


    const confirmar =
        confirm(
            `¿Está seguro de eliminar a "${empleado.nombre}"?\n\n` +
            "También se eliminarán todos sus registros de asistencia.\n\n" +
            "Esta acción no se puede deshacer."
        );


    if (!confirmar) {

        return;

    }


    datos.empleados =
        datos.empleados.filter(
            elemento =>
                elemento.id !== id
        );


    if (
        empleadoSeleccionadoId ===
        id
    ) {

        empleadoSeleccionadoId =
            null;

        cerrarEditor();

    }


    guardarDatos();


    renderizarEmpleados();


    renderizarEmpleado();


    mostrarNotificacion(
        "Empleado eliminado correctamente."
    );

}


// ========================================
// CERRAR MODAL
// ========================================

function cerrarModalEmpleado() {

    modalEmpleado
        .classList.add(
            "oculto"
        );


    empleadoEditandoId =
        null;

}


btnCerrarModal.addEventListener(
    "click",
    cerrarModalEmpleado
);


btnCancelarEmpleado.addEventListener(
    "click",
    cerrarModalEmpleado
);


// ========================================
// BUSCAR
// ========================================

buscarEmpleado.addEventListener(
    "input",
    () => {

        renderizarEmpleados();

    }
);


// ========================================
// CERRAR MODAL HACIENDO CLICK AFUERA
// ========================================

modalEmpleado.addEventListener(
    "click",
    evento => {

        if (
            evento.target ===
            modalEmpleado
        ) {

            cerrarModalEmpleado();

        }

    }
);


// ========================================
// NOTIFICACIÓN
// ========================================

let tiempoNotificacion;


function mostrarNotificacion(
    mensaje
) {

    textoNotificacion.textContent =
        mensaje;


    notificacion.classList.add(
        "mostrar"
    );


    clearTimeout(
        tiempoNotificacion
    );


    tiempoNotificacion =
        setTimeout(
            () => {

                notificacion.classList.remove(
                    "mostrar"
                );

            },
            2500
        );

}


// ========================================
// INICIO
// ========================================

renderizarEmpleados();

renderizarEmpleado();