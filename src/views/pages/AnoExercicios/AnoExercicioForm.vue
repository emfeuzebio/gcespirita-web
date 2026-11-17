<script setup>
import { anoExerciciosApi } from '@/api/endpoints/anoExercicios';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  anoExercicio: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({ ano: new Date().getFullYear() });
const errors = ref({});
const saving = ref(false);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = props.anoExercicio
        ? { ano: props.anoExercicio.ano ?? new Date().getFullYear() }
        : { ano: new Date().getFullYear() };
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
    const payload = { ano: Number(form.value.ano) };
    if (props.anoExercicio?.id) {
      await anoExerciciosApi.update(props.anoExercicio.id, payload);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Ano de exercício atualizado com sucesso.', life: 3000 });
    } else {
      await anoExerciciosApi.create(payload);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Ano de exercício criado com sucesso.', life: 3000 });
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
    :header="anoExercicio?.id ? 'Editar Ano de Exercício' : 'Novo Ano de Exercício'"
    :modal="true"
    :style="{ width: '400px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="ano" class="block text-sm font-medium mb-2">Ano *</label>
        <InputNumber id="ano" v-model="form.ano" :useGrouping="false" class="w-full" :invalid="!!errors.ano" autofocus />
        <small v-if="errors.ano" class="text-red-500 block mt-1">{{ errors.ano.join(' ') }}</small>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" />
    </template>
  </Dialog>
</template>