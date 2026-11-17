<script setup>
import { perfisApi } from '@/api/endpoints/perfis';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import PerfilForm from './PerfilForm.vue';

const toast = useToast();
const confirm = useConfirm();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

async function carregar() {
  loading.value = true;
  try {
    const res = await perfisApi.list();
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
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-medium">Perfis de Acesso (ACL)</h2>
        <span class="text-sm text-surface-500">Gerenciamento de papéis e permissões do sistema</span>
      </div>
      <Button label="Novo Perfil" icon="pi pi-plus" @click="novo" />
    </div>

    <DataTable
      :value="itens"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="['sigla', 'descricao', 'observacao']"
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
        <div class="text-center py-6 text-muted-color">Nenhum perfil encontrado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 2rem" />
      <Column field="sigla" header="Sigla" sortable style="width: 7rem">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.sigla }}</span>
        </template>
      </Column>
      <Column field="descricao" header="Descrição" sortable style="width: 10rem" />
      <Column field="observacao" header="Observação" sortable />
      <Column field="ativo" header="Ativo" sortable style="width: 4rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>
      <Column field="padrao" header="Padrão" sortable style="width: 4rem">
        <template #body="{ data }">
          <Tag :severity="data.padrao === 'SIM' ? 'success' : 'danger'" :value="data.padrao" />
        </template>
      </Column>
      <Column header="Ações" style="width: 8rem" :exportable="false">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" severity="secondary" text rounded @click="editar(data)" />
          <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarExclusao(data)" />
        </template>
      </Column>
    </DataTable>

    <PerfilForm v-model:visible="formVisible" :perfil="editando" @salvo="onSalvo" />
    <ConfirmDialog />
  </div>
</template>