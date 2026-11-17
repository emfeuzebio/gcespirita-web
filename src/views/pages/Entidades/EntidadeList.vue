<script setup>
import { entidadesApi } from '@/api/endpoints/entidades';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import EntidadeAcoesModal from './EntidadeAcoesModal.vue';
import EntidadeForm from './EntidadeForm.vue';

const toast = useToast();
const confirm = useConfirm();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

const acoesModalVisible = ref(false);
const entidadeSelecionadaAcoes = ref(null);

const filters = ref({
  global: { value: null, matchMode: 'contains' },
});

async function carregar() {
  loading.value = true;
  try {
    const res = await entidadesApi.list();
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

function abrirAcoes(item) {
  entidadeSelecionadaAcoes.value = { ...item };
  acoesModalVisible.value = true;
}

function confirmarExclusao(item) {
  confirm.require({
    message: `Excluir a entidade "${item.model}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await entidadesApi.remove(item.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Entidade removida com sucesso.', life: 3000 });
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
        <h2 class="text-2xl font-medium">Entidades (ACL)</h2>
        <span class="text-sm text-surface-500">Catálogo de models controlados pelo sistema de permissões</span>
      </div>
      <div class="flex items-center gap-2">
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          @click="carregar"
          :loading="loading"
          v-tooltip.top="'Recarregar dados'"
        />
        <Button
          label="Nova Entidade"
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
      :globalFilterFields="['model', 'descricao']"
      dataKey="id"
      paginator
      :rows="15"
      :rowsPerPageOptions="[10, 15, 25, 50]"
      responsiveLayout="scroll"
    >
      <template #header>
        <div class="flex justify-end">
          <InputText v-model="filters['global'].value" placeholder="Pesquisar..." />
        </div>
      </template>

      <template #empty>
        <div class="text-center py-6 text-muted-color">Nenhuma entidade encontrada.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 5rem" />
      <Column field="model" header="Model" sortable>
        <template #body="{ data }">
          <span class="font-mono text-sm">{{ data.model }}</span>
        </template>
      </Column>
      <Column field="descricao" header="Descrição" sortable />
      <Column field="ativo" header="Ativo" sortable style="width: 8rem">
        <template #body="{ data }">
          <Tag
            :severity="data.ativo === 'SIM' ? 'success' : 'danger'"
            :value="data.ativo === 'NAO' ? 'NÃO' : data.ativo"
          />
        </template>
      </Column>
      <Column header="Ações" style="width: 11rem" :exportable="false">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            @click="editar(data)"
            v-tooltip.top="'Editar o Registro'"
          />
          <Button
            icon="pi pi-key"
            severity="info"
            text
            rounded
            @click="abrirAcoes(data)"
            v-tooltip.top="'Gerenciar Ações da Entidade'"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="confirmarExclusao(data)"
            v-tooltip.top="'Excluir o Registro'"
          />
        </template>
      </Column>
    </DataTable>

    <EntidadeForm v-model:visible="formVisible" :entidade="editando" @salvo="onSalvo" />
    <EntidadeAcoesModal v-model:visible="acoesModalVisible" :entidade="entidadeSelecionadaAcoes" />
    <ConfirmDialog />
  </div>
</template>