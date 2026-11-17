<script setup>
import { usuariosApi } from '@/api/endpoints/usuarios';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import UsuarioForm from './UsuarioForm.vue';

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
    const res = await usuariosApi.list();
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
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-medium">Usuários do Sistema</h2>
        <span class="text-sm text-surface-500">Gerenciamento de contas e acessos</span>
      </div>
      
      <!-- Grupo de Botões à Direita -->
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
      :globalFilterFields="['nome', 'email', 'organizacao.sigla']"
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
        <div class="text-center py-6 text-muted-color">Nenhum usuário encontrado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 5rem" />
      <Column field="nome" header="Nome" sortable />
      <Column field="email" header="E-mail" sortable />
      
      <!-- Coluna Organização exibindo a sigla via template -->
      <Column header="Organização" sortable sortField="organizacao.sigla" style="width: 12rem">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.organizacao?.sigla ?? data.organizacao_id }}</span>
        </template>
      </Column>

      <Column field="ativo" header="Ativo" sortable style="width: 8rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>
      <Column header="Ações" style="width: 10rem" :exportable="false">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" severity="secondary" text rounded @click="editar(data)" v-tooltip.top="'Editar o Registro'" />
          <Button icon="pi pi-trash" severity="danger" 
            text rounded @click="confirmarExclusao(data)" 
            v-tooltip.top="'Excluir o Registro'"
          />
        </template>
      </Column>
    </DataTable>

    <UsuarioForm v-model:visible="formVisible" :usuario="editando" @salvo="onSalvo" />
    <ConfirmDialog />
  </div>
</template>