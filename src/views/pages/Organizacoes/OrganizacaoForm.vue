<script setup>
import { organizacoesApi } from '@/api/endpoints/organizacoes';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  organizacao: { type: Object, default: null },
  todasOrganizacoes: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({
  nome: '',
  sigla: '',
  subdominio: '',
  cnpj: '',
  tipo: 'MATRIZ',
  organizacao_pai_id: null,
  ativo: 'SIM'
});

const errors = ref({});
const saving = ref(false);

const tipoOptions = [
  { label: 'Matriz', value: 'MATRIZ' },
  { label: 'Filial', value: 'FILIAL' }
];

const ativoOptions = [
  { label: 'Sim', value: 'SIM' },
  { label: 'Não', value: 'NAO' }
];

// Lista apenas as organizações que podem ser matrizes (excluindo a própria se for edição)
const matrizesDisponiveis = computed(() => {
  return props.todasOrganizacoes.filter(o => {
    // Se estiver editando, não pode escolher a si mesma como pai
    if (props.organizacao?.id && o.id === props.organizacao.id) return false;
    return o.tipo === 'MATRIZ' || !o.organizacao_pai_id;
  });
});

watch(
  () => props.visible,
  (v) => {
    if (v) {
      form.value = props.organizacao
        ? {
            nome: props.organizacao.nome ?? '',
            sigla: props.organizacao.sigla ?? '',
            subdominio: props.organizacao.subdominio ?? '',
            cnpj: props.organizacao.cnpj ?? '',
            tipo: props.organizacao.tipo ?? 'MATRIZ',
            organizacao_pai_id: props.organizacao.organizacao_pai_id ?? null,
            ativo: props.organizacao.ativo ?? 'SIM'
          }
        : {
            nome: '',
            sigla: '',
            subdominio: '',
            cnpj: '',
            tipo: 'MATRIZ',
            organizacao_pai_id: null,
            ativo: 'SIM'
          };
      errors.value = {};
    }
  }
);

// Se mudar para MATRIZ, limpa automaticamente o organizacao_pai_id
watch(
  () => form.value.tipo,
  (novoTipo) => {
    if (novoTipo === 'MATRIZ') {
      form.value.organizacao_pai_id = null;
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
    if (props.organizacao?.id) {
      await organizacoesApi.update(props.organizacao.id, form.value);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Organização atualizada com sucesso.', life: 3000 });
    } else {
      await organizacoesApi.create(form.value);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Organização criada com sucesso.', life: 3000 });
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
    :header="organizacao?.id ? 'Editar Organização' : 'Nova Organização'"
    :modal="true"
    :style="{ width: '600px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="nome" class="block text-sm font-medium mb-2">Nome *</label>
        <InputText id="nome" v-model="form.nome" class="w-full" :invalid="!!errors.nome" autofocus />
        <small v-if="errors.nome" class="text-red-500 block mt-1">{{ errors.nome.join(' ') }}</small>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="sigla" class="block text-sm font-medium mb-2">Sigla *</label>
          <InputText id="sigla" v-model="form.sigla" class="w-full" :invalid="!!errors.sigla" />
          <small v-if="errors.sigla" class="text-red-500 block mt-1">{{ errors.sigla.join(' ') }}</small>
        </div>
        <div>
          <label for="subdominio" class="block text-sm font-medium mb-2">Subdomínio *</label>
          <InputText id="subdominio" v-model="form.subdominio" class="w-full" :invalid="!!errors.subdominio" />
          <small v-if="errors.subdominio" class="text-red-500 block mt-1">{{ errors.subdominio.join(' ') }}</small>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="tipo" class="block text-sm font-medium mb-2">Tipo *</label>
          <Select id="tipo" v-model="form.tipo" :options="tipoOptions" optionLabel="label" optionValue="value" class="w-full" />
          <small v-if="errors.tipo" class="text-red-500 block mt-1">{{ errors.tipo.join(' ') }}</small>
        </div>
        <div>
          <label for="cnpj" class="block text-sm font-medium mb-2">CNPJ</label>
          <InputText id="cnpj" v-model="form.cnpj" class="w-full" placeholder="00.000.000/0001-00" :invalid="!!errors.cnpj" />
          <small v-if="errors.cnpj" class="text-red-500 block mt-1">{{ errors.cnpj.join(' ') }}</small>
        </div>
      </div>

      <div v-if="form.tipo === 'FILIAL'">
        <label for="organizacao_pai_id" class="block text-sm font-medium mb-2">Organização Matriz (Pai) *</label>
        <Select
          id="organizacao_pai_id"
          v-model="form.organizacao_pai_id"
          :options="matrizesDisponiveis"
          optionLabel="nome"
          optionValue="id"
          placeholder="Selecione a Matriz"
          class="w-full"
          :invalid="!!errors.organizacao_pai_id"
        />
        <small v-if="errors.organizacao_pai_id" class="text-red-500 block mt-1">{{ errors.organizacao_pai_id.join(' ') }}</small>
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