<script setup>
import { auditApi } from '@/api/endpoints/audit';
import { getTenantId } from '@/api/tenant-context';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import AuditDetalheModal from './AuditDetalheModal.vue';

const TIMEZONE = 'America/Recife';

const NOMES_ENTIDADES = {
  'App\\Models\\Usuario': 'Usuário',
  'App\\Models\\UsuarioPerfil': 'Perfis do Usuário',
  'App\\Models\\Perfil': 'Perfil',
  'App\\Models\\Organizacao': 'Organização',
  'App\\Models\\Modulo': 'Módulo',
  'App\\Models\\ModuloOrganizacao': 'Módulo da Organização',
  'App\\Models\\Menu': 'Menu',
  'App\\Models\\Permissao': 'Permissão',
};

const toast = useToast();

const itens = ref([]);
const loading = ref(false);

// Controle do Modal de Detalhes (somente leitura)
const detalheVisible = ref(false);
const registroSelecionado = ref(null);

// Paginação reativa (padrão 5 por página)
const first = ref(0);
const rows = ref(5);
const rowsPerPageOptions = [5, 10, 25, 50, 100, 999999];

// Filtros
const filtroAcao = ref(null);
const filtroUsuarioId = ref(null);
const filtroEntidade = ref(null);
const dataInicio = ref(null);
const dataFim = ref(null);

const opcoesAcao = [
  { label: 'Todas as ações', value: null },
  { label: 'Criou', value: 'criou' },
  { label: 'Atualizou', value: 'atualizou' },
  { label: 'Deletou', value: 'deletou' },
  { label: 'Login', value: 'login' },
];

const opcoesEntidade = computed(() => {
  const entidadesPresentes = Array.from(
    new Set([
      ...Object.keys(NOMES_ENTIDADES),
      ...itens.value.map((i) => i.entidade).filter(Boolean),
    ]),
  );

  return [
    { label: 'Todas as entidades', value: null },
    ...entidadesPresentes.map((entidade) => ({
      label: formatarEntidade(entidade),
      value: entidade,
    })),
  ];
});

const filters = ref({
  global: { value: null, matchMode: 'contains' },
});

const globalFilterFields = [
  'id',
  'acao',
  'entidade',
  'registro_id',
  'usuario_nome',
  'usuario.nome',
  'usuario_id',
  'ip',
];

function obterValorPorCaminho(objeto, caminho) {
  return caminho.split('.').reduce((acc, chave) => acc?.[chave], objeto);
}

const totalRegistros = computed(() => {
  const termo = String(filters.value?.global?.value ?? '').trim().toLowerCase();

  if (!termo) {
    return itens.value.length;
  }

  return itens.value.filter((item) =>
    globalFilterFields.some((campo) =>
      String(obterValorPorCaminho(item, campo) ?? '').toLowerCase().includes(termo),
    ),
  ).length;
});

const contadorPaginacao = computed(() => {
  const total = totalRegistros.value;

  if (total <= 0) {
    return { inicio: 0, fim: 0, total: 0 };
  }

  const inicio = Math.min(first.value + 1, total);
  const fim = Math.min(first.value + rows.value, total);

  return { inicio, fim, total };
});

watch(
  () => filters.value?.global?.value,
  () => {
    first.value = 0;
  },
);

function formatarData(valor) {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleString('pt-BR', { timeZone: TIMEZONE });
}

function formatarEntidade(entidade) {
  if (!entidade) return '-';
  if (NOMES_ENTIDADES[entidade]) return NOMES_ENTIDADES[entidade];
  const partes = String(entidade).split('\\');
  return partes[partes.length - 1] || entidade;
}

function nomeUsuario(item) {
  return (
    item?.usuario_nome ??
    item?.usuario?.nome ??
    (item?.usuario_id ? `Usuário #${item.usuario_id}` : 'Sistema')
  );
}

function resumoAlteracao(item) {
  if (item?.acao === 'login') return 'Acesso autenticado';
  if (item?.acao === 'criou') return 'Novo registro';
  if (item?.acao === 'deletou') return 'Registro removido';

  if (item?.acao === 'atualizou') {
    const antigos = item?.dados_antigos ?? {};
    const novos = item?.dados_novos ?? {};
    const chaves = Array.from(new Set([...Object.keys(antigos), ...Object.keys(novos)])).filter(
      (k) => k !== 'updated_at' && k !== 'created_at',
    );

    const alterados = chaves.filter((campo) => {
      const a = antigos[campo];
      const n = novos[campo];
      return JSON.stringify(a) !== JSON.stringify(n);
    });

    if (alterados.length === 0) return 'Sem diff de campos';
    return alterados.length === 1
      ? `Campo: ${alterados[0]}`
      : `${alterados.length} campos: ${alterados.slice(0, 2).join(', ')}${alterados.length > 2 ? '…' : ''}`;
  }

  return '-';
}

function severidadeAcao(acao) {
  switch (String(acao).toLowerCase()) {
    case 'criou':
      return 'success';
    case 'atualizou':
      return 'info';
    case 'deletou':
      return 'danger';
    case 'login':
      return 'secondary';
    default:
      return 'contrast';
  }
}

