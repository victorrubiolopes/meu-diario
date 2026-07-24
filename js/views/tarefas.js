const ViewTarefas = (() => {
  const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function isApplicable(task, dateISO) {
    switch (task.recurrence) {
      case 'daily': return true;
      case 'weekdays': return (task.weekdays || []).includes(Util.weekdayOf(dateISO));
      case 'interval': {
        if (dateISO < task.date) return false;
        return Util.daysBetween(task.date, dateISO) % task.intervalDays === 0;
      }
      default: return task.date === dateISO; // 'once'
    }
  }

  function isDone(taskId, date) {
    return Storage.getAll('tarefas_conclusoes').some(c => c.taskId === taskId && c.date === date);
  }

  function toggleDone(taskId, date) {
    const all = Storage.getAll('tarefas_conclusoes');
    const idx = all.findIndex(c => c.taskId === taskId && c.date === date);
    if (idx > -1) {
      all.splice(idx, 1);
    } else {
      all.push({ id: Storage.uid(), taskId, date });
    }
    Storage.saveAll('tarefas_conclusoes', all);
  }

  function render($app, state, api) {
    const allTasks = Storage.getAll('tarefas');
    const applicable = allTasks.filter(t => isApplicable(t, state.date));

    $app.innerHTML = `
      <div class="card">
        <h2>Nova tarefa</h2>
        <label>Título</label>
        <input type="text" id="task-title" placeholder="Ex: Ler pela manhã">
        <label>Repetição</label>
        <select id="task-recurrence">
          <option value="once">Em uma data específica</option>
          <option value="daily">Todos os dias</option>
          <option value="weekdays">Dias específicos da semana</option>
          <option value="interval">A cada X dias</option>
        </select>
        <div id="once-picker" style="margin-top:8px">
          <label>Data</label>
          <input type="date" id="task-date" value="${state.date}">
        </div>
        <div id="weekdays-picker" class="chip-group" style="display:none;margin-top:8px">
          ${WEEKDAY_LABELS.map((lbl, i) => `<button type="button" class="chip" data-weekday="${i}">${lbl}</button>`).join('')}
        </div>
        <div id="interval-picker" style="display:none;margin-top:8px">
          <label>A partir de qual data</label>
          <input type="date" id="interval-start-date" value="${state.date}">
          <label>A cada quantos dias</label>
          <input type="number" id="interval-days" min="2" value="2">
        </div>
        <button class="primary" id="add-task">Adicionar tarefa</button>
      </div>
      <div class="card">
        <h2>Tarefas de ${Util.fmtDate(state.date)}</h2>
        <div id="task-list">
          ${applicable.length === 0 ? '<div class="empty">Nenhuma tarefa para este dia</div>' : applicable.map(t => taskRow(t, state.date)).join('')}
        </div>
      </div>
    `;

    const recurrenceSelect = document.getElementById('task-recurrence');
    const oncePicker = document.getElementById('once-picker');
    const weekdaysPicker = document.getElementById('weekdays-picker');
    const intervalPicker = document.getElementById('interval-picker');
    const selectedWeekdays = new Set();

    recurrenceSelect.addEventListener('change', () => {
      oncePicker.style.display = recurrenceSelect.value === 'once' ? '' : 'none';
      weekdaysPicker.style.display = recurrenceSelect.value === 'weekdays' ? '' : 'none';
      intervalPicker.style.display = recurrenceSelect.value === 'interval' ? '' : 'none';
    });

    weekdaysPicker.querySelectorAll('[data-weekday]').forEach(chip => {
      chip.addEventListener('click', () => {
        const d = Number(chip.dataset.weekday);
        if (selectedWeekdays.has(d)) { selectedWeekdays.delete(d); chip.classList.remove('active'); }
        else { selectedWeekdays.add(d); chip.classList.add('active'); }
      });
    });

    document.getElementById('add-task').addEventListener('click', () => {
      const title = document.getElementById('task-title').value.trim();
      const recurrence = recurrenceSelect.value;
      if (!title) return;
      const task = { title, recurrence, date: state.date };
      if (recurrence === 'once') {
        task.date = document.getElementById('task-date').value || state.date;
      }
      if (recurrence === 'weekdays') {
        if (selectedWeekdays.size === 0) return;
        task.weekdays = [...selectedWeekdays];
      }
      if (recurrence === 'interval') {
        task.date = document.getElementById('interval-start-date').value || state.date;
        task.intervalDays = Math.max(2, Number(document.getElementById('interval-days').value) || 2);
      }
      Storage.add('tarefas', task);
      api.render();
    });

    $app.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleDone(btn.dataset.toggle, state.date);
        api.render();
      });
    });
    $app.querySelectorAll('[data-title-id]').forEach(input => {
      input.addEventListener('change', () => {
        Storage.update('tarefas', input.dataset.titleId, { title: input.value.trim() });
      });
    });
    $app.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.remove('tarefas', btn.dataset.delete);
        api.render();
      });
    });
  }

  function tagFor(t) {
    if (t.recurrence === 'daily') return 'diário';
    if (t.recurrence === 'weekdays') return (t.weekdays || []).slice().sort().map(d => WEEKDAY_LABELS[d]).join(', ');
    if (t.recurrence === 'interval') return `a cada ${t.intervalDays}d`;
    return '';
  }

  function taskRow(t, date) {
    const done = isDone(t.id, date);
    const tag = tagFor(t);
    return `
      <div class="task-item">
        <button class="task-check ${done ? 'done' : ''}" data-toggle="${t.id}">${done ? '✓' : ''}</button>
        <input type="text" value="${Util.escapeHtml(t.title)}" data-title-id="${t.id}" class="task-title ${done ? 'done' : ''}" style="border:none;background:none;padding:0">
        ${tag ? `<span class="task-tag">${tag}</span>` : ''}
        <button class="link" data-delete="${t.id}">✕</button>
      </div>
    `;
  }

  return { render, isApplicable };
})();
