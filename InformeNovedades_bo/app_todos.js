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
                <th>Detalle Detectado</th>
                <th>Cerrado Por</th>
                <th>Fecha Cierre</th>
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



        // --- FORMATEO DE FECHA ---
        let horarioMostrar = "N/A";
        let horarioRaw = getData('Horario');
        if (horarioRaw) {
            let strHorario = horarioRaw.toString();
            if (strHorario.includes('T')) {
                // Extrae lo que está después de la 'T' (ej: "15:37:45.000Z") y toma solo los primeros 5 caracteres ("15:37")
                horarioMostrar = strHorario.split('T')[1].substring(0, 5);
            } else {
                // Si ya venía limpio o en otro formato, solo tomamos los primeros 5 caracteres
                horarioMostrar = strHorario.trim().substring(0, 5);
            }
        }
        let fechaMostrar = "N/A";
        let fechaRaw = getData('Fecha') || getData('Fecha informe'); // Captura cualquiera de los dos nombres
        if (fechaRaw) {
            // Separa el texto en la 'T' para eliminar "T04:00:00.000Z" y quedarse con "2026-05-19"
            const fechaSolo = fechaRaw.toString().includes('T') ? fechaRaw.split('T')[0] : fechaRaw;
            // Da vuelta el orden: de YYYY-MM-DD a DD-MM-YYYY
            fechaMostrar = fechaSolo.trim().split('-').reverse().join('-');
        }   


        const estado = getData('Estado') || 'Pendiente';
        const docente = getData('Docente') || 'Sin nombre';
        const asignatura = getData('Asignatura') || 'N/A';
        const laboratorio = getData('Laboratorio') || 'S/N';
        const tipo = getData('PROBLEMAS DETECTADOS') || 'General';
        const detalle = getData('DESCRIPCION GENERAL') || 'Sin detalle';
        const encargado = getData('encargado') || 'Sin Cierre';
        const fecha_fin = getData('fecha termino') || 'Sin Cierre';

        // Creamos la fila
        const row = document.createElement('tr');
   
        row.innerHTML = `
            <td>${estado}</td>
            <td>${fechaMostrar}</td>
            <td>${horarioMostrar} hrs</td>
            <td style="text-align: center;"><span class="table-badge">${laboratorio}</span></td>
            <td><strong>${docente}</strong></td>
            <td>${asignatura}</td>
            <td>${tipo}</td>
            <td>${detalle}</td>
            <td>${encargado}</td>
            <td>${fecha_fin}</td>
        `;

        tbody.appendChild(row);
    });

    contenedorTabla.appendChild(table);
}

// Ejecutar la carga al abrir la página
obtenerDatos();