<script setup>
import { menusApi } from '@/api/endpoints/menus';
import { modulosApi } from '@/api/endpoints/modulos';
import { faToPi } from '@/utils/faToPi';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import MenuForm from './MenuForm.vue';

const toast = useToast();
const confirm = useConfirm();

const arvore = ref([]);
const modulosMap = ref({});
const loading = ref(false);
const formVisible = ref(false);
const editando = ref(null);

/** Adiciona `key` (id) recursivamente para o TreeTable. */
function comKey(nos) {
  return (nos ?? []).map((n) => ({
    ...n,
    key: n.id,
    children: n.children ? comKey(n.children) : [],
  }));
}

async function carregar() {
  loading.value = true;
  try {
    const [resMenus, resModulos] = await Promise.all([
      menusApi.list(),
      modulosApi.list(),
    ]);
    arvore.value = comKey(resMenus.data ?? []);
    const map = {};
    (resModulos.data ?? []).forEach((m) => {
      map[m.id] = m.nome;
    });
    modulosMap.value = map;
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

function editar(node) {
  editando.value = { ...node };
  formVisible.value = true;
}

function confirmarExclusao(node) {
  confirm.require({
    message: `Excluir o menu "${node.titulo}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await menusApi.remove(node.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Menu removido.', life: 3000 });
        await carregar();
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 5000 });
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
        <h2 class="text-2xl font-medium">Menu Geral do Sistema</h2>
        <span class="text-sm text-surface-500">Estrutura geral de Menus de  navegação do sistema</span>
      </div>
      <Button
        label="Novo Menu"
        icon="pi pi-plus"
        @click="novo"
        v-tooltip.top="'Cadastrar novo menu'"
      />
    </div>

    <TreeTable
      :value="arvore"
      :loading="loading"
      dataKey="key"
      responsiveLayout="scroll"
    >
      <template #empty>
        <div class="text-center py-6 text-muted-color">Nenhum menu cadastrado.</div>
      </template>

      <Column field="titulo" header="Título" :expander="true">
        <template #body="{ node }">
          <span class="inline-flex items-center gap-2">
            <i v-if="node.icone" :class="faToPi(node.icone)"></i>
            <span>{{ node.titulo }}</span>
          </span>
        </template>
      </Column>

      <Column field="tipo" header="Tipo" style="width: 8rem">
        <template #body="{ node }">
          <Tag
            :value="node.tipo"
            :severity="node.tipo === 'separador' ? 'secondary' : node.tipo === 'grupo' ? 'info' : 'success'"
          />
        </template>
      </Column>

      <Column field="rota" header="Rota">
        <template #body="{ node }">
          <span v-if="node.rota" class="font-mono text-sm">{{ node.rota }}</span>
          <span v-else class="text-muted-color">—</span>
        </template>
      </Column>

      <Column field="modulo_id" header="Módulo" style="width: 12rem">
        <template #body="{ node }">
          {{ modulosMap[node.modulo_id] ?? '—' }}
        </template>
      </Column>

      <Column field="ordem" header="Ordem" style="width: 6rem" />

      <Column field="ativo" header="Ativo" style="width: 6rem">
        <template #body="{ node }">
          <Tag
            :value="node.ativo"
            :severity="node.ativo === 'SIM' ? 'success' : 'danger'"
          />
        </template>
      </Column>

      <Column header="Ações" style="width: 8rem" :exportable="false">
        <template #body="{ node }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            rounded
            @click="editar(node)"
            v-tooltip="'Editar Menu'"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            @click="confirmarExclusao(node)"
            v-tooltip="'Excluir Menu'"
          />
        </template>
      </Column>
    </TreeTable>

    <MenuForm v-model:visible="formVisible" :menu="editando" :arvore="arvore" @salvo="onSalvo" />
    <ConfirmDialog />
  </div>
</template>