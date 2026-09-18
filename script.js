(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'geotec-asignaciones-v5';
  const OLD_KEY = 'geotec-asignaciones-v4';
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const today = () => new Date().toLocaleDateString('en-CA');
  let mode = 'vehicle';
  let state = {
    vehicle: { fecha: today(), modelo: 'HILUX 2.4 DEX', patente: '', interno: '', people: [{ nombre: '', cargo: 'Supervisor', rut: '' }] },
    tablet: { folio: '', fecha: today(), marca: 'Ulefone', modelo: 'Armor Pad 3 Pro', serie: '3120RF1010009360', valor: '$547.200', nombre: '', rut: '', cargo: 'Supervisor' },
    radio: { fecha: today(), modelo: '', serie: '', people: [{ nombre: '', cargo: 'Supervisor', rut: '' }] }
  };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY));
    if (saved) state = {
      vehicle: { ...state.vehicle, ...saved.vehicle },
      tablet: { ...state.tablet, ...saved.tablet },
      radio: { ...state.radio, ...saved.radio }
    };
  } catch (error) { console.warn('No se pudieron recuperar los datos guardados.', error); }
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const cleanRut = value => value.toUpperCase().replace(/[^0-9K]/g, '').slice(0, 9);
  const fmtRut = value => {
    const rut = cleanRut(value);
    if (rut.length < 2) return rut;
    return rut.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + rut.at(-1);
  };
  const validRut = value => {
    const rut = cleanRut(value);
    if (rut.length < 8) return false;
    let sum = 0, multiplier = 2;
    for (let i = rut.length - 2; i >= 0; i--) {
      sum += Number(rut[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const result = 11 - (sum % 11);
    const digit = result === 11 ? '0' : result === 10 ? 'K' : String(result);
    return digit === rut.at(-1);
  };
  const fmtPlate = value => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    return clean.length > 4 ? clean.slice(0, 4) + '-' + clean.slice(4) : clean;
  };
  const fmtDate = value => {
    const [year, month, day] = (value || '').split('-').map(Number);
    return year && month && day ? `${day} de ${months[month - 1]} de ${year}` : '';
  };
  function buildPeople(group, boxId, prefix) {
    const box = $(boxId);
    box.innerHTML = '';
    state[group].people.forEach((person, index) => {
      const item = document.createElement('div');
      item.className = 'person';
      item.innerHTML = `<small>${prefix} ${index + 1}</small>${state[group].people.length > 1 ? '<button class="remove" type="button">×</button>' : ''}<div class="grid"><label class="full">Nombre completo <b>*</b><input data-k="nombre" value="${esc(person.nombre)}"></label><label>Cargo <b>*</b><input data-k="cargo" value="${esc(person.cargo)}"></label><label>RUT <b>*</b><input data-k="rut" value="${esc(person.rut)}" placeholder="15.596.039-6"></label></div>`;
      item.querySelectorAll('input').forEach(input => {
        input.oninput = () => {
          let value = input.value;
          if (input.dataset.k === 'rut') { value = fmtRut(value); input.value = value; }
          person[input.dataset.k] = value;
          input.classList.remove('invalid');
          save();
          render();
        };
      });
      const remove = item.querySelector('.remove');
      if (remove) remove.onclick = () => {
        state[group].people.splice(index, 1);
        save();
        buildPeople(group, boxId, prefix);
        render();
      };
      box.appendChild(item);
    });
  }
  const peopleRows = list => list.map(person => `<tr><td>${esc(person.nombre) || '&nbsp;'}</td><td>${esc(person.cargo) || '&nbsp;'}</td><td>${esc(person.rut) || '&nbsp;'}</td><td>&nbsp;</td></tr>`).join('');
  function render() {
    const vehicle = state.vehicle, tablet = state.tablet, radio = state.radio;
    $('pv-fecha').textContent = fmtDate(vehicle.fecha);
    $('pv-modelo').textContent = vehicle.modelo || '—';
    $('pv-patente').textContent = vehicle.patente || '—';
    $('pv-interno').textContent = vehicle.interno || '—';
    $('vehicle-table').innerHTML = peopleRows(vehicle.people);
    $('pt-fecha-larga').textContent = fmtDate(tablet.fecha);
    ['folio','marca','modelo','serie','nombre','rut'].forEach(key => {
      const element = $('pt-' + key);
      if (element) element.textContent = tablet[key] || '—';
    });
    document.querySelectorAll('.pt-folio-copy').forEach(element => element.textContent = tablet.folio || '—');
    $('pt-firma-nombre').textContent = tablet.nombre || 'Trabajador';
    $('pt-firma-rut').textContent = tablet.rut || 'RUT';
    $('pt-firma-cargo').textContent = tablet.cargo || 'Cargo';
    $('pt-valor').textContent = tablet.valor || '—';
    $('pr-fecha').textContent = fmtDate(radio.fecha);
    $('pr-modelo').textContent = radio.modelo || '—';
    $('pr-serie').textContent = radio.serie || '—';
    $('radio-table').innerHTML = peopleRows(radio.people);
  }
  const binds = [
    ['v-fecha','vehicle','fecha'], ['v-modelo','vehicle','modelo'], ['v-interno','vehicle','interno'],
    ['t-folio','tablet','folio'], ['t-fecha','tablet','fecha'], ['t-marca','tablet','marca'], ['t-modelo','tablet','modelo'], ['t-serie','tablet','serie'], ['t-valor','tablet','valor'], ['t-nombre','tablet','nombre'], ['t-cargo','tablet','cargo'],
    ['r-fecha','radio','fecha'], ['r-modelo','radio','modelo'], ['r-serie','radio','serie']
  ];
  binds.forEach(([id, group, key]) => {
    $(id).value = state[group][key];
    $(id).oninput = () => {
      state[group][key] = $(id).value;
      $(id).classList.remove('invalid');
      save();
      render();
    };
  });
  $('v-patente').value = state.vehicle.patente;
  $('v-patente').oninput = () => {
    state.vehicle.patente = fmtPlate($('v-patente').value);
    $('v-patente').value = state.vehicle.patente;
    save();
    render();
  };
  $('t-rut').value = state.tablet.rut;
  $('t-rut').oninput = () => {
    state.tablet.rut = fmtRut($('t-rut').value);
    $('t-rut').value = state.tablet.rut;
    save();
    render();
  };
  function switchMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll('.mode').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    document.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== mode);
    ['vehicle','tablet','radio'].forEach(name => {
      const doc = $(name + '-doc');
      doc.hidden = name !== mode;
      doc.classList.toggle('active-doc', name === mode);
    });
    $('preview-title').textContent = { vehicle:'Asignación de camioneta', tablet:'Asignación de tablet', radio:'Asignación de radio' }[mode];
    $('alert').hidden = true;
    scale();
  }
  document.querySelectorAll('.mode').forEach(button => button.onclick = () => switchMode(button.dataset.mode));
  function addPerson(group, boxId, prefix) {
    state[group].people.push({ nombre:'', cargo:'Supervisor', rut:'' });
    save();
    buildPeople(group, boxId, prefix);
    render();
  }
  $('add-person').onclick = () => addPerson('vehicle', 'people-list', 'PERSONA');
  $('add-radio-person').onclick = () => addPerson('radio', 'radio-people-list', 'USUARIO');
  function syncTablet() {
    [['folio','t-folio'],['fecha','t-fecha'],['marca','t-marca'],['modelo','t-modelo'],['serie','t-serie'],['valor','t-valor'],['nombre','t-nombre'],['rut','t-rut'],['cargo','t-cargo']].forEach(([key,id]) => state.tablet[key] = $(id).value);
    save();
    render();
  }
  function requireFields(fields, missing) {
    fields.forEach(([id, name]) => {
      if (!$(id).value.trim()) { missing.push(name); $(id).classList.add('invalid'); }
    });
  }
  function validatePeople(group, boxId, label, missing) {
    state[group].people.forEach((person, index) => {
      const inputs = $(boxId).children[index].querySelectorAll('input');
      ['nombre','cargo','rut'].forEach((key, inputIndex) => {
        if (!person[key].trim() || (key === 'rut' && !validRut(person[key]))) {
          missing.push(`${key === 'rut' ? 'RUT válido' : key} ${label} ${index + 1}`);
          inputs[inputIndex].classList.add('invalid');
        }
      });
    });
  }
  function validate() {
    if (mode === 'tablet') syncTablet();
    document.querySelectorAll('.invalid').forEach(element => element.classList.remove('invalid'));
    const missing = [];
    if (mode === 'vehicle') {
      requireFields([['v-fecha','Fecha'],['v-modelo','Modelo'],['v-patente','Patente'],['v-interno','N° interno']], missing);
      validatePeople('vehicle', 'people-list', 'persona', missing);
    } else if (mode === 'tablet') {
      requireFields([['t-folio','Folio'],['t-fecha','Fecha'],['t-marca','Marca'],['t-modelo','Modelo'],['t-serie','Serie'],['t-valor','Valor'],['t-nombre','Nombre'],['t-cargo','Cargo']], missing);
      if (!validRut(state.tablet.rut)) { missing.push('RUT válido'); $('t-rut').classList.add('invalid'); }
    } else {
      requireFields([['r-fecha','Fecha'],['r-modelo','Modelo'],['r-serie','Serie']], missing);
      validatePeople('radio', 'radio-people-list', 'usuario', missing);
    }
    $('alert').hidden = !missing.length;
    $('alert').textContent = missing.length ? 'Revisa: ' + missing.join(', ') + '.' : '';
    return !missing.length;
  }
  $('print').onclick = () => { if (validate()) { render(); window.print(); } };
  $('clear').onclick = () => {
    if (!confirm('¿Limpiar los datos de esta asignación?')) return;
    if (mode === 'vehicle') state.vehicle = { fecha:today(), modelo:'HILUX 2.4 DEX', patente:'', interno:'', people:[{ nombre:'', cargo:'Supervisor', rut:'' }] };
    if (mode === 'tablet') state.tablet = { folio:'', fecha:today(), marca:'Ulefone', modelo:'Armor Pad 3 Pro', serie:'3120RF1010009360', valor:'$547.200', nombre:'', rut:'', cargo:'Supervisor' };
    if (mode === 'radio') state.radio = { fecha:today(), modelo:'', serie:'', people:[{ nombre:'', cargo:'Supervisor', rut:'' }] };
    save();
    location.reload();
  };
  $('pdf').onclick = async () => {
    if (!validate()) return;
    const button = $('pdf');
    button.disabled = true;
    button.textContent = 'Generando PDF…';
    try {
      render();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!window.html2canvas || !window.jspdf) throw new Error('Librerías PDF no disponibles');
      const pages = mode === 'tablet' ? [...document.querySelectorAll('#tablet-doc .tablet-page')] : [$(mode + '-doc')];
      const pdf = new window.jspdf.jsPDF({ unit:'pt', format:'letter', compress:true });
      for (let index = 0; index < pages.length; index++) {
        const canvas = await window.html2canvas(pages[index], { scale:2.2, backgroundColor:'#fff', useCORS:true, logging:false, width:816, height:1056, windowWidth:1200 });
        if (index) pdf.addPage('letter', 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', .97), 'JPEG', 0, 0, 612, 792, undefined, 'FAST');
      }
      let filename = '';
      if (mode === 'vehicle') filename = `ASIGNACION_CAMIONETA_${state.vehicle.patente.replace(/\W/g,'')}_${state.vehicle.interno}.pdf`;
      if (mode === 'tablet') filename = `ASIGNACION_TABLET_${state.tablet.serie.replace(/\W/g,'')}_${state.tablet.rut.replace(/\W/g,'')}.pdf`;
      if (mode === 'radio') filename = `ASIGNACION_RADIO_${state.radio.serie.replace(/\W/g,'')}.pdf`;
      pdf.save(filename);
      $('status').textContent = mode === 'tablet' ? 'PDF de 2 páginas generado correctamente.' : 'PDF generado correctamente.';
    } catch (error) {
      console.error(error);
      $('alert').hidden = false;
      $('alert').textContent = 'No se pudo generar el PDF. Actualiza la página y verifica tu conexión.';
    } finally {
      button.disabled = false;
      button.textContent = '↓ Generar PDF';
    }
  };
  function scale() {
    const activeDocument = document.querySelector('.active-doc');
    if (!activeDocument) return;
    if (innerWidth > 640) {
      activeDocument.style.transform = '';
      activeDocument.parentElement.style.height = '';
      return;
    }
    const factor = (innerWidth - 24) / 816;
    const naturalHeight = mode === 'tablet' ? 2134 : 1056;
    activeDocument.style.transform = `scale(${factor})`;
    activeDocument.parentElement.style.height = `${naturalHeight * factor + 70}px`;
  }
  addEventListener('resize', scale);
  buildPeople('vehicle', 'people-list', 'PERSONA');
  buildPeople('radio', 'radio-people-list', 'USUARIO');
  render();
  switchMode('vehicle');
})();
