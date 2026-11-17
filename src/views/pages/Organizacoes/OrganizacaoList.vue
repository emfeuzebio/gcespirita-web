<script setup>
import { organizacoesApi } from '@/api/endpoints/organizacoes';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import OrganizacaoForm from './OrganizacaoForm.vue';

const toast = useToast();
const confirm = useConfirm();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

// Mapa rápido para buscar o nome da matriz pelo ID na tabela
const organizacoesMap = computed(() => {
  const map = {};
  itens.value.forEach(o => {
    map[o.id] = o.nome;
  });
  return map;
});

async function carregar() {
  loading.value = true;
  try {
    const res = await organizacoesApi.list();
    itens.value = res.data ?? [];
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
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
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-medium">Organizações</h2>
        <span class="text-sm text-surface-500">Gerenciamento global de tenants (SuperAdmin)</span>
      </div>
      <Button label="Nova Organização" icon="pi pi-plus" @click="novo" />
    </div>

    <DataTable
      :value="itens"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="['nome', 'sigla', 'subdominio', 'cnpj', 'tipo']"
      dataKey="id"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 25, 50]"
      responsiveLayout="scroll"
    >
      <template #header>
        <div class="flex justify-end">
          <InputText v-model="filters['global'].value" placeholder="Pesquisar..." />
        </div>
      </template>

      <template #empty>
        <div class="text-center py-6 text-muted-color">Nenhuma organização encontrada.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 5rem" />
      <Column field="sigla" header="Sigla" sortable style="width: 8rem" />
      <Column field="nome" header="Nome" sortable />
      <Column field="tipo" header="Tipo" sortable style="width: 8rem">
        <template #body="{ data }">
          <Tag :severity="data.tipo === 'MATRIZ' ? 'info' : 'warn'" :value="data.tipo" />
        </template>
      </Column>
      <Column header="Matriz Pai" style="width: 14rem">
        <template #body="{ data }">
          {{ data.organizacao_pai_id ? (organizacoesMap[data.organizacao_pai_id] || `#${data.organizacao_pai_id}`) : '-' }}
        </template>
      </Column>
      <Column field="ativo" header="Ativo" sortable style="width: 8rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>
      <Column header="Ações" style="width: 10rem" :exportable="false">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" severity="secondary" text rounded @click="editar(data)" />
          <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarExclusao(data)" />
        </template>
      </Column>
    </DataTable>

    <OrganizacaoForm 
      v-model:visible="formVisible" 
      :organizacao="editando" 
      :todasOrganizacoes="itens" 
      @salvo="onSalvo" 
    />
    <ConfirmDialog />
  </div>
</template>