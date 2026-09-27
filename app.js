const API_URL = 'https://script.google.com/macros/s/AKfycbwaG2eWIgappSD0RH8e_utJYZohc8hZOOBLIuxwdh5Q8jZm4TNI-daFDybuGOxbH_25/exec';

let token = localStorage.getItem('fc5token') || '';

let state = {
  players: [],
  pending: [],
  matches: [],
  knockout: [],
  config: {
    name: 'FC Championship 5.0',
    phase: 'FASE DE GRUPOS'
  }
};

const $ = id => document.getElementById(id);

async function api(action, data = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({
      action,
      token,
      ...data
    })
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.error || 'Erro inesperado.');
  }

  return result;
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function render() {
  const {
    players,
    pending,
    matches,
    knockout,
    config
  } = state;

  $('nPlayers').textContent = players.length;

  $('nMatches').textContent =
    matches.length +
    (knockout || []).filter(m => m.status === 'finished').length;

  $('nPending').textContent = pending.length;

  $('phase').textContent = config.phase;

  document.title = config.name;

  renderTables();
  renderPlayers();
  renderBracket();

  if (!$('panel').hidden) {
    renderAdmin();
  }
}

function renderPlayers() {
  $('players').innerHTML = state.players.length
    ? state.players.map(p => `
        <div class="card player">
          <div class="playerAvatar">
            ${esc((p.name || '?').charAt(0).toUpperCase())}
          </div>

          <div>
            <b>${esc(p.name)}</b>

            <small>
              ${esc(p.nick)} •
              ${esc(p.platform)} •
              Grupo ${esc(p.group)}
            </small>
          </div>
        </div>
      `).join('')
    : '<p class="empty">Nenhum jogador aprovado.</p>';
}

function getStandings(group) {
  const players = state.players.filter(
    player => player.group === group
  );

  return players.map(player => {

    const row = {
      p: player,
      j: 0,
      v: 0,
      e: 0,
      d: 0,
      gp: 0,
      gc: 0,
      sg: 0,
      pts: 0
    };

    state.matches
      .filter(match =>
        match.p1 === player.id ||
        match.p2 === player.id
      )
      .forEach(match => {

        const me =
          match.p1 === player.id
            ? Number(match.s1)
            : Number(match.s2);

        const opponent =
          match.p1 === player.id
            ? Number(match.s2)
            : Number(match.s1);

        row.j++;

        row.gp += me;
        row.gc += opponent;

        if (me > opponent) {
          row.v++;
          row.pts += 3;
        } else if (me === opponent) {
          row.e++;
          row.pts += 1;
        } else {
          row.d++;
        }
      });

    row.sg = row.gp - row.gc;

    return row;

  }).sort((a, b) =>
    b.pts - a.pts ||
    b.sg - a.sg ||
    b.gp - a.gp ||
    a.p.name.localeCompare(b.p.name)
  );
}

function renderTables() {

  const groups = ['A', 'B', 'C', 'D'];

  $('tabs').innerHTML = groups.map(
    (group, index) => `
      <button
        class="${index === 0 ? 'active' : ''}"
        onclick="showGroup('${group}', this)"
      >
        Grupo ${group}
      </button>
    `
  ).join('');

  showGroup(
    'A',
    $('tabs').firstElementChild
  );
}

function showGroup(group, button) {

  document
    .querySelectorAll('.tabs button')
    .forEach(item =>
      item.classList.remove('active')
    );

  if (button) {
    button.classList.add('active');
  }

  const rows = getStandings(group);

  $('tables').innerHTML = `
    <div class="tableWrap">

      <table class="table">

        <thead>
          <tr>
            <th>#</th>
            <th>Jogador</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>GP</th>
            <th>GC</th>
            <th>SG</th>
            <th>PTS</th>
          </tr>
        </thead>

        <tbody>

          ${
            rows.length
              ? rows.map((r, index) => `
                  <tr class="${index < 2 ? 'qualified' : ''}">

                    <td>
                      <b>${index + 1}</b>
                    </td>

                    <td>
                      ${esc(r.p.name)}
                      <small>${esc(r.p.nick)}</small>
                    </td>

                    <td>${r.j}</td>
                    <td>${r.v}</td>
                    <td>${r.e}</td>
                    <td>${r.d}</td>
                    <td>${r.gp}</td>
                    <td>${r.gc}</td>
                    <td>${r.sg}</td>

                    <td>
                      <b>${r.pts}</b>
                    </td>

                  </tr>
                `).join('')

              : `
                  <tr>
                    <td
                      colspan="10"
                      class="emptyCell"
                    >
                      Nenhum jogador neste grupo.
                    </td>
                  </tr>
                `
          }

        </tbody>

      </table>

    </div>
  `;
}

