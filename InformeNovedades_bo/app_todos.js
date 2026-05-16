const URL_API_EXCEL = "https://script.google.com/macros/s/AKfycbwcLbLrSY2vp6P03iTW6O4p2zDLzRESxqiY3qKh86r433vgnlivuOrKCgv-sTh7ImFqug/exec";

// Cambiamos la referencia al contenedor (asegúrate de que en tu HTML sea un div o un contenedor limpio)
const contenedorTabla = document.getElementById('novedadesGrid');

let datosExcel = []; 

// 1. Función para obtener los datos de Google Sheets
async function obtenerDatos() {
    try {
        contenedorTabla.innerHTML = '<p style="text-align:center; width:100%;">Cargando novedades...</p>';
        const respuesta = await fetch(URL_API_EXCEL);
        datosExcel = await respuesta.json();
        
        if (datosExcel.error) {
            contenedorTabla.innerHTML = `<p>Error: ${datosExcel.error}</p>`;
        } else {
            renderTabla(datosExcel);
        }
    } catch (error) {
        contenedorTabla.innerHTML = '<p>Error al conectar.</p>';
        console.error("Error detallado:", error);
    }
}

// 2. Nueva función para crear la estructura de Tabla de Excel
function renderTabla(novedades) {
    contenedorTabla.innerHTML = ''; 

    if (novedades.length === 0) {
        contenedorTabla.innerHTML = '<p style="text-align:center;">No hay registros disponibles.</p>';
        return;
    }

    // Creamos el elemento tabla y sus clases base
    const table = document.createElement('table');
    table.className = 'excel-table';

    // Construimos el encabezado estilo Excel
    table.innerHTML = `
        <thead>
            <tr>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Laboratorio</th>
                <th>Docente</th>
                <th>Asignatura</th>
                <th>Problema Detectado</th>
                <th>Descripción General</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    
    // Recorremos todos los elementos sin omitir ni ocultar ninguno
    novedades.forEach((item, index) => {
        const getData = (key) => {
            const foundKey = Object.keys(item).find(k => k.toLowerCase().trim() === key.toLowerCase());
            return foundKey ? item[foundKey] : null;
        };

        const estadoKey = Object.keys(item).find(k => k.toLowerCase().trim() === 'estado');
        const estado = estadoKey ? item[estadoKey] : '';
        const completadoChecked = estado && estado.toString().toLowerCase().trim() === 'completado';

        // --- FORMATEO DE FECHA ---
        let fechaMostrar = "";
        let fechaRaw = getData('Fecha') || getData('Fecha informe');
        if (fechaRaw) {
            const fechaSolo = fechaRaw.toString().includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
            fechaMostrar = fechaSolo.split('-').reverse().join('-');
        }

        // --- FORMATEO DE HORARIO ---
        let horarioMostrar = "";
        let horarioRaw = getData('Horario');
        if (horarioRaw) {
            if (horarioRaw.toString().includes('T')) {
                horarioMostrar = horarioRaw.split('T')[1].substring(0, 5);
            } else {
                horarioMostrar = horarioRaw;
            }
        }

        const docente = getData('Docente') || 'Sin nombre';
        const asignatura = getData('Asignatura') || 'N/A';
        const laboratorio = getData('Laboratorio') || 'S/N';
        const tipo = getData('PROBLEMAS DETECTADOS') || 'General';
        const detalle = getData('DESCRIPCION GENERAL') || 'Sin detalle';

        // Creamos la fila
        const row = document.createElement('tr');
        // Si ya está completado, podemos añadir una clase visual ligera en vez de ocultarlo por completo
        if (completadoChecked) {
            row.classList.add('row-completed');
        }

        row.innerHTML = `
            <td style="text-align: center;">
                <input class="form-check-input table-checkbox" type="checkbox" id="completado-${index}" ${completadoChecked ? 'checked' : ''}>
            </td>
            <td>${fechaMostrar}</td>
            <td>${horarioMostrar} hrs</td>
            <td style="text-align: center;"><span class="table-badge">${laboratorio}</span></td>
            <td><strong>${docente}</strong></td>
            <td>${asignatura}</td>
            <td>${tipo}</td>
            <td>${detalle}</td>
        `;

        // Evento del Checkbox modificado para que no destruya ni oculte la fila, solo cambie estado visual
        const checkbox = row.querySelector(`#completado-${index}`);
  

        tbody.appendChild(row);
    });

    contenedorTabla.appendChild(table);
}

// Ejecutar la carga al abrir la página
obtenerDatos();