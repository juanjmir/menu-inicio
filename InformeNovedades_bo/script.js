
const URL_API_EXCEL = "https://script.google.com/macros/s/AKfycbwcLbLrSY2vp6P03iTW6O4p2zDLzRESxqiY3qKh86r433vgnlivuOrKCgv-sTh7ImFqug/exec";
const URL_API_ACTUALIZAR = "https://script.google.com/macros/s/AKfycbyTwvTRAX1nO6LM2odG7ajFJCyCbMEx9up9PvHecGocSqdjvruHxkccxTunfoqd-Mxp/exec"; 

const grid = document.getElementById('novedadesGrid');
let datosExcel = []; 

// --- INYECCIÓN DINÁMICA DE ESTILOS PARA EL MODAL ---
const estilosModal = document.createElement('style');
estilosModal.innerHTML = `
    .modal-rol { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
    .modal-rol-content { background-color: #fff; padding: 20px; border-radius: 8px; width: 320px; text-align: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); font-family: sans-serif;}
    .modal-rol select { width: 100%; padding: 10px; margin: 15px 0; border-radius: 4px; border: 1px solid #ccc; font-size: 1rem;}
    .modal-rol button { padding: 8px 15px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn-confirmar { background-color: #28a745; color: white; }
    .btn-cancelar { background-color: #dc3545; color: white; }
`;
document.head.appendChild(estilosModal);

// --- CREACIÓN DINÁMICA DEL CONTENEDOR MODAL EN EL HTML ---
const modalContainer = document.createElement('div');
modalContainer.id = 'modalRol';
modalContainer.className = 'modal-rol';
modalContainer.innerHTML = `
    <div class="modal-rol-content">
        <h3>Finalizar Novedad</h3>
        <p>Selecciona tu Rol para firmar el cambio:</p>
        <select id="selectRol">
            <option value="DC">DC</option>
            <option value="CC AUTOMATIZACION">CC AUTOMATIZACION</option>
            <option value="CC INFORMATICA">CC INFORMATICA</option>
            <option value="PAÑOL AUTOMATIZACION">PAÑOL AUTOMATIZACION</option>
            <option value="PAÑOL INFORMATICA">PAÑOL INFORMATICA</option>
        </select>
        <button id="btnConfirmarRol" class="btn-confirmar">Confirmar</button>
        <button id="btnCancelarRol" class="btn-cancelar">Cancelar</button>
    </div>
`;
document.body.appendChild(modalContainer);

let checkboxActual = null;
let cardActual = null;
let itemActual = null;

// Acciones del modal
document.getElementById('btnCancelarRol').addEventListener('click', () => {
    if (checkboxActual) checkboxActual.checked = false; 
    modalContainer.style.display = 'none';
});

document.getElementById('btnConfirmarRol').addEventListener('click', async () => {
    const rolSeleccionado = document.getElementById('selectRol').value;
    modalContainer.style.display = 'none';

    if (itemActual) {
        const foundKeyFolio = Object.keys(itemActual).find(k => k.toLowerCase().trim() === 'folio');
        const folioId = foundKeyFolio ? itemActual[foundKeyFolio] : null;

        if (!folioId) {
            alert("Error: No se encontró el Folio de este registro.");
            checkboxActual.checked = false;
            return;
        }

        // Ocultar la card visualmente al instante
        cardActual.hidden = true;
        cardActual.classList.add('hidden-card');

        // Enviamos la petición exclusivamente a la NUEVA API
        try {
            await fetch(URL_API_ACTUALIZAR, {
                method: 'POST',
                mode: 'no-cors', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folio: folioId,
                    encargado: rolSeleccionado
                })
            });
            console.log("Actualización enviada para Folio:", folioId);
        } catch (error) {
            console.error("Error al conectar con la API de actualización:", error);
        }
    }
});

// 1. Función para obtener los datos de Google Sheets (Tu lógica intacta)
async function obtenerDatos() {
    try {
        grid.innerHTML = '<p style="text-align:center; width:100%;">Cargando novedades...</p>';
        const respuesta = await fetch(URL_API_EXCEL);
        datosExcel = await respuesta.json();
        
        if (datosExcel.error) {
            grid.innerHTML = `<p>Error: ${datosExcel.error}</p>`;
        } else {
            renderCards(datosExcel);
        }
    } catch (error) {
        grid.innerHTML = '<p>Error al conectar.</p>';
        console.error("Error detallado:", error);
    }
}

// 2. Función para crear las tarjetas en el HTML (Actualizada para ocultar 'terminado')
function renderCards(novedades) {
    grid.innerHTML = ''; 
    
    novedades.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const getData = (key) => {
            const foundKey = Object.keys(item).find(k => k.toLowerCase().trim() === key.toLowerCase());
            return foundKey ? item[foundKey] : null;
        };

        const estadoKey = Object.keys(item).find(k => k.toLowerCase().trim() === 'estado');
        const estado = estadoKey ? item[estadoKey] : '';
        
        // Se oculta de la vista si está 'completado' o 'terminado'
        const completadoChecked = estado && (estado.toString().toLowerCase().trim() === 'completado' || estado.toString().toLowerCase().trim() === 'terminado');

        if (completadoChecked) {
            card.hidden = true;
            card.classList.add('hidden-card');
        }

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

        card.innerHTML = `
            <div class="form-check completed-check">
                <input class="form-check-input" type="checkbox" id="completado-${index}" ${completadoChecked ? 'checked' : ''}>
                <label class="form-check-label" for="completado-${index}">Completado</label>
            </div>
            <div class="label"><center>Reporte Informe Novedades</center></div>
            <h4>${docente}</h4>
            <div class="badge">${laboratorio}</div>
            <p><span class="label">Asignatura:</span> ${asignatura}</p>
            <p><span class="label">Problema Detectado:</span> ${tipo}</p>
            <p><span class="label">Detalle:</span> ${detalle}</p>
            <p style="font-size: 0.85rem; color: #555; text-align: right; margin-top:15px; font-weight: bold;">
                📅 ${fechaMostrar} &nbsp; 🕒 ${horarioMostrar} hrs
            </p>
        `;

        const checkbox = card.querySelector(`#completado-${index}`);
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    checkboxActual = checkbox;
                    cardActual = card;
                    itemActual = item;
                    modalContainer.style.display = 'flex';
                }
            });
        }

        grid.appendChild(card);
    });
}

obtenerDatos();