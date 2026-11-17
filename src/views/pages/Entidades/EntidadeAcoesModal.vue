<script setup>
import { acoesApi } from '@/api/endpoints/acoes';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  entidade: { type: Object, default: null },
});

const emit = defineEmits(['update:visible']);

const toast = useToast();
const confirm = useConfirm();

const todasAcoes = ref([]);
const loading = ref(false);
const saving = ref(false);
const errors = ref({});
const editandoAcaoId = ref(null);

// Sugestões comuns, mas agora permitindo texto livre
const sugestoesAcao = ['view', 'create', 'update', 'delete', 'conceder-perfil', 'revogar-perfil', 'aprovar', 'reenviar-convite'];
const acoesFiltradasSugestoes = ref([...sugestoesAcao]);

const form = ref({
  acao: 'view',
  rota: '',
  descricao: '',
  ativo: true,
});

// Filtra as ações pertencentes à entidade selecionada
const acoesDaEntidade = computed(() => {
  if (!props.entidade?.id) return [];
  return todasAcoes.value.filter((item) => item.entidade_id === props.entidade.id);
});

async function carregarAcoes() {
  if (!props.entidade?.id) return;
  loading.value = true;
  try {
    const res = await acoesApi.list();
    todasAcoes.value = res.data ?? [];
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

function resetarForm() {
  editandoAcaoId.value = null;
  form.value = {
    acao: 'view',
    rota: '',
    descricao: '',
    ativo: true,
  };
  errors.value = {};
}

watch(
  () => props.visible,
  (v) => {
    if (v && props.entidade?.id) {
      resetarForm();
      carregarAcoes();
    }
  }
);

function filtrarSugestoes(event) {
  const query = event.query.toLowerCase();
  acoesFiltradasSugestoes.value = sugestoesAcao.filter((item) => item.toLowerCase().includes(query));
  // Garante que se o usuário digitar algo novo, ele continua visível nas opções se quiser
  if (!acoesFiltradasSugestoes.value.includes(event.query) && event.query.trim()) {
    acoesFiltradasSugestoes.value.unshift(event.query);
  }
}

function prepararEdicao(item) {
  editandoAcaoId.value = item.id;
  form.value = {
    acao: item.acao,
    rota: item.rota,
    descricao: item.descricao,
    ativo: item.ativo === 'SIM',
  };
  errors.value = {};
}

async function salvarAcao() {
  if (!props.entidade?.id) return;
  saving.value = true;
  errors.value = {};

  try {
    const payload = {
      entidade_id: props.entidade.id,
      acao: form.value.acao,
      rota: form.value.rota,
      descricao: form.value.descricao,
      ativo: form.value.ativo ? 'SIM' : 'NAO',
    };

    if (editandoAcaoId.value) {
      await acoesApi.update(editandoAcaoId.value, payload);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Ação atualizada com sucesso.', life: 3000 });
    } else {
      await acoesApi.create(payload);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Ação vinculada com sucesso.', life: 3000 });
    }

    resetarForm();
    await carregarAcoes();
  } catch (err) {
    errors.value = err.errors || {};
    if (err.status === 422) {
      toast.add({ severity: 'warn', summary: 'Verifique os campos', detail: err.message, life: 4000 });
    } else {
      toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
    }
  } finally {
    saving.value = false;
  }
}

function confirmarExclusaoAcao(item) {
  confirm.require({
    message: `Remover a ação "${item.rota}" (${item.acao}) desta entidade?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Excluir',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await acoesApi.remove(item.id);
        toast.add({ severity: 'success', summary: 'Excluído', detail: 'Ação removida com sucesso.', life: 3000 });
        if (editandoAcaoId.value === item.id) resetarForm();
        await carregarAcoes();
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
      }
    },
  });
}

function close() {
  emit('update:visible', false);
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="`Ações da Entidade: ${entidade?.descricao ?? ''}`"
    :modal="true"
    :style="{ width: '850px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-5">
      <!-- Parte Superior: Lista de Ações Existentes -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-semibold text-surface-600 dark:text-surface-300">
            Ações Cadastradas ({{ acoesDaEntidade.length }})
          </span>
          <Button
            icon="pi pi-refresh"
            severity="secondary"
            text
            size="small"
            @click="carregarAcoes"
            :loading="loading"
            v-tooltip.top="'Recarregar lista de ações'"
          />
        </div>

        <DataTable
          :value="acoesDaEntidade"
          :loading="loading"
          dataKey="id"
          size="small"
          stripedRows
          scrollable
          scrollHeight="240px"
          class="border rounded-md border-surface-200 dark:border-surface-700"
        >
          <template #empty>
            <div class="text-center py-4 text-muted-color text-sm">
              Nenhuma ação vinculada a esta entidade ainda.
            </div>
          </template>

          <Column field="acao" header="Ação" style="width: 8.5rem">
            <template #body="{ data }">
              <Tag :value="data.acao" severity="info" />
            </template>
          </Column>
          <Column field="rota" header="Rota Laravel">
            <template #body="{ data }">
              <span class="font-mono text-xs">{{ data.rota }}</span>
            </template>
          </Column>
          <Column field="descricao" header="Descrição" />
          <Column field="ativo" header="Ativo" style="width: 5.5rem">
            <template #body="{ data }">
              <Tag
                :severity="data.ativo === 'SIM' ? 'success' : 'danger'"
                :value="data.ativo === 'NAO' ? 'NÃO' : data.ativo"
              />
            </template>
          </Column>
          <Column header="Ações" style="width: 6.5rem" :exportable="false">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                size="small"
                @click="prepararEdicao(data)"
                v-tooltip.top="'Editar esta ação'"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                @click="confirmarExclusaoAcao(data)"
                v-tooltip.top="'Excluir esta ação'"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <Divider class="my-0" />

      <!-- Parte Inferior: Formulário de Inclusão / Edição de Ação -->
      <div class="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-lg border border-surface-200 dark:border-surface-700">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-base font-medium m-0">
            {{ editandoAcaoId ? 'Editar Ação Selecionada' : 'Adicionar Nova Ação' }}
          </h4>
          <Button
            v-if="editandoAcaoId"
            label="Cancelar Edição"
            icon="pi pi-times"
            severity="secondary"
            text
            size="small"
            @click="resetarForm"
            v-tooltip.top="'Voltar ao modo de inclusão'"
          />
        </div>

        <div class="grid grid-cols-12 gap-3 items-start">
          <div class="col-span-3">
            <label for="acao_tipo" class="block text-xs font-medium mb-1">Nome/Tipo da Ação *</label>
            <AutoComplete
              id="acao_tipo"
              v-model="form.acao"
              :suggestions="acoesFiltradasSugestoes"
              @complete="filtrarSugestoes"
              placeholder="ex: conceder-perfil"
              class="w-full"
              :invalid="!!errors.acao"
              v-tooltip.top="'Digite livremente ou selecione uma ação (ex: conceder-perfil, view, create)'"
            />
            <small v-if="errors.acao" class="text-red-500 block mt-1">{{ errors.acao.join(' ') }}</small>
          </div>

          <div class="col-span-4">
            <label for="acao_rota" class="block text-xs font-medium mb-1">Nome da Rota *</label>
            <InputText
              id="acao_rota"
              v-model="form.rota"
              placeholder="ex: acl.entidades.conceder-perfil"
              class="w-full font-mono text-sm"
              :invalid="!!errors.rota"
              v-tooltip.top="'Nome exato da rota protegida no Laravel (ex: acl.entidades.conceder-perfil)'"
            />
            <small v-if="errors.rota" class="text-red-500 block mt-1">{{ errors.rota.join(' ') }}</small>
          </div>

          <div class="col-span-5">
            <label for="acao_descricao" class="block text-xs font-medium mb-1">Descrição *</label>
            <InputText
              id="acao_descricao"
              v-model="form.descricao"
              placeholder="ex: Conceder perfil à entidade"
              class="w-full"
              :invalid="!!errors.descricao"
              v-tooltip.top="'Descrição legível da permissão para telas de controle'"
            />
            <small v-if="errors.descricao" class="text-red-500 block mt-1">{{ errors.descricao.join(' ') }}</small>
          </div>
        </div>

        <div class="flex items-center justify-between mt-4 pt-2 border-t border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-2">
            <ToggleSwitch
              v-model="form.ativo"
              id="acao_ativo"
              v-tooltip.top="'Define se esta permissão está ativa no sistema'"
            />
            <label for="acao_ativo" class="text-sm font-medium cursor-pointer">Ativo</label>
          </div>

          <Button
            :label="editandoAcaoId ? 'Atualizar Ação' : 'Incluir Ação'"
            :icon="editandoAcaoId ? 'pi pi-check' : 'pi pi-plus'"
            @click="salvarAcao"
            :loading="saving"
            v-tooltip.top="editandoAcaoId ? 'Salvar alterações da ação' : 'Vincular nova ação à entidade'"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Fechar" severity="secondary" text @click="close" v-tooltip.top="'Fechar janela'" />
    </template>
  </Dialog>
</template>