function stageTitle(stage) {

  return {
    QUARTAS: 'Quartas de final',
    SEMIFINAL: 'Semifinais',
    FINAL: 'Final'
  }[stage] || stage;

}

function renderBracket() {

  const stages = [
    'QUARTAS',
    'SEMIFINAL',
    'FINAL'
  ];

  const knockout = state.knockout || [];

  $('bracket').innerHTML =
    stages.map(stage => {

      const matches =
        knockout.filter(
          match => match.stage === stage
        );

      const content = matches.length

        ? matches.map(match => `
            <div
              class="match ${
                match.status === 'finished'
                  ? 'finished'
                  : ''
              }"
            >

              <div class="matchLabel">
                ${esc(
                  match.slot ||
                  stageTitle(stage)
                )}
              </div>

              <div
                class="knockoutPlayer ${
                  match.winnerId === match.p1
                    ? 'winner'
                    : ''
                }"
              >

                ${esc(
                  match.n1 ||
                  'A definir'
                )}

                <strong>
                  ${
                    match.status === 'finished'
                      ? match.s1
                      : '-'
                  }
                </strong>

              </div>

              <div
                class="knockoutPlayer ${
                  match.winnerId === match.p2
                    ? 'winner'
                    : ''
                }"
              >

                ${esc(
                  match.n2 ||
                  'A definir'
                )}

                <strong>
                  ${
                    match.status === 'finished'
                      ? match.s2
                      : '-'
                  }
                </strong>

              </div>

              ${
                match.status === 'finished' &&
                match.winnerName

                  ? `
                    <small class="winnerText">
                      Classificado:
                      ${esc(match.winnerName)}
                    </small>
                  `

                  : ''
              }

            </div>
          `).join('')

        : `
            <div class="match emptyMatch">
              <span>
                Aguardando classificação
              </span>
            </div>
          `;

      return `
        <div class="round">

          <h3>
            ${stageTitle(stage)}
          </h3>

          ${content}

        </div>
      `;

    }).join('');

  const champion =
    knockout.find(match =>
      match.stage === 'FINAL' &&
      match.status === 'finished' &&
      match.winnerName
    );

  const championBox =
    $('champion');

  if (championBox) {

    championBox.innerHTML =
      champion

        ? `
          <span>🏆 CAMPEÃO</span>
          <strong>
            ${esc(champion.winnerName)}
          </strong>
        `

        : '';
  }
}

function renderAdmin() {
const approvedBox = $('approvedPlayers');

if (approvedBox) {
  approvedBox.innerHTML = state.players.length
    ? state.players.map(p => `
        <div class="pendingItem playerAdminItem">
          <span>
            <b>${esc(p.name)}</b>
            <small>
              ${esc(p.nick)} •
              ${esc(p.platform)} •
              Grupo ${esc(p.group)}
            </small>
          </span>

          <button
            class="btn small danger"
            onclick="deletePlayer('${p.id}')"
          >
            🗑️ Excluir
          </button>
        </div>
      `).join('')
    : '<p class="empty">Nenhum jogador aprovado.</p>';
}
  $('summary').innerHTML = `

    <div>
      <b>${state.players.length}</b>
      <span>aprovados</span>
    </div>

    <div>
      <b>${state.pending.length}</b>
      <span>pendentes</span>
    </div>

    <div>
      <b>${state.matches.length}</b>
      <span>jogos de grupo</span>
    </div>

    <div>
      <b>${
        (state.knockout || [])
          .filter(m => m.status === 'finished')
          .length
      }</b>
      <span>mata-mata</span>
    </div>

  `;

  $('cfgName').value =
    state.config.name || '';

  $('cfgPhase').value =
    state.config.phase || '';

  $('pending').innerHTML =
    state.pending.length

      ? state.pending.map(p => `

          <div class="pendingItem">

            <span>

              <b>
                ${esc(p.name)}
              </b>

              <small>
                ${esc(p.nick)} •
                ${esc(p.platform)} •
                Grupo ${esc(p.group)}
              </small>

            </span>

            <span>

              <button
                class="btn small"
                onclick="approve('${p.id}')"
              >
                Aprovar
              </button>

              <button
                class="btn small danger"
                onclick="reject('${p.id}')"
              >
                Recusar
              </button>

            </span>

          </div>

        `).join('')

      : `
        <p class="empty">
          Nenhuma inscrição pendente.
        </p>
      `;

  const opts =
    state.players.map(p => `
      <option value="${p.id}">
        ${esc(p.name)}
        — Grupo ${esc(p.group)}
      </option>
    `).join('');

  $('p1').innerHTML =
    `<option value="">Selecione...</option>${opts}`;

  $('p2').innerHTML =
    `<option value="">Selecione...</option>${opts}`;

  $('results').innerHTML =
    state.matches
      .slice()
      .reverse()
      .map(m => `

        <div class="resultItem">

          <span>

            <b>
              ${esc(m.n1)}
            </b>

            <strong>
              ${m.s1} × ${m.s2}
            </strong>

            <b>
              ${esc(m.n2)}
            </b>

          </span>

          <button
            class="btn small danger"
            onclick="delMatch('${m.id}')"
          >
            Excluir
          </button>

        </div>

      `).join('')

      || `
        <p class="empty">
          Nenhum resultado registrado.
        </p>
      `;

  renderKnockoutAdmin();
}