async function carregar() {
  loading.value = true;
  try {
    const params = {};
    if (filtroAcao.value) params.acao = filtroAcao.value;
    if (filtroEntidade.value) params.entidade = filtroEntidade.value;
    if (filtroUsuarioId.value) params.usuario_id = Number(filtroUsuarioId.value);
    if (dataInicio.value) params.data_inicio = dataInicio.value;
    if (dataFim.value) params.data_fim = dataFim.value;

    const tenantId = getTenantId();
    if (tenantId) {
      params.organizacao_id = tenantId;
    }

    const res = await auditApi.list(params);
    itens.value = res.data ?? [];
    first.value = 0;
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

function limparFiltros() {
  filtroAcao.value = null;
  filtroEntidade.value = null;
  filtroUsuarioId.value = null;
  dataInicio.value = null;
  dataFim.value = null;
  filters.value.global.value = null;
  carregar();
}

function verDetalhe(item) {
  registroSelecionado.value = item;
  detalheVisible.value = true;
}

onMounted(carregar);
</script>

<template>
  <div class="card">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
      <div>
        <h2 class="text-2xl font-medium">Auditoria do Sistema</h2>
        <span class="text-sm text-surface-500">Consulta de histórico de alterações e acessos (somente leitura)</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <InputNumber
          v-model="filtroUsuarioId"
          :useGrouping="false"
          :min="1"
          placeholder="ID Usuário"
          class="w-32"
          @keydown.enter="carregar"
          v-tooltip.top="'Filtrar por ID do usuário e pressionar Enter'"
        />

        <Select
          v-model="filtroEntidade"
          :options="opcoesEntidade"
          optionLabel="label"
          optionValue="value"
          placeholder="Entidade"
          class="w-44"
          filter
          @update:modelValue="carregar"
          v-tooltip.top="'Filtrar por entidade'"
        />

        <Select
          v-model="filtroAcao"
          :options="opcoesAcao"
          optionLabel="label"
          optionValue="value"
          placeholder="Ação"
          class="w-36"
          @update:modelValue="carregar"
          v-tooltip.top="'Filtrar por tipo de ação'"
        />

        <InputText
          v-model="dataInicio"
          type="date"
          class="w-38"
          @change="carregar"
          v-tooltip.top="'Data inicial (UTC-3)'"
        />

        <InputText
          v-model="dataFim"
          type="date"
          class="w-38"
          @change="carregar"
          v-tooltip.top="'Data final (UTC-3)'"
        />

        <Button
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          @click="limparFiltros"
          v-tooltip.top="'Limpar filtros'"
        />

        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="carregar"
          :loading="loading"
          v-tooltip.top="'Recarregar dados'"
        />
      </div>
    </div>

    <DataTable
      :value="itens"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="globalFilterFields"
      dataKey="id"
      paginator
      v-model:first="first"
      v-model:rows="rows"
      :rowsPerPageOptions="rowsPerPageOptions"
      responsiveLayout="scroll"
    >
      <template #paginatorstart>
        <span class="text-sm text-surface-500">
          Mostrando de
          <span class="font-semibold">{{ contadorPaginacao.inicio }}</span>
          até
          <span class="font-semibold">{{ contadorPaginacao.fim }}</span>
          de
          <span class="font-semibold">{{ contadorPaginacao.total }}</span>
          registros
        </span>
      </template>

      <template #header>
        <div class="flex justify-end">
          <InputText v-model="filters['global'].value" placeholder="Pesquisar..." />
        </div>
      </template>

      <template #empty>
        <div class="text-center py-6 text-muted-color">Nenhum registro de auditoria encontrado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 4.5rem" />

      <Column field="created_at" header="Data/Hora" sortable style="width: 12rem">
        <template #body="{ data }">
          <span>{{ formatarData(data.created_at) }}</span>
        </template>
      </Column>

      <Column field="usuario_nome" header="Usuário" sortable style="width: 12rem">
        <template #body="{ data }">
          <span v-tooltip.top="data.usuario_id ? `ID: ${data.usuario_id}` : 'Sem usuário'">
            {{ nomeUsuario(data) }}
          </span>
        </template>
      </Column>

      <Column field="acao" header="Ação" sortable style="width: 7.5rem">
        <template #body="{ data }">
          <Tag :severity="severidadeAcao(data.acao)" :value="String(data.acao ?? '').toUpperCase()" />
        </template>
      </Column>

      <Column field="entidade" header="Entidade" sortable style="width: 11rem">
        <template #body="{ data }">
          <span v-tooltip.top="data.entidade">{{ formatarEntidade(data.entidade) }}</span>
        </template>
      </Column>

      <Column field="registro_id" header="Reg. ID" sortable style="width: 5.5rem">
        <template #body="{ data }">
          <span>{{ data.registro_id ?? '-' }}</span>
        </template>
      </Column>

      <Column header="Resumo" style="width: 14rem">
        <template #body="{ data }">
          <span class="text-xs text-surface-600 dark:text-surface-300">{{ resumoAlteracao(data) }}</span>
        </template>
      </Column>

      <Column field="ip" header="IP" sortable style="width: 8.5rem">
        <template #body="{ data }">
          <span class="font-mono text-xs">{{ data.ip ?? '-' }}</span>
        </template>
      </Column>

      <Column header="Ver" style="width: 4.5rem" :exportable="false">
        <template #body="{ data }">
          <Button
            icon="pi pi-eye"
            severity="info"
            text
            rounded
            @click="verDetalhe(data)"
            v-tooltip.top="'Ver Detalhes'"
          />
        </template>
      </Column>
    </DataTable>

    <AuditDetalheModal
      v-model:visible="detalheVisible"
      :registro="registroSelecionado"
    />
  </div>
</template>