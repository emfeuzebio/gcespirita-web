<script setup>
import { perfisApi } from '@/api/endpoints/perfis';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import PerfilAutorizacoesModal from './PerfilAutorizacoesModal.vue';
import PerfilForm from './PerfilForm.vue';

const toast = useToast();
const confirm = useConfirm();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const autorizacoesVisible = ref(false);
const editando = ref(null);
const perfilSelecionado = ref(null);
const entidadeFocadaInicial = ref(null);

// Paginação reativa (inicia em 5 registros por página; 999999 cobre "Todos" de forma segura)
const first = ref(0);
const rows = ref(5);
const rowsPerPageOptions = [5, 10, 25, 50, 100, 999999];

// Filtro de status inicial padrão no servidor: 'SIM'
const filtroStatus = ref('SIM');

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

const globalFilterFields = ['sigla', 'descricao', 'observacao'];

function formatarNomeModel(model) {
  if (!model || typeof model !== 'string') return null;
  return model.replace(/^App\\Models\\/, '');
}

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

// Busca a lista de perfis considerando o filtro de status selecionado
async function carregar() {
  loading.value = true;
  try {
    const params = {};
    if (filtroStatus.value) {
      params.ativo = filtroStatus.value;
    }

    const res = await perfisApi.list(params);
    itens.value = res.data ?? [];
    first.value = 0;
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

// Extrai estritamente as entidades cujas ações estejam ativas ('SIM') na pivô esparsa
const entidadesPorPerfil = computed(() => {
  const mapa = {};

  itens.value.forEach((perfil) => {
    const entidadesMap = new Map();

    if (perfil.acoes && Array.isArray(perfil.acoes)) {
      perfil.acoes.forEach((acao) => {
        const ativo = acao.pivot?.ativo ?? acao.ativo;

        if (ativo === 'SIM' && acao.entidade) {
          const ent = acao.entidade;
          const nomeEntidade = formatarNomeModel(ent.model) ?? ent.descricao;

          if (ent.id && nomeEntidade) {
            entidadesMap.set(ent.id, {
              id: ent.id,
              descricao: nomeEntidade
            });
          }
        }
      });
    }

    mapa[perfil.id] = Array.from(entidadesMap.values());
  });

  return mapa;
});

function novo() {
  editando.value = null;
  formVisible.value = true;
}

function editar(item) {
  editando.value = { ...item };
  formVisible.value = true;
}

function gerenciarAutorizacoes(item) {
  perfilSelecionado.value = item;
  entidadeFocadaInicial.value = null;
  autorizacoesVisible.value = true;
}

function abrirModalEntidade(perfil, entidade) {
  perfilSelecionado.value = perfil;
  entidadeFocadaInicial.value = entidade;
  autorizacoesVisible.value = true;
}

function confirmarExclusao(item) {
  confirm.require({
    message: `Excluir o perfil "${item.descricao} (${item.sigla})"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await perfisApi.remove(item.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Perfil removido com sucesso.', life: 3000 });
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
        <h2 class="text-2xl font-medium">Perfis de Acesso (ACL)</h2>
        <span class="text-sm text-surface-500">Gerenciamento de papéis e permissões do sistema</span>
      </div>

      <!-- Bloco de Controles do Topo (Filtro de Status + Botões) -->
      <div class="flex flex-wrap items-center gap-2">
        <Select
          v-model="filtroStatus"
          @update:modelValue="carregar"
          :options="[
            { label: 'Apenas Ativos', value: 'SIM' },
            { label: 'Apenas Inativos', value: 'NAO' },
            { label: 'Todos os Status', value: null }
          ]"
          optionLabel="label"
          optionValue="value"
          placeholder="Filtrar por Status"
          class="w-44"
        />

        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="carregar"
          v-tooltip.top="'Atualizar lista de perfis'"
          :loading="loading"
        />
        <Button
          label="Novo Perfil"
          icon="pi pi-plus"
          @click="novo"
          v-tooltip.top="'Cadastrar novo perfil de acesso'"
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
        <div class="text-center py-6 text-muted-color">Nenhum perfil encontrado para o filtro selecionado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 1rem" />
      <Column field="descricao" header="Nome" sortable style="width: 4rem" />
      <Column field="sigla" header="Sigla" sortable style="width: 2rem">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.sigla }}</span>
        </template>
      </Column>
      <Column field="observacao" header="Descrição" sortable style="width: 12rem" />

      <!-- Coluna de Entidades com Badges Interativos -->
      <Column header="Entidades">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <template v-if="entidadesPorPerfil?.[data.id]?.length">
              <Tag
                v-for="entidade in entidadesPorPerfil[data.id]"
                :key="entidade.id"
                :value="entidade.descricao"
                severity="info"
                class="text-xs cursor-pointer hover:bg-sky-600 transition-colors"
                v-tooltip.top="`Gerenciar autorizações para ${entidade.descricao}`"
                @click="abrirModalEntidade(data, entidade)"
              />
            </template>
            <span v-else class="text-xs text-surface-400 italic">Nenhuma</span>
          </div>
        </template>
      </Column>

      <Column field="ativo" header="Ativo" sortable style="width: 1rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>

      <Column field="padrao" header="Padrão" sortable style="width: 1rem">
        <template #body="{ data }">
          <Tag :severity="data.padrao === 'SIM' ? 'success' : 'danger'" :value="data.padrao" />
        </template>
      </Column>

      <Column header="Ações" style="width: 8rem" :exportable="false">
        <template #body="{ data }">
          <Button
            icon="pi pi-shield"
            severity="info"
            text
            rounded
            v-tooltip.top="'Gerenciar Autorizações'"
            @click="gerenciarAutorizacoes(data)"
          />
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            v-tooltip.top="'Editar Perfil'"
            @click="editar(data)"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            v-tooltip.top="'Excluir Perfil'"
            @click="confirmarExclusao(data)"
          />
        </template>
      </Column>
    </DataTable>

    <PerfilForm v-model:visible="formVisible" :perfil="editando" @salvo="onSalvo" />

    <!-- Modal Unificado de Autorizações -->
    <PerfilAutorizacoesModal
      v-model:visible="autorizacoesVisible"
      :perfil="perfilSelecionado"
      :entidadeFocadaInicial="entidadeFocadaInicial"
      @salvo="carregar"
    />

    <ConfirmDialog />
  </div>
</template>