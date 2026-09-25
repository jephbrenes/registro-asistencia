const STORAGE_KEY = "registro_asistencia_v1";

let datos = {
    empleados: []
};

let empleadoSeleccionadoId = null;

let semanaActual = obtenerInicioSemana(new Date());

let fechaEditando = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    cargarDatos();

    configurarEventos();

    renderizarEmpleados();

    renderizarEmpleado();
});


/* =========================================================
   STORAGE
========================================================= */

function cargarDatos() {

    try {

        const guardado = localStorage.getItem(STORAGE_KEY);

        if (guardado) {

            const datosGuardados = JSON.parse(guardado);

            if (
                datosGuardados &&
                Array.isArray(datosGuardados.empleados)
            ) {
                datos = datosGuardados;
            }

        }

    } catch (error) {

        console.error("Error cargando datos:", error);

    }
}


function guardarDatos() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(datos)
    );
}


/* =========================================================
   FECHAS
========================================================= */

function obtenerInicioSemana(fecha) {

    const nuevaFecha = new Date(fecha);

    nuevaFecha.setHours(0, 0, 0, 0);

    const dia = nuevaFecha.getDay();

    const diferencia = dia === 0 ? -6 : 1 - dia;

    nuevaFecha.setDate(
        nuevaFecha.getDate() + diferencia
    );

    return nuevaFecha;
}


function crearFecha(fecha, cantidadDias) {

    const nuevaFecha = new Date(fecha);

    nuevaFecha.setDate(
        nuevaFecha.getDate() + cantidadDias
    );

    return nuevaFecha;
}


