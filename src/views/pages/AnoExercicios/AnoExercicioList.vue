<script setup>
import { anoExerciciosApi } from '@/api/endpoints/anoExercicios';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import AnoExercicioForm from './AnoExercicioForm.vue';

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
    const res = await anoExerciciosApi.list();
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
    message: `Excluir o ano de exercício "${item.ano}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await anoExerciciosApi.remove(item.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Ano de exercício removido com sucesso.', life: 3000 });
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
        <h2 class="text-2xl font-medium">Anos de Exercício</h2>
        <span class="text-sm text-surface-500">Gerenciamento de exercícios fiscais/anuais</span>
      </div>
      <Button label="Novo Ano" icon="pi pi-plus" @click="novo" />
    </div>

    <DataTable
      :value="itens"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="['ano']"
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
        <div class="text-center py-6 text-muted-color">Nenhum ano encontrado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 6rem" />
      <Column field="ano" header="Ano" sortable />
      <Column header="Ações" style="width: 10rem" :exportable="false">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" severity="secondary" text rounded @click="editar(data)" />
          <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmarExclusao(data)" />
        </template>
      </Column>
    </DataTable>

    <AnoExercicioForm v-model:visible="formVisible" :anoExercicio="editando" @salvo="onSalvo" />
    <ConfirmDialog />
  </div>
</template>