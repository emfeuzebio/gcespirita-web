<script setup>
import { organizacaoModulosApi } from '@/api/endpoints/organizacaoModulos';
import { organizacoesApi } from '@/api/endpoints/organizacoes';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import OrganizacaoForm from './OrganizacaoForm.vue';
import OrganizacaoModulosModal from './OrganizacaoModulosModal.vue';

const toast = useToast();
const confirm = useConfirm();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

const modulosModalVisible = ref(false);
const organizacaoModulos = ref(null);
/** @type {import('vue').Ref<Record<number, Array>>} */
const modulosAtivosPorOrg = ref({});

// Paginação reativa (inicia em 5 registros por página; 999999 cobre "Todos")
const first = ref(0);
const rows = ref(5);
const rowsPerPageOptions = [5, 10, 25, 50, 100, 999999];

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

const globalFilterFields = ['nome', 'sigla', 'subdominio', 'cnpj', 'tipo'];

// Mapa rápido para buscar o nome da matriz pelo ID na tabela
const organizacoesMap = computed(() => {
  const map = {};
  itens.value.forEach(o => {
    map[o.id] = o.nome;
  });
  return map;
});

// Total considerando o filtro global ativo (quando preenchido)
const totalRegistros = computed(() => {
  const termo = String(filters.value?.global?.value ?? '').trim().toLowerCase();

  if (!termo) {
    return itens.value.length;
  }

  return itens.value.filter((item) =>
    globalFilterFields.some((campo) =>
      String(item?.[campo] ?? '').toLowerCase().includes(termo)
    )
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

// Volta para a primeira página ao digitar na busca global
watch(
  () => filters.value?.global?.value,
  () => {
    first.value = 0;
  }
);

async function carregar() {
  loading.value = true;
  try {
    const res = await organizacoesApi.list();
    itens.value = res.data ?? [];
    first.value = 0;

    await carregarModulosAtivos(itens.value);
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

/**
 * Busca os módulos de cada organização e guarda apenas os ativos (`SIM`) para as Tags.
 * N+1 aceitável para a tela de SuperAdmin (poucas orgs).
 *
 * @param {Array} organizacoes
 */
async function carregarModulosAtivos(organizacoes) {
  const novoMapa = {};

  await Promise.all(
    organizacoes.map(async (org) => {
      try {
        const res = await organizacaoModulosApi.list(org.id);
        const modulos = res.data ?? [];
        novoMapa[org.id] = modulos
          .filter((m) => m.ativo_no_tenant === 'SIM')
          .map((m) => ({ codigo: m.codigo, nome: m.nome }));
      } catch {
        novoMapa[org.id] = [];
      }
    })
  );

  modulosAtivosPorOrg.value = novoMapa;
}

async function recarregarModulosDaOrg(orgId) {
  try {
    const res = await organizacaoModulosApi.list(orgId);
    const modulos = res.data ?? [];
    modulosAtivosPorOrg.value = {
      ...modulosAtivosPorOrg.value,
      [orgId]: modulos
        .filter((m) => m.ativo_no_tenant === 'SIM')
        .map((m) => ({ codigo: m.codigo, nome: m.nome })),
    };
  } catch {
    // silencioso: a Tag apenas não atualiza
  }
}

function novo() {
  editando.value = null;
  formVisible.value = true;
}

function editar(item) {
  editando.value = { ...item };
  formVisible.value = true;
}

function gerenciarModulos(item) {
  organizacaoModulos.value = item;
  modulosModalVisible.value = true;
}

function onModulosSalvos() {
  if (organizacaoModulos.value?.id) {
    recarregarModulosDaOrg(organizacaoModulos.value.id);
  }
}

function confirmarExclusao(item) {
  confirm.require({
    message: `Excluir a organização "${item.nome} (${item.sigla})"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await organizacoesApi.remove(item.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Organização removida com sucesso.', life: 3000 });
        await carregar();
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
      }
    },
  });
}

function onSalvo() {
  formVisible.value = false;
  carregar();
}

onMounted(carregar);
</script>

<template>
  <div class="card">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
      <div>
        <h2 class="text-2xl font-medium">Organizações</h2>
        <span class="text-sm text-surface-500">Gerenciamento global de tenants (SuperAdmin)</span>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="carregar"
          :loading="loading"
          v-tooltip.top="'Atualizar lista de organizações'"
        />
        <Button
          label="Nova Organização"
          icon="pi pi-plus"
          @click="novo"
          v-tooltip.top="'Cadastrar nova organização'"
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
        <div class="text-center py-6 text-muted-color">Nenhuma organização encontrada.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 1rem" />
      <Column field="sigla" header="Sigla" sortable style="width: 2rem" />
      <Column field="nome" header="Nome" sortable style="width: 14rem" />
      <Column field="tipo" header="Tipo" sortable style="width: 2rem">
        <template #body="{ data }">
          <Tag :severity="data.tipo === 'MATRIZ' ? 'info' : 'warn'" :value="data.tipo" />
        </template>
      </Column>
      <Column header="Matriz Pai" style="width: 12rem">
        <template #body="{ data }">
          {{ data.organizacao_pai_id ? (organizacoesMap[data.organizacao_pai_id] || `#${data.organizacao_pai_id}`) : '-' }}
        </template>
      </Column>

      <Column header="Módulos" style="width: 10rem">
        <template #body="{ data }">
          <div v-if="modulosAtivosPorOrg[data.id]?.length" class="flex flex-wrap gap-1">
            <Tag
              v-for="mod in modulosAtivosPorOrg[data.id]"
              :key="mod.codigo"
              :value="mod.codigo"
              severity="info"
              class="text-xs"
              v-tooltip.top="mod.nome"
            />
          </div>
          <span v-else class="text-xs text-surface-400 italic">Nenhum</span>
        </template>
      </Column>

      <Column field="ativo" header="Ativo" sortable style="width: 8rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>
      <Column header="Ações" style="width: 12rem" :exportable="false">
        <template #body="{ data }">
          <Button
            icon="pi pi-th-large"
            severity="info"
            text
            rounded
            @click="gerenciarModulos(data)"
            v-tooltip.top="'Gerenciar módulos desta organização'"
          />
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            @click="editar(data)"
            v-tooltip.top="'Editar Organização'"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="confirmarExclusao(data)"
            v-tooltip.top="'Excluir Organização'"
          />
        </template>
      </Column>
    </DataTable>

    <OrganizacaoForm
      v-model:visible="formVisible"
      :organizacao="editando"
      :todasOrganizacoes="itens"
      @salvo="onSalvo"
    />

    <OrganizacaoModulosModal
      v-model:visible="modulosModalVisible"
      :organizacao="organizacaoModulos"
      @salvo="onModulosSalvos"
    />

    <ConfirmDialog />
  </div>
</template>