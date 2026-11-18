<script setup>
import { usuariosApi } from '@/api/endpoints/usuarios';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: Boolean,
  usuario: Object,
});

const emit = defineEmits(['update:visible', 'atualizado']);

const toast = useToast();
const loading = ref(false);
const salvando = ref(false);

const todosPerfis = ref([]);
const perfisDoUsuario = ref([]);
const perfilSelecionadoId = ref(null);

const perfisDisponiveis = computed(() => {
  const idsVinculados = new Set(perfisDoUsuario.value.map((p) => p.id));
  return todosPerfis.value.filter((p) => p.ativo === 'SIM' && !idsVinculados.has(p.id));
});

watch(
  () => props.visible,
  async (aberto) => {
    if (aberto && props.usuario) {
      perfilSelecionadoId.value = null;
      perfisDoUsuario.value = [...(props.usuario.perfis || [])];
      await carregarDados();
    }
  }
);

async function carregarDados() {
  loading.value = true;
  try {
    const [resTodos, resUsuario] = await Promise.all([
      usuariosApi.listarTodosPerfis(),
      usuariosApi.getPerfis(props.usuario.id),
    ]);
    todosPerfis.value = resTodos.data ?? [];
    perfisDoUsuario.value = resUsuario.data ?? [];
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar perfis', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function adicionarPerfil() {
  if (!perfilSelecionadoId.value) return;
  salvando.value = true;
  try {
    // Pega os IDs que o usuário já tem e adiciona o novo ID selecionado
    const idsAtuais = perfisDoUsuario.value.map(p => p.id);
    const todosOsIds = [...idsAtuais, perfilSelecionadoId.value];

    await usuariosApi.vincularPerfis(props.usuario.id, { 
      perfil_ids: todosOsIds 
    });
    
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Perfil vinculado ao usuário.', life: 3000 });
    perfilSelecionadoId.value = null;
    await carregarDados();
    emit('atualizado');
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    salvando.value = false;
  }
}

async function removerPerfil(perfil) {
  salvando.value = true;
  try {
    // Passa o ID do usuário e o ID do perfil individual para a rota DELETE
    await usuariosApi.desvincularPerfil(props.usuario.id, perfil.id);
    
    toast.add({ severity: 'success', summary: 'Removido', detail: `Perfil ${perfil.sigla} desvinculado.`, life: 3000 });
    await carregarDados();
    emit('atualizado');
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    salvando.value = false;
  }
}

function fechar() {
  emit('update:visible', false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="fechar"
    :header="`Gerenciar Perfis — ${usuario?.nome ?? ''}`"
    modal
    class="w-full max-w-2xl"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row gap-2 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
        <Select
          v-model="perfilSelecionadoId"
          :options="perfisDisponiveis"
          optionLabel="descricao"
          optionValue="id"
          placeholder="Selecione um perfil para vincular..."
          class="flex-1"
          :disabled="loading || salvando"
          filter
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2">
              <Tag :value="option.sigla" severity="info" />
              <span>{{ option.descricao }}</span>
            </div>
          </template>
        </Select>

        <Button
          label="Vincular"
          icon="pi pi-plus"
          @click="adicionarPerfil"
          :disabled="!perfilSelecionadoId || loading"
          :loading="salvando"
        />
      </div>

      <DataTable
        :value="perfisDoUsuario"
        :loading="loading"
        dataKey="id"
        responsiveLayout="scroll"
        size="small"
      >
        <template #empty>
          <div class="text-center py-4 text-muted-color">Este usuário não possui nenhum perfil vinculado.</div>
        </template>

        <Column header="Sigla" style="width: 8rem">
          <template #body="{ data }">
            <Tag :value="data.sigla" severity="info" />
          </template>
        </Column>

        <Column field="descricao" header="Descrição" />

        <Column header="Ação" style="width: 5rem" class="text-center">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              :disabled="salvando"
              @click="removerPerfil(data)"
              v-tooltip.top="'Desvincular Perfil'"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <Button label="Fechar" icon="pi pi-times" severity="secondary" outlined @click="fechar" />
    </template>
  </Dialog>
</template>