<script setup>
import { modulosApi } from '@/api/endpoints/modulos';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  modulo: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({
  codigo: '',
  nome: '',
  descricao: '',
  ordem: 0,
  ativo: true,
});

const errors = ref({});
const saving = ref(false);

watch(
  () => props.visible,
  (v) => {
    if (v && props.modulo) {
      form.value = {
        codigo: props.modulo.codigo ?? '',
        nome: props.modulo.nome ?? '',
        descricao: props.modulo.descricao ?? '',
        ordem: props.modulo.ordem ?? 0,
        ativo: props.modulo.ativo === 'SIM',
      };
      errors.value = {};
    }
  }
);

function close() {
  emit('update:visible', false);
}

async function salvar() {
  if (!props.modulo?.id) return;
  saving.value = true;
  errors.value = {};

  try {
    const payload = {
      ...form.value,
      ordem: Number(form.value.ordem),
      ativo: form.value.ativo ? 'SIM' : 'NAO',
    };

    await modulosApi.update(props.modulo.id, payload);
    toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Módulo atualizado com sucesso.', life: 3000 });
    emit('salvo');
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
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="Editar Módulo"
    :modal="true"
    :style="{ width: '550px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="codigo" class="block text-sm font-medium mb-2">Código *</label>
          <InputText
            id="codigo"
            v-model="form.codigo"
            class="w-full font-mono text-sm"
            :invalid="!!errors.codigo"
            disabled
            v-tooltip.top="'Identificador único do módulo (não editável)'"
          />
        </div>
        <div>
          <label for="ordem" class="block text-sm font-medium mb-2">Ordem *</label>
          <InputNumber
            id="ordem"
            v-model="form.ordem"
            class="w-full"
            :invalid="!!errors.ordem"
            showButtons
            :min="0"
            v-tooltip.top="'Ordem de exibição do módulo nos menus'"
          />
          <small v-if="errors.ordem" class="text-red-500 block mt-1">{{ errors.ordem.join(' ') }}</small>
        </div>
      </div>

      <div>
        <label for="nome" class="block text-sm font-medium mb-2">Nome *</label>
        <InputText
          id="nome"
          v-model="form.nome"
          class="w-full"
          :invalid="!!errors.nome"
          autofocus
          v-tooltip.top="'Nome legível do módulo do sistema'"
        />
        <small v-if="errors.nome" class="text-red-500 block mt-1">{{ errors.nome.join(' ') }}</small>
      </div>

      <div>
        <label for="descricao" class="block text-sm font-medium mb-2">Descrição</label>
        <InputText
          id="descricao"
          v-model="form.descricao"
          class="w-full"
          :invalid="!!errors.descricao"
          v-tooltip.top="'Descrição detalhada da finalidade do módulo'"
        />
        <small v-if="errors.descricao" class="text-red-500 block mt-1">{{ errors.descricao.join(' ') }}</small>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <ToggleSwitch
          v-model="form.ativo"
          id="ativo"
          v-tooltip.top="'Define se o módulo está habilitado globalmente'"
        />
        <label for="ativo" class="font-medium cursor-pointer">Ativo</label>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" v-tooltip.top="'Cancelar operação'" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" v-tooltip.top="'Salvar alterações'" />
    </template>
  </Dialog>
</template>