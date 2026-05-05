const URL_API_EXCEL = "https://script.google.com/macros/s/AKfycbwcLbLrSY2vp6P03iTW6O4p2zDLzRESxqiY3qKh86r433vgnlivuOrKCgv-sTh7ImFqug/exec";

let datosExcel = [];
let graficosActivos = {};

// Elementos del DOM
const selectDocente = document.getElementById('selectDocente');
const selectLab = document.getElementById('selectLab');
const fechaInicio = document.getElementById('fechaInicio');
const fechaFin = document.getElementById('fechaFin');
const btnFiltrar = document.getElementById('btnFiltrar');

// Función para obtener valores sin importar mayúsculas o espacios
const getVal = (item, key) => {
    if (!item) return null;
    const foundKey = Object.keys(item).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
    return foundKey ? item[foundKey] : null;
};

async function cargarEstadisticas() {
    try {
        const respuesta = await fetch(URL_API_EXCEL);
        const jsonRecibido = await respuesta.json();
        
        // Validar si los datos vienen envueltos en una propiedad o directos
        datosExcel = Array.isArray(jsonRecibido) ? jsonRecibido : (jsonRecibido.datos || []);
        
        console.log("Datos cargados:", datosExcel.length);

        if (datosExcel.length > 0) {
            rellenarSelectores();
            // Mostrar estado inicial sin filtros de fecha
            actualizarDashboard();
        } else {
            console.warn("El Excel parece estar vacío o el formato no es correcto.");
        }
    } catch (e) {
        console.error("Error crítico en la conexión:", e);
        document.getElementById('contenedorVelocimetros').innerHTML = "<p>Error al conectar con Google Sheets.</p>";
    }
}

function rellenarSelectores() {
    // Limpiar pero mantener la primera opción
    selectDocente.innerHTML = '<option value="">Seleccione Docente...</option>';
    selectLab.innerHTML = '<option value="">Seleccione Laboratorio...</option>';

    const listaDocentes = [...new Set(datosExcel.map(i => getVal(i, 'Docente')).filter(d => d))].sort();
    const listaLabs = [...new Set(datosExcel.map(i => getVal(i, 'Laboratorio')).filter(l => l))].sort();

    listaDocentes.forEach(d => {
        let opt = new Option(d, d);
        selectDocente.add(opt);
    });

    listaLabs.forEach(l => {
        let opt = new Option(l, l);
        selectLab.add(opt);
    });
}

function actualizarDashboard() {
    const inicio = fechaInicio.value ? new Date(fechaInicio.value + "T00:00:00") : null;
    const fin = fechaFin.value ? new Date(fechaFin.value + "T23:59:59") : null;

    const datosFiltrados = datosExcel.filter(item => {
        let fRaw = getVal(item, 'Fecha') || getVal(item, 'Fecha informe');
        if (!fRaw) return true; // Si no hay fecha, lo incluimos por defecto
        
        const fechaItem = new Date(fRaw.toString().includes('T') ? fRaw : fRaw.replace(/-/g, '\/'));
        
        if (inicio && fechaItem < inicio) return false;
        if (fin && fechaItem > fin) return false;
        return true;
    });

    // Actualizar contadores numéricos
    const docenteSel = selectDocente.value;
    document.getElementById('resumenDocente').textContent = docenteSel ? 
        datosFiltrados.filter(i => getVal(i, 'Docente') === docenteSel).length : 0;

    const labSel = selectLab.value;
    document.getElementById('resumenLab').textContent = labSel ? 
        datosFiltrados.filter(i => getVal(i, 'Laboratorio') === labSel).length : 0;

    dibujarVelocimetros(datosFiltrados);
}

function dibujarVelocimetros(datos) {
    const contenedor = document.getElementById('contenedorVelocimetros');
    
    // Destruir instancias previas de Chart.js
    Object.values(graficosActivos).forEach(g => g.destroy());
    graficosActivos = {};
    contenedor.innerHTML = '';

    const conteo = {};
    datos.forEach(i => {
        const l = getVal(i, 'Laboratorio');
        if(l) conteo[l] = (conteo[l] || 0) + 1;
    });

    const MAX_VAL = 20;

    Object.keys(conteo).forEach(lab => {
        const valor = conteo[lab];
        const canvasId = `chart-${lab.replace(/\s+/g, '-')}`;
        
        const div = document.createElement('div');
        div.className = "card";
        div.innerHTML = `
            <div style="height: 150px; position: relative;">
                <canvas id="${canvasId}"></canvas>
                <div style="position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); text-align: center;">
                    <strong style="font-size: 1.2rem;">${valor}</strong><br><small>${lab}</small>
                </div>
            </div>
        `;
        contenedor.appendChild(div);

        const ctx = document.getElementById(canvasId).getContext('2d');
        
        graficosActivos[lab] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [valor, Math.max(0, MAX_VAL - valor)],
                    backgroundColor: [valor > 10 ? '#ff4d4d' : '#36a2eb', '#eeeeee'],
                    circumference: 180,
                    rotation: 270,
                    borderWidth: 0
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { tooltip: { enabled: false }, legend: { display: false } }
            },
            plugins: [{
                afterDraw: chart => {
                    const {ctx, canvas} = chart;
                    const x = canvas.width / 2;
                    const y = canvas.height - 10;
                    const angle = Math.PI + ( (valor / MAX_VAL) * Math.PI );
                    
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, -2);
                    ctx.lineTo(canvas.height - 40, 0);
                    ctx.lineTo(0, 2);
                    ctx.fillStyle = '#000';
                    ctx.fill();
                    ctx.restore();
                }
            }]
        });
    });
}

btnFiltrar.addEventListener('click', actualizarDashboard);
selectDocente.addEventListener('change', actualizarDashboard);
selectLab.addEventListener('change', actualizarDashboard);

// Iniciar
cargarEstadisticas();