function renderKnockoutAdmin() {

  const box =
    $('knockoutAdmin');

  if (!box) return;

  const ko =
    state.knockout || [];

  box.innerHTML = `

    <div class="adminActionRow">

      <button
        class="btn"
        onclick="generateKnockout()"
      >
        🏆 Gerar mata-mata
      </button>

      <button
        class="btn secondary"
        onclick="refreshData()"
      >
        🔄 Atualizar
      </button>

      ${
        ko.length

          ? `
            <button
              class="btn danger"
              onclick="resetKnockout()"
            >
              ♻️ Resetar mata-mata
            </button>
          `

          : ''
      }

    </div>

    <p class="hint">
      Os 2 primeiros de cada grupo avançam.
      O sistema cria quartas, semifinais e final
      automaticamente.
    </p>

    ${
      ko.length

        ? ko.map(m => `

            <div class="koAdminItem">

              <div>

                <b>
                  ${stageTitle(m.stage)}
                  —
                  ${esc(m.slot)}
                </b>

                <small>
                  ${esc(m.n1 || 'A definir')}
                  ×
                  ${esc(m.n2 || 'A definir')}
                </small>

              </div>

              ${
                m.status === 'finished'

                  ? `
                    <span class="statusDone">
                      Finalizado:
                      ${esc(m.winnerName || '')}
                    </span>
                  `

                  : (
                    m.p1 && m.p2

                      ? `
                        <button
                          class="btn small"
                          onclick="openKoScore('${m.id}')"
                        >
                          Lançar placar
                        </button>
                      `

                      : `
                        <span class="statusWaiting">
                          Aguardando confronto
                        </span>
                      `
                  )
              }

            </div>

          `).join('')

        : ''
    }

  `;
}

function openKoScore(id) {

  const match =
    (state.knockout || [])
      .find(m => m.id === id);

  if (!match) return;

  const s1 =
    prompt(
      `Placar de ${match.n1}:`,
      '0'
    );

  if (s1 === null) return;

  const s2 =
    prompt(
      `Placar de ${match.n2}:`,
      '0'
    );

  if (s2 === null) return;

  const score1 =
    Number(s1);

  const score2 =
    Number(s2);

  if (
    !Number.isInteger(score1) ||
    !Number.isInteger(score2) ||
    score1 < 0 ||
    score2 < 0
  ) {

    alert(
      'Digite placares inteiros maiores ou iguais a zero.'
    );

    return;
  }

  if (score1 === score2) {

    alert(
      'No mata-mata não pode haver empate. Informe o placar final após os pênaltis.'
    );

    return;
  }

  submitKoScore(
    id,
    score1,
    score2
  );
}

async function submitKoScore(
  id,
  s1,
  s2
) {

  try {

    const result =
      await api(
        'addKnockoutResult',
        { id, s1, s2 }
      );

    state =
      result.data;

    render();

  } catch (error) {

    alert(
      error.message
    );
  }
}

async function generateKnockout() {

  if (
    !confirm(
      'Gerar o mata-mata com os 2 primeiros de cada grupo?'
    )
  ) return;

  try {

    const result =
      await api(
        'generateKnockout'
      );

    state =
      result.data;

    render();

    alert(
      'Mata-mata gerado com sucesso.'
    );

  } catch (error) {

    alert(
      error.message
    );
  }
}

async function resetKnockout() {

  if (
    !confirm(
      'Isso apagará os confrontos e resultados do mata-mata. Continuar?'
    )
  ) return;

  try {

    const result =
      await api(
        'resetKnockout'
      );

    state =
      result.data;

    render();

  } catch (error) {

    alert(
      error.message
    );
  }
}

