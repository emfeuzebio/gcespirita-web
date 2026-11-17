<script setup>
import { entidadesApi } from '@/api/endpoints/entidades';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  entidade: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({
  model: '',
  descricao: '',
  ativo: true,
});

const errors = ref({});
const saving = ref(false);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = props.entidade
        ? {
            model: props.entidade.model ?? '',
            descricao: props.entidade.descricao ?? '',
            ativo: props.entidade.ativo === 'SIM',
          }
        : {
            model: 'App\\Models\\',
            descricao: '',
            ativo: true,
          };
      errors.value = {};
    }
  }
);

function close() {
  emit('update:visible', false);
}

async function salvar() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = {
      ...form.value,
      ativo: form.value.ativo ? 'SIM' : 'NAO',
    };

    if (props.entidade?.id) {
      await entidadesApi.update(props.entidade.id, payload);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Entidade atualizada com sucesso.', life: 3000 });
    } else {
      await entidadesApi.create(payload);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Entidade criada com sucesso.', life: 3000 });
    }
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
    :header="entidade?.id ? 'Editar Entidade' : 'Nova Entidade'"
    :modal="true"
    :style="{ width: '550px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="model" class="block text-sm font-medium mb-2">Model (Namespace) *</label>
        <InputText
          id="model"
          v-model="form.model"
          placeholder="Ex: App\Models\Usuario"
          class="w-full font-mono"
          :invalid="!!errors.model"
          autofocus
          v-tooltip.top="'Caminho completo do namespace do Model no Laravel'"
        />
        <small v-if="errors.model" class="text-red-500 block mt-1">{{ errors.model.join(' ') }}</small>
      </div>

      <div>
        <label for="descricao" class="block text-sm font-medium mb-2">Descrição *</label>
        <InputText
          id="descricao"
          v-model="form.descricao"
          placeholder="Ex: Usuários do sistema"
          class="w-full"
          :invalid="!!errors.descricao"
          v-tooltip.top="'Nome descritivo da entidade para exibição e controle'"
        />
        <small v-if="errors.descricao" class="text-red-500 block mt-1">{{ errors.descricao.join(' ') }}</small>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <ToggleSwitch
          v-model="form.ativo"
          id="ativo"
          v-tooltip.top="'Define se esta entidade está ativa no controle de ACL'"
        />
        <label for="ativo" class="font-medium cursor-pointer">Ativo</label>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" v-tooltip.top="'Cancelar operação'" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" v-tooltip.top="'Salvar registro'" />
    </template>
  </Dialog>
</template>