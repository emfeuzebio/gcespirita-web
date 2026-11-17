<script setup>
import { equipesApi } from '@/api/endpoints/equipes';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  equipe: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({ sigla: '', descricao: '', ativo: 'SIM' });
const errors = ref({});
const saving = ref(false);

const ativoOptions = [
  { label: 'Sim', value: 'SIM' },
  { label: 'Não', value: 'NAO' }
];

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = props.equipe
        ? { 
            sigla: props.equipe.sigla ?? '', 
            descricao: props.equipe.descricao ?? '', 
            ativo: props.equipe.ativo ?? 'SIM' 
          }
        : { sigla: '', descricao: '', ativo: 'SIM' };
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
    if (props.equipe?.id) {
      await equipesApi.update(props.equipe.id, form.value);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Equipe atualizada com sucesso.', life: 3000 });
    } else {
      await equipesApi.create(form.value);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Equipe criada com sucesso.', life: 3000 });
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
    :header="equipe?.id ? 'Editar Equipe' : 'Nova Equipe'"
    :modal="true"
    :style="{ width: '500px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="sigla" class="block text-sm font-medium mb-2">Sigla *</label>
        <InputText id="sigla" v-model="form.sigla" class="w-full" :invalid="!!errors.sigla" maxlength="20" autofocus />
        <small v-if="errors.sigla" class="text-red-500 block mt-1">{{ errors.sigla.join(' ') }}</small>
      </div>

      <div>
        <label for="descricao" class="block text-sm font-medium mb-2">Descrição *</label>
        <InputText id="descricao" v-model="form.descricao" class="w-full" :invalid="!!errors.descricao" maxlength="100" />
        <small v-if="errors.descricao" class="text-red-500 block mt-1">{{ errors.descricao.join(' ') }}</small>
      </div>

      <div>
        <label for="ativo" class="block text-sm font-medium mb-2">Ativo *</label>
        <Select id="ativo" v-model="form.ativo" :options="ativoOptions" optionLabel="label" optionValue="value" class="w-full" />
        <small v-if="errors.ativo" class="text-red-500 block mt-1">{{ errors.ativo.join(' ') }}</small>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" />
    </template>
  </Dialog>
</template>