async function refreshData() {

  try {

    const result =
      await api(
        token
          ? 'adminData'
          : 'publicData'
      );

    state =
      result.data;

    render();

  } catch (error) {

    if (token) {

      localStorage.removeItem(
        'fc5token'
      );

      token = '';

      $('login').hidden =
        false;

      $('panel').hidden =
        true;
    }

    alert(
      error.message
    );
  }
}

async function load() {

  try {

    const result =
      await api(
        'publicData'
      );

    state =
      result.data;

    render();

  } catch (error) {

    $('signupMsg').textContent =
      error.message;
  }
}

$('signup').onsubmit =
  async event => {

    event.preventDefault();

    try {

      await api(
        'register',
        {
          player: {
            name:
              $('name').value.trim(),

            nick:
              $('nick').value.trim(),

            whatsapp:
              $('whatsapp').value.trim(),

            platform:
              $('platform').value,

            team:
              $('team').value.trim()
          }
        }
      );

      $('signup').reset();

      $('signupMsg').textContent =
        'Inscrição enviada! Aguarde a aprovação do administrador.';

      await load();

    } catch (error) {

      $('signupMsg').textContent =
        error.message;
    }
  };

$('loginBtn').onclick =
  async () => {

    try {

      const result =
        await api(
          'login',
          {
            password:
              $('pass').value
          }
        );

      token =
        result.token;

      localStorage.setItem(
        'fc5token',
        token
      );

      $('login').hidden =
        true;

      $('panel').hidden =
        false;

      $('loginMsg').textContent =
        '';

      state =
        result.data;

      render();

    } catch (error) {

      $('loginMsg').textContent =
        error.message;
    }
  };

$('logout').onclick =
  () => {

    localStorage.removeItem(
      'fc5token'
    );

    token = '';

    $('login').hidden =
      false;

    $('panel').hidden =
      true;
  };

$('saveCfg').onclick =
  async () => {

    try {

      const result =
        await api(
          'saveConfig',
          {
            config: {

              name:
                $('cfgName').value.trim() ||
                'FC Championship 5.0',

              phase:
                $('cfgPhase').value.trim() ||
                'FASE DE GRUPOS'
            }
          }
        );

      state =
        result.data;

      render();

      alert(
        'Configuração salva.'
      );

    } catch (error) {

      alert(
        error.message
      );
    }
  };

$('result').onsubmit =
  async event => {

    event.preventDefault();

    const p1 =
      $('p1').value;

    const p2 =
      $('p2').value;

    const s1 =
      Number(
        $('s1').value
      );

    const s2 =
      Number(
        $('s2').value
      );

    if (!p1 || !p2) {

      alert(
        'Selecione os dois jogadores.'
      );

      return;
    }

    if (
      p1 === p2
    ) {

      alert(
        'Escolha jogadores diferentes.'
      );

      return;
    }

    if (
      !Number.isInteger(s1) ||
      !Number.isInteger(s2) ||
      s1 < 0 ||
      s2 < 0
    ) {

      alert(
        'Digite placares válidos.'
      );

      return;
    }

    try {

      const result =
        await api(
          'addMatch',
          {
            p1,
            p2,
            s1,
            s2
          }
        );

      state =
        result.data;

      $('result').reset();

      render();

    } catch (error) {

      alert(
        error.message
      );
    }
  };

async function approve(id) {

  try {

    const result =
      await api(
        'approve',
        { id }
      );

    state =
      result.data;

    render();

  } catch (error) {

    alert(
      error.message
    );
  }
}

async function reject(id) {

  if (
    !confirm(
      'Recusar esta inscrição?'
    )
  ) return;

  try {

    const result =
      await api(
        'reject',
        { id }
      );

    state =
      result.data;

    render();

  } catch (error) {

    alert(
      error.message
    );
  }
}

async function delMatch(id) {
async function deletePlayer(id) {
  const player = state.players.find(p => p.id === id);

  if (!player) return;

  if (!confirm(
    `Excluir o jogador ${player.name}?\n\n` +
    `Essa ação removerá a inscrição da lista de jogadores.`
  )) {
    return;
  }

  try {
    const result = await api('deletePlayer', { id });

    state = result.data;

    render();

  } catch (error) {
    alert(error.message);
  }
}
  if (
    !confirm(
      'Excluir este resultado? A classificação será recalculada.'
    )
  ) return;

  try {

    const result =
      await api(
        'deleteMatch',
        { id }
      );

    state =
      result.data;

    render();

  } catch (error) {

    alert(
      error.message
    );
  }
}

$('menu').onclick =
  () =>
    document
      .querySelector('nav')
      .classList.toggle('open');

load();

setInterval(
  () => {

    if (
      document.visibilityState ===
      'visible'
    ) {

      refreshData()
        .catch(() => {});

    }

  },
  30000
);
