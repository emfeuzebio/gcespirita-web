<script setup>
import { perfisApi } from '@/api/endpoints/perfis';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  perfil: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({
  sigla: '',
  descricao: '',
  observacao: '',
  ativo: true,
  padrao: false
});

const errors = ref({});
const saving = ref(false);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = props.perfil
        ? {
            sigla: props.perfil.sigla ?? '',
            descricao: props.perfil.descricao ?? '',
            observacao: props.perfil.observacao ?? '',
            ativo: props.perfil.ativo === 'SIM',
            padrao: props.perfil.padrao === 'SIM'
          }
        : {
            sigla: '',
            descricao: '',
            observacao: '',
            ativo: true,
            padrao: false
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
    // Converte os booleans do ToggleSwitch de volta para 'SIM' / 'NAO' exigidos pela API
    const payload = {
      ...form.value,
      ativo: form.value.ativo ? 'SIM' : 'NAO',
      padrao: form.value.padrao ? 'SIM' : 'NAO'
    };

    if (props.perfil?.id) {
      await perfisApi.update(props.perfil.id, payload);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Perfil atualizado com sucesso.', life: 3000 });
    } else {
      await perfisApi.create(payload);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Perfil criado com sucesso.', life: 3000 });
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
    :header="perfil?.id ? 'Editar Perfil ACL' : 'Novo Perfil ACL'"
    :modal="true"
    :style="{ width: '600px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="sigla" class="block text-sm font-medium mb-2">Sigla *</label>
          <InputText id="sigla" v-model="form.sigla" class="w-full uppercase" :invalid="!!errors.sigla" autofocus />
          <small v-if="errors.sigla" class="text-red-500 block mt-1">{{ errors.sigla.join(' ') }}</small>
        </div>
        <div>
          <label for="descricao" class="block text-sm font-medium mb-2">Descrição *</label>
          <InputText id="descricao" v-model="form.descricao" class="w-full" :invalid="!!errors.descricao" />
          <small v-if="errors.descricao" class="text-red-500 block mt-1">{{ errors.descricao.join(' ') }}</small>
        </div>
      </div>

      <div>
        <label for="observacao" class="block text-sm font-medium mb-2">Observação</label>
        <Textarea id="observacao" v-model="form.observacao" rows="3" class="w-full" :invalid="!!errors.observacao" />
        <small v-if="errors.observacao" class="text-red-500 block mt-1">{{ errors.observacao.join(' ') }}</small>
      </div>

      <div class="grid grid-cols-2 gap-6 pt-2">
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="form.ativo" id="ativo" />
          <label for="ativo" class="font-medium cursor-pointer">Ativo</label>
          <small v-if="errors.ativo" class="text-red-500 block mt-1">{{ errors.ativo.join(' ') }}</small>
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="form.padrao" id="padrao" />
          <label for="padrao" class="font-medium cursor-pointer">Padrão</label>
          <small v-if="errors.padrao" class="text-red-500 block mt-1">{{ errors.padrao.join(' ') }}</small>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" />
    </template>
  </Dialog>
</template>