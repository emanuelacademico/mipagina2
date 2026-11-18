// Cafetería Aroma & Ejercicios Propuestos - Semana 10

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. PROYECTO CAFETERÍA AROMA
  // ==========================================
  const formulario = document.querySelector('#frmPedido');
  const cliente = document.querySelector('#cliente');
  const producto = document.querySelector('#producto');
  const cantidad = document.querySelector('#cantidad');
  const nota = document.querySelector('#nota');
  const contadorNota = document.querySelector('#contadorNota');
  const subtotal = document.querySelector('#subtotal');
  const lista = document.querySelector('#listaPedidos');
  const plantilla = document.querySelector('#tplPedido');
  const vacio = document.querySelector('#vacio');
  const buscar = document.querySelector('#buscar');
  const filtros = document.querySelector('#filtros');
  const btnTema = document.querySelector('#btnTema');
  const aviso = document.querySelector('#aviso');
  const btnCancelar = document.querySelector('#btnCancelar');

  let pedidos = [];
  let filtroActual = 'todos';
  let siguienteId = 1;
  let idEdicion = null;

  // Variables para el ordenamiento de la tabla resumen
  let ordenColumna = 'producto';
  let ordenAscendente = true;

  const soles = (monto) => `S/ ${monto.toFixed(2)}`;

  function precioSeleccionado() {
    if (!producto || !producto.selectedOptions.length) return 0;
    const opcion = producto.selectedOptions[0];
    return opcion && opcion.dataset.precio ? Number(opcion.dataset.precio) : 0;
  }

  function actualizarSubtotal() {
    if (!subtotal || !cantidad) return;
    const cant = Number(cantidad.value) || 0;
    subtotal.textContent = soles(precioSeleccionado() * cant);
  }

  function mostrarAviso(texto) {
    if (!aviso) return; // Evita error si #aviso no está en el DOM
    aviso.textContent = texto;
    aviso.classList.add('visible');
    clearTimeout(mostrarAviso.timer);
    mostrarAviso.timer = setTimeout(() => aviso.classList.remove('visible'), 2000);
  }

  function marcarError(campo, idError, mensaje) {
    if (!campo) return true;
    const elErr = document.querySelector(idError);
    if (elErr) elErr.textContent = mensaje;
    campo.classList.toggle('invalido', Boolean(mensaje));
    return !mensaje;
  }

  function validar() {
    let valido = true;
    const cant = cantidad ? Number(cantidad.value) : 0;
    valido = marcarError(cliente, '#errCliente', cliente && cliente.value.trim().length < 3 ? 'Ingrese al menos 3 caracteres.' : '') && valido;
    valido = marcarError(producto, '#errProducto', producto && producto.value === '' ? 'Seleccione un producto.' : '') && valido;
    valido = marcarError(cantidad, '#errCantidad', !Number.isInteger(cant) || cant < 1 || cant > 20 ? 'La cantidad debe ser de 1 a 20.' : '') && valido;
    return valido;
  }

  function render() {
    const texto = buscar ? buscar.value.trim().toLowerCase() : '';
    const visibles = pedidos.filter(p => {
      const cumpleFiltro = filtroActual === 'todos' || (filtroActual === 'entregado' ? p.entregado : !p.entregado);
      const cumpleTexto = `${p.cliente} ${p.producto}`.toLowerCase().includes(texto);
      return cumpleFiltro && cumpleTexto;
    });

    if (lista) {
      lista.innerHTML = '';
      const fragmento = document.createDocumentFragment();

      visibles.forEach(p => {
        if (!plantilla) return;
        const nodo = plantilla.content.cloneNode(true);
        const li = nodo.querySelector('.pedido');
        if (li) {
          li.dataset.id = p.id;
          li.classList.toggle('entregado', p.entregado);
        }

        const elCliente = nodo.querySelector('.cliente');
        if (elCliente) elCliente.textContent = p.cliente;

        const elDetalle = nodo.querySelector('.detalle');
        if (elDetalle) elDetalle.textContent = `${p.cantidad} x ${p.producto} (${soles(p.precio)})`;

        const elNota = nodo.querySelector('.nota');
        if (elNota) elNota.textContent = p.nota ? `Nota: ${p.nota}` : '';

        const elImporte = nodo.querySelector('.importe');
        if (elImporte) elImporte.textContent = soles(p.precio * p.cantidad);

        const elBtnEstado = nodo.querySelector('.btn-estado');
        if (elBtnEstado) elBtnEstado.textContent = p.entregado ? 'Pendiente' : '✔ Entregar';

        fragmento.append(nodo);
      });

      lista.append(fragmento);
    }

    if (vacio) vacio.hidden = visibles.length > 0;
    actualizarResumen();
    renderTablaProductos();
  }

  function actualizarResumen() {
    const pendientes = pedidos.filter(p => !p.entregado).length;
    const venta = pedidos.reduce((suma, p) => suma + (p.precio * p.cantidad), 0);
    
    const elTotPedidos = document.querySelector('#totPedidos');
    const elTotPendientes = document.querySelector('#totPendientes');
    const elTotVenta = document.querySelector('#totVenta');

    if (elTotPedidos) elTotPedidos.textContent = pedidos.length;
    if (elTotPendientes) elTotPendientes.textContent = pendientes;
    if (elTotVenta) elTotVenta.textContent = soles(venta);
  }

  function renderTablaProductos() {
    const tbody = document.querySelector('#tblProductos tbody');
    if (!tbody) return;
    const resumen = {};

    pedidos.forEach(p => {
      if (!resumen[p.producto]) {
        resumen[p.producto] = { producto: p.producto, unidades: 0, importe: 0 };
      }
      resumen[p.producto].unidades += p.cantidad;
      resumen[p.producto].importe += (p.precio * p.cantidad);
    });

    let listaResumen = Object.values(resumen);

    // Ordenar la lista según la columna seleccionada
    listaResumen.sort((a, b) => {
      let valA = a[ordenColumna];
      let valB = b[ordenColumna];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return ordenAscendente ? -1 : 1;
      if (valA > valB) return ordenAscendente ? 1 : -1;
      return 0;
    });

    tbody.innerHTML = '';
    listaResumen.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.producto}</td><td class="num">${item.unidades}</td><td class="num">${soles(item.importe)}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Evento para ordenar la tabla al hacer clic en los encabezados
  const tablaHead = document.querySelector('#tblProductos thead');
  if (tablaHead) {
    tablaHead.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-col]');
      if (!th) return;
      const col = th.dataset.col;
      if (ordenColumna === col) {
        ordenAscendente = !ordenAscendente;
      } else {
        ordenColumna = col;
        ordenAscendente = true;
      }
      renderTablaProductos();
    });
  }

  if (formulario) {
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      if (!validar()) {
        const elInvalido = formulario.querySelector('.invalido');
        if (elInvalido) elInvalido.focus();
        return;
      }

      const datos = Object.fromEntries(new FormData(formulario));
      if (idEdicion !== null) {
        const p = pedidos.find(item => item.id === idEdicion);
        if (p) {
          p.cliente = datos.cliente.trim();
          p.producto = datos.producto;
          p.precio = precioSeleccionado();
          p.cantidad = Number(datos.cantidad);
          p.nota = datos.nota ? datos.nota.trim() : '';
        }
        idEdicion = null;
        if (btnCancelar) btnCancelar.hidden = true;
        const btnSub = formulario.querySelector('.btn-principal');
        if (btnSub) btnSub.textContent = 'Agregar pedido';
        mostrarAviso('Pedido actualizado');
      } else {
        pedidos.push({
          id: siguienteId++,
          cliente: datos.cliente.trim(),
          producto: datos.producto,
          precio: precioSeleccionado(),
          cantidad: Number(datos.cantidad),
          nota: datos.nota ? datos.nota.trim() : '',
          entregado: false
        });
        mostrarAviso(`Pedido de ${datos.cliente.trim()} registrado`);
      }

      formulario.reset();
      if (contadorNota && nota) contadorNota.textContent = `0 / ${nota.maxLength}`;
      actualizarSubtotal();
      render();
      if (cliente) cliente.focus();
    });
  }

  if (producto) producto.addEventListener('input', actualizarSubtotal);
  if (cantidad) cantidad.addEventListener('input', actualizarSubtotal);
  if (nota && contadorNota) {
    nota.addEventListener('input', () => {
      const largo = nota.value.length;
      contadorNota.textContent = `${largo} / ${nota.maxLength}`;
      contadorNota.classList.toggle('limite', largo > nota.maxLength - 5);
    });
  }

  if (buscar) buscar.addEventListener('input', render);

  if (lista) {
    lista.addEventListener('click', (evento) => {
      const boton = evento.target.closest('button[data-accion]');
      if (!boton) return;
      const elPedido = boton.closest('.pedido');
      if (!elPedido) return;
      const id = Number(elPedido.dataset.id);
      const pedido = pedidos.find(p => p.id === id);
      if (!pedido) return;

      if (boton.dataset.accion === 'entregar') {
        pedido.entregado = !pedido.entregado;
        render();
        mostrarAviso(pedido.entregado ? 'Pedido entregado' : 'Pedido marcado como pendiente');
      } else if (boton.dataset.accion === 'eliminar') {
        if (!confirm(`¿Eliminar el pedido de ${pedido.cliente}?`)) return;
        pedidos = pedidos.filter(p => p.id !== id);
        render();
        mostrarAviso('Pedido eliminado');
      } else if (boton.dataset.accion === 'editar') {
        idEdicion = pedido.id;
        if (cliente) cliente.value = pedido.cliente;
        if (producto) producto.value = pedido.producto;
        if (cantidad) cantidad.value = pedido.cantidad;
        if (nota) nota.value = pedido.nota;
        actualizarSubtotal();
        if (btnCancelar) btnCancelar.hidden = false;
        const btnSub = formulario.querySelector('.btn-principal');
        if (btnSub) btnSub.textContent = 'Guardar cambios';
        if (cliente) cliente.focus();
      }
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      idEdicion = null;
      if (formulario) formulario.reset();
      btnCancelar.hidden = true;
      const btnSub = formulario.querySelector('.btn-principal');
      if (btnSub) btnSub.textContent = 'Agregar pedido';
      actualizarSubtotal();
    });
  }

  if (filtros) {
    filtros.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.filtro');
      if (!boton) return;
      const act = filtros.querySelector('.activo');
      if (act) act.classList.remove('activo');
      boton.classList.add('activo');
      filtroActual = boton.dataset.filtro;
      render();
    });
  }

  if (btnTema) {
    btnTema.addEventListener('click', () => {
      const oscuro = document.body.classList.toggle('oscuro');
      btnTema.textContent = oscuro ? '☀️ Modo claro' : '🌙 Modo oscuro';
      btnTema.setAttribute('aria-pressed', String(oscuro));
    });
  }

  // ==========================================
  // 2. EJERCICIOS PROPUESTOS
  // ==========================================
  const tabsEj = document.querySelector('#tabsEj');
  const grupoBasico = document.querySelector('#grupo-basico');
  const grupoIntermedio = document.querySelector('#grupo-intermedio');

  if (tabsEj && grupoBasico && grupoIntermedio) {
    tabsEj.addEventListener('click', (e) => {
      const btn = e.target.closest('.filtro');
      if (!btn) return;
      tabsEj.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      const grupo = btn.dataset.grupo;
      grupoBasico.hidden = grupo !== 'basico';
      grupoIntermedio.hidden = grupo !== 'intermedio';
    });
  }

  // Básico 1: Fecha
  const btnFecha = document.querySelector('#btnFecha');
  const tituloFecha = document.querySelector('#tituloFecha');
  if (btnFecha && tituloFecha) {
    btnFecha.addEventListener('click', () => {
      tituloFecha.textContent = new Date().toLocaleString();
    });
  }

  // Básico 2: Galería de fotos
  const grande = document.querySelector('#grande');
  const captionGrande = document.querySelector('#captionGrande');
  const miniaturas = document.querySelector('#miniaturas');
  if (miniaturas && grande) {
    miniaturas.addEventListener('click', (e) => {
      const mini = e.target.closest('.mini');
      if (!mini) return;
      grande.src = mini.src;
      grande.alt = mini.dataset.alt || mini.alt;
      if (captionGrande) captionGrande.textContent = grande.alt;
      miniaturas.querySelectorAll('.mini').forEach(m => m.classList.remove('activo'));
      mini.classList.add('activo');
    });
  }

  // Básico 3: Semáforo interactivo
  const btnLuz = document.querySelector('#btnLuz');
  const luces = document.querySelectorAll('.semaforo .luz');
  let idxLuz = -1;
  if (btnLuz && luces.length > 0) {
    btnLuz.addEventListener('click', () => {
      luces.forEach(l => l.classList.remove('encendido'));
      idxLuz = (idxLuz + 1) % luces.length;
      luces[idxLuz].classList.add('encendido');
    });
  }

  // Básico 4: Saludo en vivo
  const nombreSaludo = document.querySelector('#nombreSaludo');
  const saludo = document.querySelector('#saludo');
  if (nombreSaludo && saludo) {
    nombreSaludo.addEventListener('input', () => {
      const v = nombreSaludo.value.trim();
      saludo.textContent = v ? `Hola, ${v}` : 'Hola, ...';
    });
  }

  // Intermedio 1: Lista de compras
  const frmCompra = document.querySelector('#frmCompra');
  const itemInput = document.querySelector('#item');
  const comprasLista = document.querySelector('#compras');
  const totalItems = document.querySelector('#totalItems');
  let cCount = 0;

  if (frmCompra && itemInput && comprasLista && totalItems) {
    frmCompra.addEventListener('submit', (e) => {
      e.preventDefault();
      const txt = itemInput.value.trim();
      if (!txt) return;
      const li = document.createElement('li');
      li.style.cssText = 'display:flex; justify-content:space-between; margin-top:6px; align-items:center;';
      li.innerHTML = `<span>${txt}</span> <button type="button" class="btn-del">🗑</button>`;
      comprasLista.appendChild(li);
      itemInput.value = '';
      cCount++;
      totalItems.textContent = cCount;
    });

    comprasLista.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-del')) {
        e.target.closest('li').remove();
        cCount--;
        totalItems.textContent = cCount;
      }
    });
  }

  // Intermedio 2: IGV
  const precioIn = document.querySelector('#precio');
  const cantIn = document.querySelector('#cant');
  function calcIGV() {
    if (!precioIn || !cantIn) return;
    const p = parseFloat(precioIn.value) || 0;
    const c = parseInt(cantIn.value) || 0;
    const sub = p * c;
    const igv = sub * 0.18;
    const elSub = document.querySelector('#rSub');
    const elIgv = document.querySelector('#rIgv');
    const elTot = document.querySelector('#rTot');
    if (elSub) elSub.textContent = soles(sub);
    if (elIgv) elIgv.textContent = soles(igv);
    if (elTot) elTot.textContent = soles(sub + igv);
  }
  if (precioIn && cantIn) {
    precioIn.addEventListener('input', calcIGV);
    cantIn.addEventListener('input', calcIGV);
  }

  // Intermedio 3: Acordeón
  const faqContainer = document.querySelector('#faq');
  if (faqContainer) {
    faqContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.pregunta');
      if (!btn) return;
      const resp = btn.nextElementSibling;
      const abierto = btn.getAttribute('aria-expanded') === 'true';

      faqContainer.querySelectorAll('.pregunta').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        if (b.nextElementSibling) b.nextElementSibling.hidden = true;
      });

      if (!abierto && resp) {
        btn.setAttribute('aria-expanded', 'true');
        resp.hidden = false;
      }
    });
  }

  // Intermedio 4: Validador de registro
  const frmReg = document.querySelector('#frmReg');
  if (frmReg) {
    const rNom = document.querySelector('#regNombre');
    const rCor = document.querySelector('#regCorreo');
    const rCla = document.querySelector('#regClave');
    const rCon = document.querySelector('#regConfirma');
    const btnReg = document.querySelector('#btnReg');
    const exito = document.querySelector('#exito');

    function valReg() {
      let ok = true;
      const setErr = (sel, msg) => {
        const el = frmReg.querySelector(sel);
        if (el) el.textContent = msg;
        if (msg) ok = false;
      };
      if (rNom) setErr('[data-err="nombre"]', rNom.value.trim().length < 3 ? 'Mínimo 3 caracteres.' : '');
      if (rCor) setErr('[data-err="correo"]', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rCor.value.trim()) ? 'Correo inválido.' : '');
      if (rCla) setErr('[data-err="clave"]', rCla.value.length < 6 ? 'Mínimo 6 caracteres.' : '');
      if (rCon && rCla) setErr('[data-err="confirma"]', rCon.value !== rCla.value || !rCon.value ? 'No coinciden.' : '');

      if (btnReg) btnReg.disabled = !ok;
      return ok;
    }

    frmReg.addEventListener('input', valReg);
    frmReg.addEventListener('submit', (e) => {
      e.preventDefault();
      if (valReg()) {
        if (exito) exito.textContent = '¡Cuenta creada con éxito!';
        frmReg.reset();
        if (btnReg) btnReg.disabled = true;
      }
    });
  }

  // Inicialización de la lista
  render();
});