function fechaClave(fecha) {

    const year = fecha.getFullYear();

    const month = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        fecha.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatearFecha(fecha) {

    return fecha.toLocaleDateString(
        "es-CR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


/* =========================================================
   NÚMERO DE SEMANA
========================================================= */

function obtenerNumeroSemana(fecha) {

    const fechaReferencia = new Date(
        Date.UTC(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        )
    );

    const diaSemana = fechaReferencia.getUTCDay() || 7;

    fechaReferencia.setUTCDate(
        fechaReferencia.getUTCDate() +
        4 -
        diaSemana
    );

    const inicioAno = new Date(
        Date.UTC(
            fechaReferencia.getUTCFullYear(),
            0,
            1
        )
    );

    return Math.ceil(
        (
            (
                fechaReferencia -
                inicioAno
            ) / 86400000 +
            1
        ) / 7
    );
}


/* =========================================================
   HORARIOS
========================================================= */

function obtenerHorarioBase(fecha) {

    const dia = fecha.getDay();

    // Domingo
    if (dia === 0) {
        return null;
    }

    // Lunes a viernes
    if (dia >= 1 && dia <= 5) {

        return {
            entrada: "07:30",
            salida: "17:30"
        };
    }

    // Sábado
    return {
        entrada: "07:30",
        salida: "12:00"
    };
}


function minutosHora(hora) {

    if (!hora) {
        return 0;
    }

    const partes = hora.split(":");

    return (
        Number(partes[0]) * 60 +
        Number(partes[1])
    );
}


function calcularDuracion(entradaHora, salidaHora) {

    if (!entradaHora || !salidaHora) {
        return 0;
    }

    let entrada = minutosHora(entradaHora);
    let salida = minutosHora(salidaHora);

    if (salida < entrada) {
        salida += 24 * 60;
    }

    return salida - entrada;
}


function formatearTiempo(minutos) {

    minutos = Math.max(0, Math.round(minutos));

    const horas = Math.floor(minutos / 60);

    const minutosRestantes = minutos % 60;

    return `${horas}h ${String(minutosRestantes).padStart(2, "0")}m`;
}


/* =========================================================
   FORMATO PARA EXCEL
========================================================= */

function formatearBalanceExcel(minutos) {

    minutos = Math.round(minutos);

    if (minutos === 0) {
        return "0 minutos";
    }

    const signo = minutos > 0 ? "+" : "-";

    const valor = Math.abs(minutos);

    const horas = Math.floor(valor / 60);

    const minutosRestantes = valor % 60;


    if (horas > 0 && minutosRestantes > 0) {

        return `${signo}${horas}h ${minutosRestantes}m`;

    }


    if (horas > 0) {

        if (horas === 1) {
            return `${signo}1 hora`;
        }

        return `${signo}${horas} horas`;
    }


    return `${signo}${minutosRestantes} minutos`;
}


/* =========================================================
   INFORMACIÓN DE UN DÍA
========================================================= */

function obtenerInformacionDia(empleado, fecha) {

    const clave = fechaClave(fecha);

    const horario = obtenerHorarioBase(fecha);

    if (!horario) {

        return {
            horario: null,
            entrada: "",
            salida: "",
            estado: "",
            observacion: "",
            balance: 0
        };
    }


    const registro =
        empleado.registros?.[clave];


    if (!registro) {

        return {
            horario,
            entrada: horario.entrada,
            salida: horario.salida,
            estado: "Completo",
            observacion: "",
            balance: 0
        };
    }


    let balance = 0;


    if (registro.estado === "Ausente") {

        balance =
            -calcularDuracion(
                horario.entrada,
                horario.salida
            );

    }

    else if (registro.estado === "Justificado") {

        if (
            registro.entrada &&
            registro.salida
        ) {

            const trabajado =
                calcularDuracion(
                    registro.entrada,
                    registro.salida
                );

            const programado =
                calcularDuracion(
                    horario.entrada,
                    horario.salida
                );

            balance =
                trabajado -
                programado;

        } else {

            balance = 0;
        }

    }

    else {

        const entrada =
            registro.entrada ||
            horario.entrada;

        const salida =
            registro.salida ||
            horario.salida;

        const trabajado =
            calcularDuracion(
                entrada,
                salida
            );

        const programado =
            calcularDuracion(
                horario.entrada,
                horario.salida
            );

        balance =
            trabajado -
            programado;
    }


    return {

        horario,

        entrada:
            registro.entrada ??
            horario.entrada,

        salida:
            registro.salida ??
            horario.salida,

        estado:
            registro.estado ||
            "Completo",

        observacion:
            registro.observacion ||
            "",

        balance
    };
}


/* =========================================================
   EMPLEADO SELECCIONADO
========================================================= */

function obtenerEmpleadoSeleccionado() {

    return datos.empleados.find(
        empleado =>
            empleado.id === empleadoSeleccionadoId
    );
}


/* =========================================================
   RENDER EMPLEADOS
========================================================= */

function renderizarEmpleados() {

    const lista =
        document.getElementById(
            "listaEmpleados"
        );

    const contador =
        document.getElementById(
            "cantidadEmpleados"
        );

    const busqueda =
        document.getElementById(
            "buscarEmpleado"
        ).value
        .trim()
        .toLowerCase();


    lista.innerHTML = "";


    const empleadosFiltrados =
        datos.empleados.filter(empleado => {

            return (
                empleado.nombre
                    .toLowerCase()
                    .includes(busqueda) ||

                empleado.identificacion
                    .toLowerCase()
                    .includes(busqueda)
            );
        });


    contador.textContent =
        `${datos.empleados.length} ${
            datos.empleados.length === 1
                ? "empleado"
                : "empleados"
        }`;


    if (empleadosFiltrados.length === 0) {

        lista.innerHTML = `
            <div style="
                padding:20px;
                text-align:center;
                color:#777;
                font-size:13px;
            ">
                No hay empleados
            </div>
        `;

        return;
    }


    empleadosFiltrados.forEach(
        empleado => {

            lista.appendChild(
                crearElementoEmpleado(
                    empleado
                )
            );
        }
    );
}


function crearElementoEmpleado(empleado) {

    const elemento =
        document.createElement("div");

    elemento.className =
        "empleado-item";

    if (
        empleado.id ===
        empleadoSeleccionadoId
    ) {

        elemento.classList.add(
            "seleccionado"
        );
    }


    elemento.innerHTML = `

        <div class="empleado-avatar">
            ${obtenerIniciales(
                empleado.nombre
            )}
        </div>

        <div
            class="empleado-info"
            style="cursor:pointer;"
        >
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

        <div class="empleado-acciones">

            <button
                class="btn-mini"
                title="Editar"
                data-editar="${empleado.id}"
            >
                ✏️
            </button>

            <button
                class="btn-mini"
                title="Eliminar"
                data-eliminar="${empleado.id}"
            >
                🗑️
            </button>

        </div>
    `;


    elemento.addEventListener(
        "click",
        evento => {

            if (
                evento.target.closest(
                    "[data-editar]"
                ) ||
                evento.target.closest(
                    "[data-eliminar]"
                )
            ) {
                return;
            }

            seleccionarEmpleado(
                empleado.id
            );
        }
    );


    elemento
        .querySelector("[data-editar]")
        .addEventListener(
            "click",
            evento => {

                evento.stopPropagation();

                abrirEditarEmpleado(
                    empleado.id
                );
            }
        );


    elemento
        .querySelector("[data-eliminar]")
        .addEventListener(
            "click",
            evento => {

                evento.stopPropagation();

                eliminarEmpleado(
                    empleado.id
                );
            }
        );


    return elemento;
}


function obtenerIniciales(nombre) {

    const palabras =
        nombre
            .trim()
            .split(/\s+/);

    if (palabras.length === 1) {

        return palabras[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        palabras[0][0] +
        palabras[palabras.length - 1][0]
    ).toUpperCase();
}


function seleccionarEmpleado(id) {

    empleadoSeleccionadoId = id;

    cerrarEditor();

    renderizarEmpleados();

    renderizarEmpleado();
}


/* =========================================================
   RENDER EMPLEADO
========================================================= */

function renderizarEmpleado() {

    const vacio =
        document.getElementById(
            "estadoVacio"
        );

    const panel =
        document.getElementById(
            "panelAsistencia"
        );


    const empleado =
        obtenerEmpleadoSeleccionado();


    if (!empleado) {

        vacio.classList.remove(
            "oculto"
        );

        panel.classList.add(
            "oculto"
        );

        return;
    }


    vacio.classList.add(
        "oculto"
    );

    panel.classList.remove(
        "oculto"
    );


    document.getElementById(
        "nombreEmpleadoSeleccionado"
    ).textContent =
        empleado.nombre;


    document.getElementById(
        "identificacionEmpleadoSeleccionado"
    ).textContent =
        `Identificación: ${empleado.identificacion}`;


    renderizarSemana();
}


/* =========================================================
   SEMANA
========================================================= */

function renderizarSemana() {

    const empleado =
        obtenerEmpleadoSeleccionado();

    if (!empleado) {
        return;
    }


    const numero =
        obtenerNumeroSemana(
            semanaActual
        );


    document.getElementById(
        "numeroSemana"
    ).textContent =
        `#${numero}`;


    const fechaInicio =
        semanaActual;

    const fechaFin =
        crearFecha(
            semanaActual,
            6
        );


    document.getElementById(
        "rangoSemana"
    ).textContent =
        `${formatearFecha(
            fechaInicio
        )} — ${formatearFecha(
            fechaFin
        )}`;


    const dias =
        document.getElementById(
            "diasSemana"
        );

    dias.innerHTML = "";


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
            informacion.balance;


        dias.appendChild(
            crearTarjetaDia(
                fecha,
                informacion
            )
        );
    }


    actualizarBalanceSemanal(
        balanceTotal
    );
}


/* =========================================================
   TARJETA DEL DÍA
========================================================= */

function crearTarjetaDia(
    fecha,
    informacion
) {

    const tarjeta =
        document.createElement("div");

    const dia =
        fecha.getDay();


    const nombresDias = [
        "Domingo",
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];


    tarjeta.className =
        "dia-card";


    if (dia === 0) {

        tarjeta.classList.add(
            "domingo"
        );
    }


    const balance =
        informacion.balance;


    let balanceClase =
        "balance-neutro";


    if (balance > 0) {

        balanceClase =
            "balance-positivo";

    } else if (balance < 0) {

        balanceClase =
            "balance-negativo";
    }


    let balanceTexto =
        balance === 0
            ? "0 minutos"
            : formatearBalanceExcel(
                balance
            );


    let estadoClase =
        obtenerClaseEstado(
            informacion.estado
        );


    if (!informacion.horario) {

        tarjeta.innerHTML = `

            <div class="dia-nombre">
                Domingo
            </div>

            <div class="dia-fecha">
                ${formatearFecha(fecha)}
            </div>

            <div style="
                color:#777;
                font-size:13px;
                margin-top:20px;
            ">
                No laborable
            </div>
        `;

        return tarjeta;
    }


    tarjeta.innerHTML = `

        <div class="dia-nombre">
            ${nombresDias[dia]}
        </div>

        <div class="dia-fecha">
            ${formatearFecha(fecha)}
        </div>

        <div class="horario">

            <strong>
                Horario
            </strong>

            <span>
                ${informacion.horario.entrada}
                —
                ${informacion.horario.salida}
            </span>

        </div>


        <div class="horario">

            <strong>
                Registrado
            </strong>

            <span>
                ${informacion.entrada}
                —
                ${informacion.salida}
            </span>

        </div>


        <span class="estado ${estadoClase}">
            ${escapeHtml(
                informacion.estado
            )}
        </span>


        <div class="
            dia-balance
            ${balanceClase}
        ">
            ${balanceTexto}
        </div>


        <button
            class="dia-accion"
            type="button"
        >
            Editar
        </button>
    `;


    tarjeta
        .querySelector(".dia-accion")
        .addEventListener(
            "click",
            () => {

                abrirEditor(fecha);
            }
        );


    return tarjeta;
}


function obtenerClaseEstado(estado) {

    switch (estado) {

        case "Tarde":
            return "estado-tarde";

        case "Hora extra":
            return "estado-extra";

        case "Salida antes":
            return "estado-salida";

        case "Ausente":
            return "estado-ausente";

        case "Justificado":
            return "estado-justificado";

        default:
            return "estado-completo";
    }
}


/* =========================================================
   BALANCE SEMANAL
========================================================= */

function actualizarBalanceSemanal(
    minutos
) {

    const elemento =
        document.getElementById(
            "balanceSemanal"
        );


    elemento.textContent =
        formatearBalanceExcel(
            minutos
        );


    elemento.classList.remove(
        "balance-positivo",
        "balance-negativo",
        "balance-neutro"
    );


    if (minutos > 0) {

        elemento.classList.add(
            "balance-positivo"
        );

    } else if (minutos < 0) {

        elemento.classList.add(
            "balance-negativo"
        );

    } else {

        elemento.classList.add(
            "balance-neutro"
        );
    }
}


/* =========================================================
   EDITOR DE ASISTENCIA
========================================================= */

function abrirEditor(fecha) {

    const empleado =
        obtenerEmpleadoSeleccionado();

    if (!empleado) {
        return;
    }


    const horario =
        obtenerHorarioBase(fecha);


    if (!horario) {
        return;
    }


    fechaEditando = new Date(fecha);


    const clave =
        fechaClave(fecha);


    const registro =
        empleado.registros?.[clave];


    document.getElementById(
        "tituloEditor"
    ).textContent =
        `${fecha.toLocaleDateString(
            "es-CR",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        )}`;


    document.getElementById(
        "horarioBaseEditor"
    ).textContent =
        `Horario base: ${horario.entrada} — ${horario.salida}`;


    document.getElementById(
        "horaEntrada"
    ).value =
        registro?.entrada ||
        horario.entrada;


    document.getElementById(
        "horaSalida"
    ).value =
        registro?.salida ||
        horario.salida;


    document.getElementById(
        "estadoAsistencia"
    ).value =
        registro?.estado ||
        "Completo";


    document.getElementById(
        "observacion"
    ).value =
        registro?.observacion ||
        "";


    actualizarCamposEstado();


    document.getElementById(
        "editorAsistencia"
    ).classList.remove(
        "oculto"
    );


    document.getElementById(
        "editorAsistencia"
    ).scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


function actualizarCamposEstado() {

    const estado =
        document.getElementById(
            "estadoAsistencia"
        ).value;


    const entrada =
        document.getElementById(
            "horaEntrada"
        );

    const salida =
        document.getElementById(
            "horaSalida"
        );


    if (estado === "Ausente") {

        entrada.disabled = true;
        salida.disabled = true;

    } else {

        entrada.disabled = false;
        salida.disabled = false;
    }
}


function cerrarEditor() {

    fechaEditando = null;

    document.getElementById(
        "editorAsistencia"
    ).classList.add(
        "oculto"
    );
}


/* =========================================================
   GUARDAR ASISTENCIA
========================================================= */

function guardarAsistencia() {

    const empleado =
        obtenerEmpleadoSeleccionado();

    if (!empleado || !fechaEditando) {
        return;
    }


    if (!empleado.registros) {
        empleado.registros = {};
    }


    const clave =
        fechaClave(
            fechaEditando
        );


    const estado =
        document.getElementById(
            "estadoAsistencia"
        ).value;


    const entrada =
        document.getElementById(
            "horaEntrada"
        ).value;


    const salida =
        document.getElementById(
            "horaSalida"
        ).value;


    const observacion =
        document.getElementById(
            "observacion"
        ).value.trim();


    empleado.registros[clave] = {

        entrada:
            estado === "Ausente"
                ? ""
                : entrada,

        salida:
            estado === "Ausente"
                ? ""
                : salida,

        estado,

        observacion
    };


    guardarDatos();

    cerrarEditor();

    renderizarSemana();

    mostrarNotificacion(
        "Asistencia guardada correctamente."
    );
}


/* =========================================================
   RESTAURAR HORARIO
========================================================= */

function restaurarHorario() {

    const empleado =
        obtenerEmpleadoSeleccionado();

    if (!empleado || !fechaEditando) {
        return;
    }


    if (!empleado.registros) {
        empleado.registros = {};
    }


    const clave =
        fechaClave(
            fechaEditando
        );


    delete empleado.registros[
        clave
    ];


    guardarDatos();

    cerrarEditor();

    renderizarSemana();

    mostrarNotificacion(
        "Horario restaurado."
    );
}


/* =========================================================
   EMPLEADOS
========================================================= */

let empleadoEditandoId = null;


function abrirAgregarEmpleado() {

    empleadoEditandoId = null;


    document.getElementById(
        "tituloModalEmpleado"
    ).textContent =
        "Agregar empleado";


    document.getElementById(
        "nombreEmpleado"
    ).value = "";


    document.getElementById(
        "identificacionEmpleado"
    ).value = "";


    document.getElementById(
        "modalEmpleado"
    ).classList.remove(
        "oculto"
    );


    document.getElementById(
        "nombreEmpleado"
    ).focus();
}


function abrirEditarEmpleado(id) {

    const empleado =
        datos.empleados.find(
            empleado =>
                empleado.id === id
        );


    if (!empleado) {
        return;
    }


    empleadoEditandoId = id;


    document.getElementById(
        "tituloModalEmpleado"
    ).textContent =
        "Editar empleado";


    document.getElementById(
        "nombreEmpleado"
    ).value =
        empleado.nombre;


    document.getElementById(
        "identificacionEmpleado"
    ).value =
        empleado.identificacion;


    document.getElementById(
        "modalEmpleado"
    ).classList.remove(
        "oculto"
    );
}


function cerrarModalEmpleado() {

    document.getElementById(
        "modalEmpleado"
    ).classList.add(
        "oculto"
    );

    empleadoEditandoId = null;
}


function guardarEmpleado() {

    const nombre =
        document.getElementById(
            "nombreEmpleado"
        ).value.trim();


    const identificacion =
        document.getElementById(
            "identificacionEmpleado"
        ).value.trim();


    if (!nombre) {

        mostrarNotificacion(
            "Escribe el nombre del empleado."
        );

        return;
    }


    if (!identificacion) {

        mostrarNotificacion(
            "Escribe la identificación."
        );

        return;
    }


    if (empleadoEditandoId) {

        const empleado =
            datos.empleados.find(
                empleado =>
                    empleado.id ===
                    empleadoEditandoId
            );


        if (empleado) {

            empleado.nombre =
                nombre;

            empleado.identificacion =
                identificacion;
        }


        mostrarNotificacion(
            "Empleado actualizado."
        );

    } else {

        const nuevoEmpleado = {

            id:
                Date.now().toString(),

            nombre,

            identificacion,

            registros: {}
        };


        datos.empleados.push(
            nuevoEmpleado
        );


        empleadoSeleccionadoId =
            nuevoEmpleado.id;


        mostrarNotificacion(
            "Empleado agregado."
        );
    }


    guardarDatos();

    cerrarModalEmpleado();

    renderizarEmpleados();

    renderizarEmpleado();
}


function eliminarEmpleado(id) {

    const empleado =
        datos.empleados.find(
            empleado =>
                empleado.id === id
        );


    if (!empleado) {
        return;
    }


    const confirmar =
        confirm(
            `¿Seguro que quieres eliminar a ${empleado.nombre}?\n\nTambién se eliminarán todos sus registros de asistencia.`
        );


    if (!confirmar) {
        return;
    }


    datos.empleados =
        datos.empleados.filter(
            empleado =>
                empleado.id !== id
        );


    if (
        empleadoSeleccionadoId === id
    ) {

        empleadoSeleccionadoId =
            null;

        cerrarEditor();
    }


    guardarDatos();

    renderizarEmpleados();

    renderizarEmpleado();


    mostrarNotificacion(
        "Empleado eliminado."
    );
}


/* =========================================================
   EXCEL
========================================================= */

function descargarExcel() {

    if (
        typeof XLSX ===
        "undefined"
    ) {

        mostrarNotificacion(
            "No se pudo cargar la función de Excel. Revisa tu conexión a Internet."
        );

        return;
    }


    if (
        datos.empleados.length === 0
    ) {

        mostrarNotificacion(
            "No hay empleados para exportar."
        );

        return;
    }


    const numeroSemana =
        obtenerNumeroSemana(
            semanaActual
        );


    const nombresDias = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado"
    ];


    const filas = [];


    /*
       UNA FILA POR EMPLEADO
    */

    datos.empleados.forEach(
        empleado => {

            const fila = {

                "Empleado":
                    empleado.nombre,

                "Lunes": "",
                "Martes": "",
                "Miércoles": "",
                "Jueves": "",
                "Viernes": "",
                "Sábado": "",

                "Total":
                    "0 minutos"
            };


            let total = 0;


            /*
               LUNES A SÁBADO
            */

            for (
                let i = 0;
                i < 6;
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


                const balance =
                    informacion.balance;


                total += balance;


                fila[
                    nombresDias[i]
                ] =
                    balance === 0
                        ? ""
                        : formatearBalanceExcel(
                            balance
                        );
            }


            fila["Total"] =
                formatearBalanceExcel(
                    total
                );


            filas.push(fila);
        }
    );


    /*
       CREAR HOJA
    */

    const hoja =
        XLSX.utils.json_to_sheet(
            filas
        );


    /*
       ANCHOS DE COLUMNAS
    */

    hoja["!cols"] = [

        { wch: 28 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 }

    ];


    /*
       CREAR LIBRO
    */

    const libro =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        libro,
        hoja,
        "Asistencia"
    );


    /*
       NOMBRE DEL ARCHIVO
    */

    const nombreArchivo =
        `Asistencia_Semana_${numeroSemana}.xlsx`;


    /*
       DESCARGAR
    */

    XLSX.writeFile(
        libro,
        nombreArchivo
    );


    mostrarNotificacion(
        `Excel descargado: ${nombreArchivo}`
    );
}


/* =========================================================
   EVENTOS
========================================================= */

function configurarEventos() {

    document.getElementById(
        "btnAgregarEmpleado"
    ).addEventListener(
        "click",
        abrirAgregarEmpleado
    );


    document.getElementById(
        "btnGuardarEmpleado"
    ).addEventListener(
        "click",
        guardarEmpleado
    );


    document.getElementById(
        "btnCancelarEmpleado"
    ).addEventListener(
        "click",
        cerrarModalEmpleado
    );


    document.getElementById(
        "btnCerrarModalEmpleado"
    ).addEventListener(
        "click",
        cerrarModalEmpleado
    );


    document.getElementById(
        "btnEditarEmpleado"
    ).addEventListener(
        "click",
        () => {

            if (empleadoSeleccionadoId) {

                abrirEditarEmpleado(
                    empleadoSeleccionadoId
                );
            }
        }
    );


    document.getElementById(
        "btnEliminarEmpleado"
    ).addEventListener(
        "click",
        () => {

            if (empleadoSeleccionadoId) {

                eliminarEmpleado(
                    empleadoSeleccionadoId
                );
            }
        }
    );


    document.getElementById(
        "btnSemanaAnterior"
    ).addEventListener(
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


    document.getElementById(
        "btnSemanaSiguiente"
    ).addEventListener(
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


    document.getElementById(
        "btnEstaSemana"
    ).addEventListener(
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


    document.getElementById(
        "btnCerrarEditor"
    ).addEventListener(
        "click",
        cerrarEditor
    );


    document.getElementById(
        "btnGuardarAsistencia"
    ).addEventListener(
        "click",
        guardarAsistencia
    );


    document.getElementById(
        "btnRestaurarHorario"
    ).addEventListener(
        "click",
        restaurarHorario
    );


    document.getElementById(
        "estadoAsistencia"
    ).addEventListener(
        "change",
        actualizarCamposEstado
    );


    document.getElementById(
        "buscarEmpleado"
    ).addEventListener(
        "input",
        renderizarEmpleados
    );


    /*
       BOTÓN EXCEL
    */

    document.getElementById(
        "btnDescargarExcel"
    ).addEventListener(
        "click",
        descargarExcel
    );


    /*
       CERRAR MODAL AL HACER CLICK
       FUERA DEL CONTENIDO
    */

    document.getElementById(
        "modalEmpleado"
    ).addEventListener(
        "click",
        evento => {

            if (
                evento.target.id ===
                "modalEmpleado"
            ) {

                cerrarModalEmpleado();
            }
        }
    );


    /*
       ESCAPE
    */

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape"
            ) {

                cerrarModalEmpleado();

                cerrarEditor();
            }
        }
    );
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function mostrarNotificacion(
    mensaje
) {

    const elemento =
        document.getElementById(
            "notificacion"
        );


    elemento.textContent =
        mensaje;


    elemento.classList.add(
        "mostrar"
    );


    clearTimeout(
        mostrarNotificacion.timeout
    );


    mostrarNotificacion.timeout =
        setTimeout(
            () => {

                elemento.classList.remove(
                    "mostrar"
                );

            },
            3000
        );
}


/* =========================================================
   SEGURIDAD HTML
========================================================= */

function escapeHtml(texto) {

    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}