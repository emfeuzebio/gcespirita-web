<script setup>
import { usuariosApi } from '@/api/endpoints/usuarios';
import { getTenantId } from '@/api/tenant-context'; // Ajuste o caminho exato se estiver na raiz da pasta api
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
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

// Filtro de status inicial padrão no servidor: 'SIM'
const filtroStatus = ref('SIM');

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

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
        <div class="text-center py-6 text-muted-color">Nenhum usuário encontrado para o filtro selecionado.</div>
      </template>

      <Column field="id" header="ID" sortable style="width: 5rem" />
      <Column field="nome" header="Nome" sortable />
      <Column field="email" header="E-mail" sortable />
      
      <Column header="Organização" sortable sortField="organizacao.sigla" style="width: 11rem">
        <template #body="{ data }">
          <span class="font-semibold">{{ data.organizacao?.sigla ?? data.organizacao_id }}</span>
        </template>
      </Column>

      <!-- Coluna Perfis com Badges Empilhados -->
      <Column header="Perfis" style="width: 14rem">
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

      <Column field="ativo" header="Ativo" sortable style="width: 7rem">
        <template #body="{ data }">
          <Tag :severity="data.ativo === 'SIM' ? 'success' : 'danger'" :value="data.ativo" />
        </template>
      </Column>

      <Column header="Ações" style="width: 12rem" :exportable="false">
        <template #body="{ data }">
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