<script setup>
import { escolaridadesApi } from '@/api/endpoints/escolaridades';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  escolaridade: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({ descricao: '', sigla: '' });
const errors = ref({});
const saving = ref(false);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = props.escolaridade
        ? { descricao: props.escolaridade.descricao ?? '', sigla: props.escolaridade.sigla ?? '' }
        : { descricao: '', sigla: '' };
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
    if (props.escolaridade?.id) {
      await escolaridadesApi.update(props.escolaridade.id, form.value);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Escolaridade atualizada.', life: 3000 });
    } else {
      await escolaridadesApi.create(form.value);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Escolaridade criada.', life: 3000 });
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
    :header="escolaridade?.id ? 'Editar escolaridade' : 'Nova escolaridade'"
    :modal="true"
    :style="{ width: '500px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="descricao" class="block text-sm font-medium mb-2">Descrição *</label>
        <InputText id="descricao" v-model="form.descricao" class="w-full" :invalid="!!errors.descricao" maxlength="50" autofocus />
        <small v-if="errors.descricao" class="text-red-500 block mt-1">{{ errors.descricao.join(' ') }}</small>
      </div>

      <div>
        <label for="sigla" class="block text-sm font-medium mb-2">Sigla</label>
        <InputText id="sigla" v-model="form.sigla" class="w-full" :invalid="!!errors.sigla" maxlength="10" />
        <small v-if="errors.sigla" class="text-red-500 block mt-1">{{ errors.sigla.join(' ') }}</small>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" />
    </template>
  </Dialog>
</template>