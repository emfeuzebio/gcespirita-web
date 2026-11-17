<script setup>
import { modulosApi } from '@/api/endpoints/modulos';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import ModuloForm from './ModuloForm.vue';

const toast = useToast();

const itens = ref([]);
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

const filters = ref({
  global: { value: null, matchMode: 'contains' },
});

async function carregar() {
  loading.value = true;
  try {
    const res = await modulosApi.list();
    itens.value = res.data ?? [];
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

function editar(item) {
  editando.value = { ...item };
  formVisible.value = true;
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
        <h2 class="text-2xl font-medium">Módulos do Sistema</h2>
        <span class="text-sm text-surface-500">Gerenciamento de módulos e funcionalidades globais</span>
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
      </div>
    </div>

    <DataTable
      :value="itens"
      :loading="loading"
      v-model:filters="filters"
      :globalFilterFields="['codigo', 'nome', 'descricao']"
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
        <div class="text-center py-6 text-muted-color">Nenhum módulo encontrado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 4rem" />
      <Column field="codigo" header="Código" sortable style="width: 8rem">
        <template #body="{ data }">
          <span class="font-mono text-xs font-semibold">{{ data.codigo }}</span>
        </template>
      </Column>
      <Column field="ordem" header="Ordem" sortable style="width: 6rem" />
      <Column field="nome" header="Nome" sortable />
      <Column field="descricao" header="Descrição" sortable />
      <Column field="ativo" header="Ativo" sortable style="width: 8rem">
        <template #body="{ data }">
          <Tag
            :severity="data.ativo === 'SIM' ? 'success' : 'danger'"
            :value="data.ativo === 'NAO' ? 'NÃO' : data.ativo"
          />
        </template>
      </Column>
      <Column header="Ações" style="width: 7rem" :exportable="false">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            @click="editar(data)"
            v-tooltip.top="'Editar o Módulo'"
          />
        </template>
      </Column>
    </DataTable>

    <ModuloForm v-model:visible="formVisible" :modulo="editando" @salvo="onSalvo" />
  </div>
</template>