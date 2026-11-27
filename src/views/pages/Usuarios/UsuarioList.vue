<script setup>
import { usuariosApi } from '@/api/endpoints/usuarios';
import { getTenantId } from '@/api/tenant-context'; // Ajuste o caminho exato se estiver na raiz da pasta api
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import UsuarioForm from './UsuarioForm.vue';
import UsuarioPerfisModal from './UsuarioPerfisModal.vue';

const toast = useToast();
const confirm = useConfirm();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

// Controle do Modal Master-Detail de Perfis
const perfisModalVisible = ref(false);
const usuarioPerfisSelecionado = ref(null);

// Paginação reativa (inicia em 5 registros por página; 999999 cobre "Todos")
const first = ref(0);
const rows = ref(5);
const rowsPerPageOptions = [5, 10, 25, 50, 100, 999999];

// Filtro de status inicial padrão no servidor: 'SIM'
const filtroStatus = ref('SIM');

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

const globalFilterFields = ['nome', 'email', 'organizacao.sigla'];

function obterValorPorCaminho(objeto, caminho) {
  return caminho.split('.').reduce((acc, chave) => acc?.[chave], objeto);
}

// Total considerando o filtro global ativo (incluindo campos aninhados)
const totalRegistros = computed(() => {
  const termo = String(filters.value?.global?.value ?? '').trim().toLowerCase();

  if (!termo) {
    return itens.value.length;
  }

  return itens.value.filter((item) =>
    globalFilterFields.some((campo) =>
      String(obterValorPorCaminho(item, campo) ?? '').toLowerCase().includes(termo)
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
    const params = {};
    if (filtroStatus.value) params.ativo = filtroStatus.value;

    // Pega o ID do tenant ativo no contexto global
    const tenantId = getTenantId();
    if (tenantId) {
      params.organizacao_id = tenantId;
    }

    const res = await usuariosApi.list(params);
    itens.value = res.data ?? [];
    first.value = 0;
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function reenviarConvite(item) {
  confirm.require({
    message: `Reenviar o convite para "${item.nome}" (${item.email})?`,
    header: 'Reenviar convite',
    icon: 'pi pi-envelope',
    acceptLabel: 'Reenviar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await usuariosApi.reenviarConvite(item.id);
        toast.add({ severity: 'success', summary: 'Enviado', detail: 'Convite reenviado com sucesso.', life: 3000 });
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
      }
    },
  });
}

function novo() {
  editando.value = null;
  formVisible.value = true;
}

function editar(item) {
  editando.value = { ...item };
  formVisible.value = true;
}

function gerenciarPerfis(item) {
  usuarioPerfisSelecionado.value = item;
  perfisModalVisible.value = true;
}

function confirmarExclusao(item) {
  confirm.require({
    message: `Excluir o usuário "${item.nome}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await usuariosApi.remove(item.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Usuário removido com sucesso.', life: 3000 });
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
        <h2 class="text-2xl font-medium">Usuários do Sistema</h2>
        <span class="text-sm text-surface-500">Gerenciamento de contas, acessos e perfis</span>
      </div>

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
          v-tooltip.top="'Filtrar por Ativo'"
        />

        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="carregar"
          :loading="loading"
          v-tooltip.top="'Recarregar dados'"
        />
        <Button
          label="Novo Usuário"
          icon="pi pi-plus"
          @click="novo"
          v-tooltip.top="'Inserir Novo Registro'"
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
        <div class="text-center py-6 text-muted-color">Nenhum usuário encontrado para o filtro selecionado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 1rem" />
      <Column field="nome" header="Nome" sortable style="width: 18rem" />
      <Column field="email" header="E-mail" sortable />

      <Column header="Org." sortable sortField="organizacao.sigla" style="width: 3rem">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.organizacao?.sigla ?? data.organizacao_id }}</span>
        </template>
      </Column>

      <!-- Coluna Perfis com Badges Empilhados -->
      <Column header="Perfis" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <template v-if="data.perfis && data.perfis.length > 0">
              <Tag
                v-for="perfil in data.perfis"
                :key="perfil.id"
                :value="perfil.sigla"
                severity="info"
                v-tooltip.top="perfil.descricao"
              />
            </template>
            <span v-else class="text-xs text-muted-color italic">Nenhum perfil</span>
          </div>
        </template>
      </Column>

      <Column field="ativo" header="Ativo" sortable style="width: 3rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>

      <Column header="Ações" style="width: 13rem" :exportable="false">
        <template #body="{ data }">

          <Button
            v-if="data.precisa_trocar_senha === 'SIM'"
            icon="pi pi-envelope" severity="warn" text rounded @click="reenviarConvite(data)" v-tooltip.top="'Reenviar convite por e-mail'"
          />

          <Button icon="pi pi-shield" severity="info" text rounded @click="gerenciarPerfis(data)" v-tooltip.top="'Gerenciar Perfis (ACL)'" />
          <Button icon="pi pi-pencil" severity="secondary" text rounded @click="editar(data)" v-tooltip.top="'Editar o Registro'" />
          <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarExclusao(data)" v-tooltip.top="'Excluir o Registro'" />
        </template>
      </Column>
    </DataTable>

    <UsuarioForm v-model:visible="formVisible" :usuario="editando" @salvo="onSalvo" />
    <UsuarioPerfisModal
      v-model:visible="perfisModalVisible"
      :usuario="usuarioPerfisSelecionado"
      @atualizado="carregar"
    />
    <ConfirmDialog />
  </div>
</template>